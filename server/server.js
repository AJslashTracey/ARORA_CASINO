import express from 'express';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import MailChecker from 'mailchecker';
import { sendVerificationEmail } from './emailService.js';










const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });


const { Client } = pkg;
const app = express();
const port = process.env.PORT || 3001;


// CORS
// - Allow local dev origins on any port (Vite, etc.)
// - Allow production client origins explicitly
const allowedOriginPatterns = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
];
function toOrigin(urlLike) {
    if (!urlLike) return null;
    try {
        return new URL(urlLike).origin;
    } catch {
        // Allow passing an origin directly (e.g. https://example.com)
        if (typeof urlLike === 'string' && urlLike.startsWith('http')) return urlLike;
        return null;
    }
}

// Comma-separated list of allowed origins, e.g.
// CORS_ALLOWED_ORIGINS="https://my-frontend.com,https://www.my-frontend.com"
const envAllowedOrigins = String(process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(toOrigin)
    .filter(Boolean);

// CLIENT_URL is used for email links; we also treat its origin as an allowed CORS origin.
const clientUrlOrigin = toOrigin(process.env.CLIENT_URL);

// Backwards-compatible default (your current Railway domain)
const allowedOrigins = new Set([
    'https://capable-success-production.up.railway.app',
    ...envAllowedOrigins,
    ...(clientUrlOrigin ? [clientUrlOrigin] : []),
]);

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser clients (curl, server-to-server, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        if (allowedOriginPatterns.some((re) => re.test(origin))) return callback(null, true);
        return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
}));
app.use(express.json());

// --------------------------------------------------------------------------
// STATIC FILE SERVING (Production: serve built React app)
// --------------------------------------------------------------------------
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Health check endpoint
app.get('/api', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

await client.connect();

// ============================================================================
// GAME ROUNDS (Stats Tracking)
// ============================================================================
// We persist each played round (slots/roulette/coinflip/...) so the client can
// show user statistics (games played, wins, losses, win rate, etc.).
async function ensureUsersTable() {
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                balance DECIMAL(12, 2) DEFAULT 1000.00,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
            ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS street VARCHAR(255),
            ADD COLUMN IF NOT EXISTS city VARCHAR(100),
            ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
            ADD COLUMN IF NOT EXISTS country VARCHAR(100);
        `);
        await client.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 1000.00;
        `);
    } catch (err) {
        console.error('Error ensuring users table:', err);
    }
}

// Stores email verification tokens (some deployments expect a dedicated table)
async function ensureVerificationTokensTable() {
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS verification_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                used BOOLEAN DEFAULT FALSE
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_verification_tokens_used_expires ON verification_tokens(used, expires_at);`);
    } catch (err) {
        console.error('Error ensuring verification_tokens table:', err);
    }
}

async function ensureGameRoundsTable() {
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS game_rounds (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                game VARCHAR(32) NOT NULL,
                bet DECIMAL(12, 2) NOT NULL DEFAULT 0,
                payout DECIMAL(12, 2) NOT NULL DEFAULT 0,
                net DECIMAL(12, 2) NOT NULL DEFAULT 0,
                won BOOLEAN NOT NULL DEFAULT FALSE,
                meta JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_game_rounds_user_created_at ON game_rounds(user_id, created_at DESC);`);
    } catch (err) {
        console.error('Error ensuring game_rounds table:', err);
    }
}

await ensureUsersTable();
await ensureVerificationTokensTable();
await ensureGameRoundsTable();

async function logGameRound({ userId, game, bet, payout, won, meta }) {
    try {
        const betNum = Number(bet) || 0;
        const payoutNum = Number(payout) || 0;
        const netNum = payoutNum - betNum;
        await client.query(
            `INSERT INTO game_rounds (user_id, game, bet, payout, net, won, meta)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, game, betNum, payoutNum, netNum, !!won, meta || null]
        );
    } catch (err) {
        // Stats logging should never break gameplay
        console.error('Error logging game round:', err);
    }
}

// ============================================================================
// CLASSIC SLOTS - Real Reel Logic
// ============================================================================
// 5x3 slot (5 columns, 3 rows) with weighted reel strips, multiple paylines,
// and a proper paytable. This mimics how real slot machines work.
//
// RTP is determined by: reel strip composition × payline patterns × paytable
// Adjust reel strips to tune RTP (more high-value symbols = higher RTP)
// ============================================================================

// Weighted reel strips for each column
// IMPORTANT: Symbols are clustered together so consecutive rows often match
// This creates more winning combinations across paylines
// Low-value: 🍒 🍋 (very common - ~60% of reel)
// Mid-value: 🔔 💎 (common - ~30% of reel)
// High-value: 7️⃣ (rare - 1-2 per reel)
// Special: ⭐ scatter (1 per reel)
const REELS = [
    // Reel 1 (leftmost) - lots of cherries and lemons
    ['🍒','🍒','🍒','🍒','🍒','🍋','🍋','🍋','🍋','🔔','🔔','🔔','💎','💎','7️⃣','⭐'],
    // Reel 2 - similar distribution
    ['🍒','🍒','🍒','🍒','🍋','🍋','🍋','🍋','🍋','🔔','🔔','🔔','💎','💎','7️⃣','⭐'],
    // Reel 3 (center) - slightly more mids for bigger wins
    ['🍒','🍒','🍒','🍒','🍋','🍋','🍋','🍋','🔔','🔔','🔔','🔔','💎','💎','💎','7️⃣','⭐'],
    // Reel 4 - back to normal
    ['🍒','🍒','🍒','🍒','🍋','🍋','🍋','🍋','🍋','🔔','🔔','🔔','💎','💎','7️⃣','⭐'],
    // Reel 5 (rightmost) - slightly more cherries for 5-of-a-kind potential
    ['🍒','🍒','🍒','🍒','🍒','🍋','🍋','🍋','🍋','🔔','🔔','🔔','💎','💎','7️⃣','⭐'],
];

// Paylines: each array defines which row to check for each column
// [row for col0, row for col1, row for col2, row for col3, row for col4]
// Row indices: 0 = top, 1 = middle, 2 = bottom
const PAYLINES = [
    [1, 1, 1, 1, 1], // Line 1: middle row (straight across)
    [0, 0, 0, 0, 0], // Line 2: top row
    [2, 2, 2, 2, 2], // Line 3: bottom row
    [0, 1, 2, 1, 0], // Line 4: V shape
    [2, 1, 0, 1, 2], // Line 5: inverted V (^)
    [0, 0, 1, 2, 2], // Line 6: descending slope
    [2, 2, 1, 0, 0], // Line 7: ascending slope
    [1, 0, 0, 0, 1], // Line 8: top plateau
    [1, 2, 2, 2, 1], // Line 9: bottom plateau
    [0, 1, 1, 1, 0], // Line 10: slight V
];

// Paytable: symbol → { matchCount: multiplier }
// Multipliers are applied to bet-per-line
// Requires consecutive matches from LEFT to RIGHT
// Note: With 10 paylines, bet is split 10 ways, so multiply these by 10 for "total bet" perspective
const PAYTABLE = {
    '🍒': { 3: 5,   4: 15,  5: 40   },  // Low value - very common, small wins
    '🍋': { 3: 8,   4: 25,  5: 60   },  // Low value - common
    '🔔': { 3: 15,  4: 50,  5: 150  },  // Mid value - less common
    '💎': { 3: 25,  4: 100, 5: 300  },  // Mid-high value - rare
    '7️⃣': { 3: 50,  4: 200, 5: 1000 },  // High value - jackpot symbol, very rare
};

// Scatter symbol pays based on total count anywhere on grid (not paylines)
const SCATTER_SYMBOL = '⭐';
const SCATTER_PAYS = { 3: 5, 4: 20, 5: 100 }; // Multiplied by TOTAL bet

// Spin the reels - returns a 3x5 grid (3 rows, 5 columns)
function spinReels() {
    const rows = 3;
    const cols = REELS.length;
    const grid = [];

    // Initialize empty grid
    for (let row = 0; row < rows; row++) {
        grid.push([]);
    }

    // For each reel (column), pick a random stop position
    for (let col = 0; col < cols; col++) {
        const reel = REELS[col];
        const reelLength = reel.length;
        const stopIndex = crypto.randomInt(0, reelLength);

        // Fill 3 visible rows from the stop position
        for (let row = 0; row < rows; row++) {
            const symbolIndex = (stopIndex + row) % reelLength;
            grid[row][col] = reel[symbolIndex];
        }
    }

    return grid; // grid[row][col]
}

// Evaluate all paylines and calculate total win
function evaluatePaylines(grid, betPerLine) {
    let totalWin = 0;
    const winningLines = [];

    for (let lineIndex = 0; lineIndex < PAYLINES.length; lineIndex++) {
        const line = PAYLINES[lineIndex];
        
        // Get symbols on this payline
        const symbolsOnLine = [];
        for (let col = 0; col < 5; col++) {
            const rowIndex = line[col];
            symbolsOnLine.push(grid[rowIndex][col]);
        }

        // Count consecutive matching symbols from left
        const firstSymbol = symbolsOnLine[0];
        
        // Skip if first symbol is scatter (scatters don't pay on lines)
        if (firstSymbol === SCATTER_SYMBOL) continue;

        let matchCount = 1;
        for (let i = 1; i < symbolsOnLine.length; i++) {
            if (symbolsOnLine[i] === firstSymbol) {
                matchCount++;
            } else {
                break; // Stop counting at first non-match
            }
        }

        // Check paytable for this symbol and match count
        const payDef = PAYTABLE[firstSymbol];
        if (payDef && payDef[matchCount]) {
            const lineWin = payDef[matchCount] * betPerLine;
            totalWin += lineWin;
            winningLines.push({
                lineIndex: lineIndex + 1, // 1-based for display
                symbol: firstSymbol,
                count: matchCount,
                multiplier: payDef[matchCount],
                win: lineWin,
                positions: line, // Which rows were checked
            });
        }
    }

    return { lineWins: totalWin, winningLines };
}

// Evaluate scatter wins (count anywhere on grid)
function evaluateScatters(grid, totalBet) {
    let scatterCount = 0;

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            if (grid[row][col] === SCATTER_SYMBOL) {
                scatterCount++;
            }
        }
    }

    const multiplier = SCATTER_PAYS[scatterCount] || 0;
    const scatterWin = totalBet * multiplier;

    return {
        scatterWin,
        scatterCount,
        scatterMultiplier: multiplier,
    };
}

// Address validation functions
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

const validateStreet = (street) => {
    const clean = sanitizeInput(street);
    return clean.length >= 5 && clean.length <= 255 && /^[a-zA-Z0-9\s\-\.,#]+$/.test(clean);
};

const validateCity = (city) => {
    const clean = sanitizeInput(city);
    // Support international characters (ü, ö, ä, é, etc.) for city names
    // Place hyphen at the end of character class to avoid escape issues
    return clean.length >= 2 && clean.length <= 100 && /^[\p{L}\s'\-]+$/u.test(clean);
};

const validatePostalCode = (postalCode, country = '') => {
    const clean = sanitizeInput(postalCode);
    
    if (clean.length < 3 || clean.length > 20) {
        return false;
    }
    
    if (!/^[a-zA-Z0-9\s\-]+$/.test(clean)) {
        return false;
    }
    
    const countryPatterns = {
        'US': /^\d{5}(-\d{4})?$/,
        'CA': /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
        'GB': /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
        'DE': /^\d{5}$/,
        'FR': /^\d{5}$/,
        'IT': /^\d{5}$/,
        'ES': /^\d{5}$/,
        'AU': /^\d{4}$/,
        'NL': /^\d{4}\s?[A-Z]{2}$/i,
    };
    
    if (country && countryPatterns[country.toUpperCase()]) {
        return countryPatterns[country.toUpperCase()].test(clean);
    }
    
    return true;
};

const validateCountry = (country) => {
    const clean = sanitizeInput(country);
    return clean.length >= 2 && clean.length <= 100 && /^[a-zA-Z\s]+$/.test(clean);
};

// OpenPLZ API address verification
const verifyAddressWithOpenPLZ = async (street, city, postalCode, country) => {
    // Map country names to API country codes
    const countryMap = {
        'deutschland': 'de',
        'germany': 'de',
        'österreich': 'at',
        'austria': 'at',
        'schweiz': 'ch',
        'switzerland': 'ch',
        'liechtenstein': 'li'
    };

    const countryCode = countryMap[country.toLowerCase()];
    
    // If country not supported by OpenPLZ API, skip verification
    if (!countryCode) {
        return { isValid: true, message: 'Country not covered by address verification' };
    }

    try {
        // Step 1: Verify postal code and city combination
        const localityUrl = `https://openplzapi.org/${countryCode}/Localities?postalCode=${encodeURIComponent(postalCode)}`;
        const localityResponse = await fetch(localityUrl);
        
        if (!localityResponse.ok) {
            console.warn('OpenPLZ API not reachable, skipping verification');
            return { isValid: true, warning: 'Address verification service unavailable' };
        }
        
        const localities = await localityResponse.json();
        
        // Check if any locality matches the provided city
        const cityMatch = localities.some(loc => 
            loc.name.toLowerCase().includes(city.toLowerCase()) || 
            city.toLowerCase().includes(loc.name.toLowerCase())
        );
        
        if (!cityMatch) {
            return { 
                isValid: false, 
                error: 'Postal code and city do not match. Please verify your address.' 
            };
        }
        
        // Step 2: Verify street (optional check - not all streets may be in database)
        const streetUrl = `https://openplzapi.org/${countryCode}/Streets?name=${encodeURIComponent(street)}&postalCode=${encodeURIComponent(postalCode)}`;
        const streetResponse = await fetch(streetUrl);
        
        if (streetResponse.ok) {
            const streets = await streetResponse.json();
            
            if (streets && streets.length > 0) {
                // Street found in database - perfect!
                return { isValid: true, verified: true };
            }
        }
        
        // Street not found, but postal code and city match
        // This is OK as not all streets are in the database
        return { 
            isValid: true, 
            verified: 'partial',
            message: 'Postal code and city verified. Street could not be confirmed.' 
        };
        
    } catch (error) {
        console.error('OpenPLZ API error:', error.message);
        // Fail-safe: Allow registration even if API fails
        return { isValid: true, warning: 'Address verification unavailable' };
    }
};

app.post('/api/signup', async (req, res) => {
    const { username, email, password, street, city, postalCode, country } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Validate address fields
    if (!street || !city || !postalCode || !country) {
        return res.status(400).json({ error: 'All address fields are required.' });
    }

    // Validate address components
    if (!validateStreet(street)) {
        return res.status(400).json({ error: 'Invalid street address format.' });
    }

    if (!validateCity(city)) {
        return res.status(400).json({ error: 'Invalid city format.' });
    }

    if (!validatePostalCode(postalCode, country)) {
        return res.status(400).json({ error: 'Invalid postal code format for the specified country.' });
    }

    if (!validateCountry(country)) {
        return res.status(400).json({ error: 'Invalid country format.' });
    }

    // Verify address using OpenPLZ API (for supported countries)
    const addressVerification = await verifyAddressWithOpenPLZ(street, city, postalCode, country);
    
    if (!addressVerification.isValid) {
        return res.status(400).json({ 
            error: addressVerification.error || 'Address verification failed. Please check your address details.'
        });
    }
    
    // Log verification status for debugging
    if (addressVerification.warning) {
        console.log('Address verification warning:', addressVerification.warning);
    }
    if (addressVerification.verified) {
        console.log('Address verified:', addressVerification.verified === true ? 'fully' : 'partially');
    }

    // Validate email format and check if it's not from a disposable email provider
    if (!MailChecker.isValid(email)) {
        return res.status(400).json({ 
            error: 'Please use a valid, non-disposable email address. Temporary email services are not allowed.' 
        });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create user with email_verified = TRUE (no email verification required)
        const query = `
            INSERT INTO users (username, email, password_hash, balance, email_verified, street, city, postal_code, country)
            VALUES ($1, $2, $3, 1000.00, TRUE, $4, $5, $6, $7)
            RETURNING id, username, email, balance, email_verified;
        `;
        const values = [
            username, 
            email, 
            password_hash, 
            sanitizeInput(street),
            sanitizeInput(city),
            sanitizeInput(postalCode),
            sanitizeInput(country)
        ];

        const result = await client.query(query, values);
        const user = result.rows[0];

        res.status(201).json({
            ...user,
            message: 'Account created successfully! You can now sign in.'
        });

    } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
            res.status(409).json({ error: 'Username or email already exists.' });
        } else {
            console.error('Error during sign-up:', error);
            res.status(500).json({ error: 'An internal server error occurred.' });
        }
    }
});

// Spin endpoint for Classic Slots
app.post('/api/slots/spin', async (req, res) => {
    const { bet, userId } = req.body;

    if (typeof bet !== 'number' || bet <= 0) {
        return res.status(400).json({ error: 'Bet must be a positive number.' });
    }

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        // Get current balance and verification status from database
        const balanceQuery = 'SELECT balance, email_verified FROM users WHERE id = $1';
        const balanceResult = await client.query(balanceQuery, [userId]);

        if (balanceResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const user = balanceResult.rows[0];
        const currentBalance = parseFloat(user.balance);

        if (currentBalance < bet) {
            return res.status(400).json({ error: 'Insufficient balance for this bet.' });
        }

        const linesCount = PAYLINES.length;
        const betPerLine = bet / linesCount;
        const totalBet = bet;

        // Spin the reels (true random based on weighted reel strips)
        const grid = spinReels();

        // Evaluate payline wins
        const { lineWins, winningLines } = evaluatePaylines(grid, betPerLine);

        // Evaluate scatter wins
        const { scatterWin, scatterCount, scatterMultiplier } = evaluateScatters(grid, totalBet);

        // Calculate total
        const totalWin = lineWins + scatterWin;
        const newBalance = currentBalance - totalBet + totalWin;

        // Update balance in database
        const updateQuery = 'UPDATE users SET balance = $1 WHERE id = $2';
        await client.query(updateQuery, [newBalance, userId]);

        // Log round for statistics
        await logGameRound({
            userId,
            game: 'slots',
            bet: totalBet,
            payout: totalWin,
            won: totalWin > 0,
            meta: {
                linesPlayed: linesCount,
                betPerLine,
                scatterCount,
                scatterWin,
                lineWins,
            }
        });

        return res.json({
            reels: grid,
            winAmount: totalWin,
            newBalance,
            breakdown: {
                linesPlayed: linesCount,
                betPerLine: betPerLine,
                lineWins: lineWins,
                winningLines: winningLines,
                scatterCount: scatterCount,
                scatterWin: scatterWin,
                scatterMultiplier: scatterMultiplier,
            },
        });
    } catch (error) {
        console.error('Error during spin:', error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// Spin endpoint for Roulette
app.post('/api/roulette/spin', async (req, res) => {
    const { bets, userId } = req.body;

    if (!Array.isArray(bets) || bets.length === 0) {
        return res.status(400).json({ error: 'Bets are required.' });
    }

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        // Get current balance and verification status from database
        const balanceQuery = 'SELECT balance, email_verified FROM users WHERE id = $1';
        const balanceResult = await client.query(balanceQuery, [userId]);

        if (balanceResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const user = balanceResult.rows[0];
        const currentBalance = parseFloat(user.balance);
        const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);

        if (currentBalance < totalBet) {
            return res.status(400).json({ error: 'Insufficient balance for this bet.' });
        }

        // Generate random number (0-36)
        const winningNumber = crypto.randomInt(0, 37);

        // Calculate winnings
        const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        const BET_PAYOUTS = {
            straight: 35, red: 1, black: 1, odd: 1, even: 1,
            low: 1, high: 1, dozen: 2, column: 2
        };

        const getNumberColor = (num) => {
            if (num === 0) return "green";
            return RED_NUMBERS.includes(num) ? "red" : "black";
        };

        const checkBetWin = (bet, num) => {
            const color = getNumberColor(num);
            switch (bet.type) {
                case "straight": return bet.value === num;
                case "red": return color === "red";
                case "black": return color === "black";
                case "odd": return num !== 0 && num % 2 === 1;
                case "even": return num !== 0 && num % 2 === 0;
                case "low": return num >= 1 && num <= 18;
                case "high": return num >= 19 && num <= 36;
                case "dozen":
                    if (bet.value === "1st") return num >= 1 && num <= 12;
                    if (bet.value === "2nd") return num >= 13 && num <= 24;
                    if (bet.value === "3rd") return num >= 25 && num <= 36;
                    return false;
                case "column":
                    if (bet.value === 1) return num !== 0 && num % 3 === 1;
                    if (bet.value === 2) return num !== 0 && num % 3 === 2;
                    if (bet.value === 3) return num !== 0 && num % 3 === 0;
                    return false;
                default: return false;
            }
        };

        let totalWin = 0;
        for (const bet of bets) {
            if (checkBetWin(bet, winningNumber)) {
                const payout = BET_PAYOUTS[bet.type] || 0;
                totalWin += bet.amount * (payout + 1);
            }
        }

        const newBalance = currentBalance - totalBet + totalWin;

        // Update balance in database
        const updateQuery = 'UPDATE users SET balance = $1 WHERE id = $2';
        await client.query(updateQuery, [newBalance, userId]);

        // Log round for statistics
        await logGameRound({
            userId,
            game: 'roulette',
            bet: totalBet,
            payout: totalWin,
            won: totalWin > 0,
            meta: { winningNumber, bets }
        });

        return res.json({
            winningNumber,
            color: getNumberColor(winningNumber),
            totalWin,
            newBalance,
        });
    } catch (error) {
        console.error('Error during roulette spin:', error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// ============================================================================
// USER STATISTICS
// ============================================================================
app.get('/api/user/:userId/stats', async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'User ID is required.' });

    try {
        // Aggregate stats from game_rounds
        const statsQuery = `
            SELECT
                COUNT(*)::int AS games_played,
                COALESCE(SUM(CASE WHEN won THEN 1 ELSE 0 END), 0)::int AS wins,
                COALESCE(SUM(CASE WHEN won THEN 0 ELSE 1 END), 0)::int AS losses,
                COALESCE(SUM(bet), 0)::numeric AS total_bet,
                COALESCE(SUM(payout), 0)::numeric AS total_payout,
                COALESCE(SUM(net), 0)::numeric AS net
            FROM game_rounds
            WHERE user_id = $1
        `;
        const statsResult = await client.query(statsQuery, [userId]);
        const row = statsResult.rows[0] || {};

        const gamesPlayed = Number(row.games_played || 0);
        const wins = Number(row.wins || 0);
        const losses = Number(row.losses || 0);
        const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

        return res.json({
            gamesPlayed,
            wins,
            losses,
            winRate,
            totalBet: Number(row.total_bet || 0),
            totalPayout: Number(row.total_payout || 0),
            net: Number(row.net || 0),
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

app.post('/api/signin', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await client.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // a good next step would be to generate a JWT token and send it back to the client
        res.status(200).json({
            message: 'Logged in successfully.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                balance: parseFloat(user.balance) || 1000,
                email_verified: user.email_verified
            }
        });

    } catch (error) {
        console.error('Error during sign-in:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// Email verification endpoint
// Supports both:
//   - /api/verify-email/:token
//   - /api/verify-email?token=...
app.get('/api/verify-email/:token?', async (req, res) => {
    let token = req.params.token || req.query.token;

    if (!token) {
        return res.status(400).json({ error: 'Verification token is required.' });
    }

    // Decode URL-encoded token and trim whitespace
    try {
        token = decodeURIComponent(token).trim();
    } catch (e) {
        // If decoding fails, just trim
        token = token.trim();
    }
    // Tokens are hex; normalize case to avoid subtle mismatches
    token = token.toLowerCase();

    console.log('Verification attempt - Token length:', token.length);
    console.log('Verification attempt - Token first 10 chars:', token.substring(0, 10));

    try {
        // Dev-only: print which DB/server we are querying when debugging token issues
        if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
            try {
                const dbInfo = await client.query('SELECT current_database() AS db, inet_server_addr() AS host, inet_server_port() AS port');
                console.log('[debug] verify using db:', dbInfo.rows?.[0]);
            } catch (e) {
                console.warn('[debug] verify dbInfo failed:', e?.message || e);
            }
        }

        // Primary lookup: verification_tokens table (supports idempotency + retries)
        const vtResult = await client.query(
            `SELECT user_id, expires_at, used
             FROM verification_tokens
             WHERE token = $1
             LIMIT 1`,
            [token]
        );

        if (vtResult.rows.length > 0) {
            const vt = vtResult.rows[0];

            // Expired token
            if (vt.expires_at && new Date(vt.expires_at) <= new Date()) {
                return res.status(400).json({
                    error: 'Verification token has expired. Please request a new verification email.'
                });
            }

            // If token already used, return a friendly idempotent success response
            if (vt.used) {
                const u = await client.query(
                    `SELECT id, username, email, email_verified FROM users WHERE id = $1`,
                    [vt.user_id]
                );
                return res.status(200).json({
                    success: true,
                    alreadyVerified: true,
                    message: 'Email already verified. You can sign in now.',
                    user: u.rows?.[0] || null
                });
            }

            // Verify user (if not already)
            const u = await client.query(
                `SELECT id, username, email, email_verified FROM users WHERE id = $1`,
                [vt.user_id]
            );
            if (u.rows.length === 0) {
                return res.status(400).json({
                    error: 'Invalid verification token. The token does not exist. Please request a new verification email.'
                });
            }
            const user = u.rows[0];
            if (user.email_verified) {
                await client.query(`UPDATE verification_tokens SET used = TRUE WHERE token = $1`, [token]);
                return res.status(200).json({
                    success: true,
                    alreadyVerified: true,
                    message: 'Email already verified. You can sign in now.',
                    user
                });
            }

            const updateResult = await client.query(
                `UPDATE users
                 SET email_verified = TRUE,
                     verification_token = NULL,
                     verification_token_expires = NULL
                 WHERE id = $1
                 RETURNING id, username, email, email_verified`,
                [user.id]
            );
            await client.query(`UPDATE verification_tokens SET used = TRUE WHERE token = $1`, [token]);

            return res.status(200).json({
                success: true,
                message: 'Email verified successfully! You can now access all features.',
                user: updateResult.rows[0]
            });
        }

        // Fallback (legacy): users table token column
        const checkTokenQuery = `SELECT id, email, email_verified, verification_token_expires FROM users WHERE verification_token = $1`;
        const checkResult = await client.query(checkTokenQuery, [token]);
        if (checkResult.rows.length === 0) {
            console.log('Token not found in database');
            // Dev-only: try a safe prefix search to detect truncation/encoding mismatches without logging full tokens
            if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
                try {
                    const prefix = token.substring(0, 10);
                    const prefixMatches = await client.query(
                        `SELECT id, email_verified, LEFT(verification_token, 10) AS token_prefix
                         FROM users
                         WHERE verification_token IS NOT NULL
                           AND verification_token LIKE $1
                         ORDER BY id DESC
                         LIMIT 5`,
                        [`${prefix}%`]
                    );
                    const recentTokens = await client.query(
                        `SELECT id, email_verified, LEFT(verification_token, 10) AS token_prefix
                         FROM users
                         WHERE verification_token IS NOT NULL
                         ORDER BY id DESC
                         LIMIT 5`
                    );
                    console.log('[debug] verify prefix matches:', {
                        prefix,
                        count: prefixMatches.rows.length,
                        rows: prefixMatches.rows
                    });
                    console.log('[debug] verify recent tokens (prefixes):', recentTokens.rows);
                } catch (e) {
                    console.warn('[debug] verify prefix diagnostics failed:', e?.message || e);
                }
            }
            return res.status(400).json({
                error: 'Invalid verification token. The token does not exist. Please request a new verification email.'
            });
        }

        const userCheck = checkResult.rows[0];
        if (userCheck.email_verified) {
            return res.status(200).json({
                success: true,
                alreadyVerified: true,
                message: 'Email already verified. You can sign in now.',
                user: { id: userCheck.id, email: userCheck.email, email_verified: true }
            });
        }
        if (userCheck.verification_token_expires && new Date(userCheck.verification_token_expires) <= new Date()) {
            return res.status(400).json({
                error: 'Verification token has expired. Please request a new verification email.'
            });
        }

        // Find user with this token that hasn't expired
        const query = `
            SELECT * FROM users 
            WHERE verification_token = $1 
            AND verification_token_expires > NOW()
            AND email_verified = FALSE
        `;
        const result = await client.query(query, [token]);

        if (result.rows.length === 0) {
            console.log('Token validation failed - expired or already verified');
            return res.status(400).json({ 
                error: 'Invalid or expired verification token. Please request a new verification email.' 
            });
        }

        const user = result.rows[0];

        // Update user as verified
        const updateQuery = `
            UPDATE users 
            SET email_verified = TRUE, 
                verification_token = NULL, 
                verification_token_expires = NULL 
            WHERE id = $1
            RETURNING id, username, email, email_verified
        `;
        const updateResult = await client.query(updateQuery, [user.id]);

        // Record token as used (best-effort) for idempotency
        try {
            await client.query(
                `INSERT INTO verification_tokens (user_id, token, expires_at, used)
                 VALUES ($1, $2, NOW(), TRUE)
                 ON CONFLICT (token) DO UPDATE SET used = TRUE`,
                [user.id, token]
            );
        } catch (e) {
            // ignore
        }

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now access all features.',
            user: updateResult.rows[0]
        });

    } catch (error) {
        console.error('Error during email verification:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// Resend verification email endpoint
app.post('/api/resend-verification', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        // Find user by email
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await client.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const user = result.rows[0];

        // Check if already verified
        if (user.email_verified) {
            return res.status(400).json({ error: 'Email is already verified.' });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update user with new token
        const updateQuery = `
            UPDATE users 
            SET verification_token = $1, verification_token_expires = $2 
            WHERE id = $3
        `;
        await client.query(updateQuery, [verificationToken, tokenExpires, user.id]);

        // Persist token row for idempotent verification
        try {
            await client.query(
                `INSERT INTO verification_tokens (user_id, token, expires_at, used)
                 VALUES ($1, $2, $3, FALSE)
                 ON CONFLICT (token) DO NOTHING`,
                [user.id, verificationToken, tokenExpires]
            );
        } catch (e) {
            console.warn('Warning: failed to persist resend verification token row:', e?.message || e);
        }

        // Send verification email
        const emailResult = await sendVerificationEmail(email, user.username, verificationToken);

        if (!emailResult.success) {
            return res.status(500).json({ error: 'Failed to send verification email. Please try again later.' });
        }

        res.status(200).json({
            success: true,
            message: 'Verification email sent! Please check your inbox.'
        });

    } catch (error) {
        console.error('Error resending verification email:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// Get user balance
app.get('/api/user/:userId/balance', async (req, res) => {
    const { userId } = req.params;

    try {
        const query = 'SELECT balance FROM users WHERE id = $1';
        const result = await client.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ balance: parseFloat(result.rows[0].balance) });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// Update user balance (for deposits, etc.)
app.put('/api/user/:userId/balance', async (req, res) => {
    const { userId } = req.params;
    const { balance } = req.body;

    if (typeof balance !== 'number' || balance < 0) {
        return res.status(400).json({ error: 'Balance must be a non-negative number.' });
    }

    try {
        const query = 'UPDATE users SET balance = $1 WHERE id = $2 RETURNING balance';
        const result = await client.query(query, [balance, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ balance: parseFloat(result.rows[0].balance) });
    } catch (error) {
        console.error('Error updating balance:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// --------------------------------------------------------------------------
// CATCH-ALL: Serve React app for any non-API routes (client-side routing)
// --------------------------------------------------------------------------
app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

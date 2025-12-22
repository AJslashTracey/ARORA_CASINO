import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;





// Resolve the correct path to the .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });



console.log(process.env.DATABASE_URL);


const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});





async function createUsersTable() {
    try {
        await client.connect();
        
        // Create users table if it doesn't exist
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                balance DECIMAL(12, 2) DEFAULT 1000.00,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await client.query(createTableQuery);
        console.log('"users" table created successfully.');
        
        // Add balance column if it doesn't exist (for existing databases)
        const addBalanceColumn = `
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 1000.00;
        `;
        await client.query(addBalanceColumn);
        console.log('Balance column ensured.');
        
        // Add email verification columns if they don't exist
        const addEmailVerificationColumns = `
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
            ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;
        `;
        await client.query(addEmailVerificationColumns);
        console.log('Email verification columns ensured.');
        
        // Add address columns if they don't exist
        const addAddressColumns = `
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS street VARCHAR(255),
            ADD COLUMN IF NOT EXISTS city VARCHAR(100),
            ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
            ADD COLUMN IF NOT EXISTS country VARCHAR(100);
        `;
        await client.query(addAddressColumns);
        console.log('Address columns ensured.');
        
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        await client.end();
    }
}

createUsersTable();










import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "./utils/api";

// All available slot symbols (emojis)
const ALL_SYMBOLS = ["🍒", "💎", "7️⃣", "🍋", "🔔", "⭐", "🍀", "💰"];

function randomSymbol() {
  return ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
}

function generateInitialReels() {
  // 3 rows, 5 columns
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 5 }, () => randomSymbol())
  );
}

// Payline definitions (must match server)
const PAYLINES = [
  [1, 1, 1, 1, 1], // Line 1: middle row
  [0, 0, 0, 0, 0], // Line 2: top row
  [2, 2, 2, 2, 2], // Line 3: bottom row
  [0, 1, 2, 1, 0], // Line 4: V shape
  [2, 1, 0, 1, 2], // Line 5: inverted V
  [0, 0, 1, 2, 2], // Line 6: descending slope
  [2, 2, 1, 0, 0], // Line 7: ascending slope
  [1, 0, 0, 0, 1], // Line 8: top plateau
  [1, 2, 2, 2, 1], // Line 9: bottom plateau
  [0, 1, 1, 1, 0], // Line 10: slight V
];

// Animation speed presets
const SPEED_PRESETS = {
  fast: {
    label: "Fast",
    spinDuration: 0.6,      // Base duration for reel spin animation
    spinStagger: 0.08,      // Delay between each column
    spinWait: 800,          // Time before showing results (ms)
    winPopupDuration: 2500, // How long win popup stays (ms)
  },
  normal: {
    label: "Normal",
    spinDuration: 1.2,
    spinStagger: 0.15,
    spinWait: 1800,
    winPopupDuration: 4000,
  },
  chill: {
    label: "Chill",
    spinDuration: 2.0,
    spinStagger: 0.25,
    spinWait: 3000,
    winPopupDuration: 5000,
  },
};

// Floating particles component
const FloatingParticles = React.memo(function FloatingParticles({ count = 20, isWin = false }) {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    })), [count]
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full ${
            isWin 
              ? "bg-gradient-to-r from-yellow-400 to-amber-300" 
              : "bg-gradient-to-r from-purple-400/40 to-blue-400/40"
          }`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
});

// Confetti explosion for big wins
const Confetti = React.memo(function Confetti({ active }) {
  const pieces = useMemo(() => 
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'][i % 8],
      x: 50 + (Math.random() - 0.5) * 20,
      angle: (Math.random() - 0.5) * 720,
      velocity: Math.random() * 400 + 200,
      direction: (Math.random() - 0.5) * 2,
    })), []
  );

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="absolute w-3 h-3"
          style={{
            left: `${p.x}%`,
            top: '50%',
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            y: [0, -p.velocity, p.velocity * 2],
            x: [0, p.direction * 200],
            rotate: [0, p.angle],
            opacity: [1, 1, 0],
            scale: [1, 1.2, 0.5],
          }}
          transition={{
            duration: 2.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
});

// Animated streak fire effect
const StreakFire = React.memo(function StreakFire({ streak }) {
  if (streak < 2) return null;
  
  const intensity = Math.min(streak, 5);
  
  return (
    <motion.div 
      className="absolute -inset-2 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {Array.from({ length: intensity * 3 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 w-4 rounded-full"
          style={{
            left: `${10 + (i * 15) % 80}%`,
            background: `linear-gradient(to top, #FF6B35, #F7931E, transparent)`,
            height: `${20 + Math.random() * 30}%`,
            filter: 'blur(4px)',
          }}
          animate={{
            height: ['20%', '40%', '20%'],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 0.3 + Math.random() * 0.3,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </motion.div>
  );
});

// Neon border glow
const NeonBorder = React.memo(function NeonBorder({ active, color = "purple" }) {
  const colors = {
    purple: "from-purple-500 via-pink-500 to-purple-500",
    gold: "from-yellow-400 via-amber-300 to-yellow-400",
    green: "from-emerald-400 via-green-300 to-emerald-400",
  };

  return (
    <motion.div
      className={`absolute -inset-1 rounded-3xl bg-gradient-to-r ${colors[color]} opacity-0 blur-lg`}
      animate={{
        opacity: active ? [0.3, 0.6, 0.3] : 0,
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
});

// Jackpot-style animated number
const AnimatedBalance = React.memo(function AnimatedBalance({ value, previousValue }) {
  const [displayValue, setDisplayValue] = useState(value);
  const isIncreasing = value > previousValue;

  useEffect(() => {
    if (value !== previousValue) {
      let start = previousValue;
      const end = value;
      const duration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(start + (end - start) * eased);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [value, previousValue]);

  return (
    <motion.p 
      className={`text-2xl font-bold tabular-nums ${isIncreasing ? 'text-emerald-400' : ''}`}
      animate={isIncreasing ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      ${displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </motion.p>
  );
});

export default function ClassicSlotsPage() {
  const [balance, setBalance] = useState(0);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [bet, setBet] = useState(5);
  const [customBetInput, setCustomBetInput] = useState("");
  const [showCustomBetModal, setShowCustomBetModal] = useState(false);
  const [autoSpinsRemaining, setAutoSpinsRemaining] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reels, setReels] = useState(generateInitialReels);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState(null);
  const [winningPositions, setWinningPositions] = useState(new Set());
  const [scatterPositions, setScatterPositions] = useState(new Set());
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winPopupData, setWinPopupData] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState("normal");
  const [user, setUser] = useState(null);
  const [winStreak, setWinStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [multiplierFlash, setMultiplierFlash] = useState(null);

  // Load user and balance from server
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      apiRequest(`/user/${userData.id}/balance`, { method: 'GET' })
        .then((data) => {
          if (data.balance !== undefined) {
            setBalance(data.balance);
            setPreviousBalance(data.balance);
          }
        })
        .catch(err => console.error('Failed to fetch balance:', err));
    }
  }, []);

  const speedSettings = SPEED_PRESETS[animationSpeed];
  const canSpin = bet > 0 && balance >= bet && !isSpinning && user;
  const hasWin = !isSpinning && lastResult && lastResult.win > 0;
  const isBigWin = hasWin && lastResult.win >= bet * 5;
  const isJackpot = hasWin && lastResult.win >= bet * 20;

  const handleSpin = useCallback(async () => {
    if (bet <= 0 || balance < bet || isSpinning || !user) return;

    setIsSpinning(true);
    setError(null);
    setWinningPositions(new Set());
    setScatterPositions(new Set());
    setShowConfetti(false);
    setMultiplierFlash(null);

    try {
      const data = await apiRequest("/slots/spin", {
        method: "POST",
        body: { bet, userId: user.id },
      });

      const result = {
        bet,
        win: data.winAmount,
        balanceAfter: data.newBalance,
        time: new Date().toLocaleTimeString(),
        linesPlayed: data.breakdown?.linesPlayed,
        lineWins: data.breakdown?.lineWins || 0,
        winningLines: data.breakdown?.winningLines || [],
        scatterCount: data.breakdown?.scatterCount || 0,
        scatterWin: data.breakdown?.scatterWin || 0,
      };

      setPreviousBalance(balance);
      setBalance(data.newBalance);
      setLastResult(result);
      setHistory((prev) => [result, ...prev].slice(0, 10));

      // Update win streak
      if (data.winAmount > 0) {
        setWinStreak(prev => prev + 1);
      } else {
        setWinStreak(0);
      }

      if (autoSpinsRemaining > 0) {
        setAutoSpinsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }

      // Calculate winning positions from payline data
      const winPositions = new Set();
      const scatPositions = new Set();

      if (data.breakdown?.winningLines) {
        for (const line of data.breakdown.winningLines) {
          const lineIndex = line.lineIndex - 1;
          const payline = PAYLINES[lineIndex];
          if (payline) {
            for (let col = 0; col < line.count; col++) {
              const row = payline[col];
              winPositions.add(`${row}-${col}`);
            }
          }
        }
      }

      if (data.breakdown?.scatterCount >= 3 && Array.isArray(data.reels)) {
        for (let row = 0; row < data.reels.length; row++) {
          for (let col = 0; col < data.reels[row].length; col++) {
            if (data.reels[row][col] === "⭐") {
              scatPositions.add(`${row}-${col}`);
            }
          }
        }
      }

      setTimeout(() => {
        if (Array.isArray(data.reels)) {
          setReels(data.reels);
        }
        setWinningPositions(winPositions);
        setScatterPositions(scatPositions);
        setIsSpinning(false);

        if (data.winAmount > 0) {
          // Calculate multiplier for flash
          const multiplier = Math.round(data.winAmount / bet);
          if (multiplier >= 5) {
            setMultiplierFlash(multiplier);
          }

          // Show confetti for big wins
          if (data.winAmount >= bet * 10) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
          }

          setWinPopupData({
            amount: data.winAmount,
            winningLines: data.breakdown?.winningLines || [],
            scatterCount: data.breakdown?.scatterCount || 0,
            scatterWin: data.breakdown?.scatterWin || 0,
            bet: bet,
          });
          setShowWinPopup(true);
        }
      }, speedSettings.spinWait);
    } catch (e) {
      console.error("Spin error:", e);
      setError(e.message);
      setAutoSpinsRemaining(0);
      setIsSpinning(false);
    }
  }, [bet, balance, isSpinning, autoSpinsRemaining, user, speedSettings.spinWait]);

  const changeBet = (delta) => {
    setBet((prev) => Math.max(1, prev + delta));
  };

  const setQuickBet = (amount) => {
    setBet(amount);
    setCustomBetInput("");
  };

  const handleCustomBetChange = (e) => {
    const value = e.target.value;
    setCustomBetInput(value);
  };

  const applyCustomBet = () => {
    const numValue = parseFloat(customBetInput);
    if (!isNaN(numValue) && numValue > 0) {
      setBet(Math.max(0.01, numValue));
      setShowCustomBetModal(false);
    }
  };

  const cancelCustomBet = () => {
    setShowCustomBetModal(false);
  };

  const startAutoSpin = (count) => {
    if (!canSpin) return;
    setAutoSpinsRemaining(count);
  };

  const stopAutoSpin = () => {
    setAutoSpinsRemaining(0);
  };

  useEffect(() => {
    if (autoSpinsRemaining > 0 && !isSpinning && canSpin) {
      const timer = setTimeout(() => {
        handleSpin();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoSpinsRemaining, isSpinning, canSpin, handleSpin]);

  useEffect(() => {
    if (showWinPopup) {
      const timer = setTimeout(() => {
        setShowWinPopup(false);
      }, speedSettings.winPopupDuration);
      return () => clearTimeout(timer);
    }
  }, [showWinPopup, speedSettings.winPopupDuration]);

  const dismissWinPopup = () => {
    setShowWinPopup(false);
  };

  return (
    <div className="min-h-full relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
        <FloatingParticles count={30} isWin={hasWin} />
        
        {/* Animated aurora effect */}
        <motion.div
          className="absolute top-0 left-1/4 w-1/2 h-1/2 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, 100, -100, 0],
            y: [0, 50, -50, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Confetti for big wins */}
      <Confetti active={showConfetti} />

      {/* Custom Bet Modal */}
      <AnimatePresence>
        {showCustomBetModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelCustomBet}
          >
            <motion.div
              className="relative mx-4 max-w-lg w-full rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated gradient border */}
              <motion.div
                className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ backgroundSize: '200% 200%' }}
              />
              
              <div className="relative bg-gradient-to-b from-purple-900 to-indigo-950 p-8 rounded-3xl">
                <div className="relative z-10">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <motion.div
                      className="text-5xl mb-3"
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      💰
                    </motion.div>
                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 uppercase tracking-wider">
                      Select Bet
                    </h3>
                    <p className="text-sm text-[rgb(var(--fg)/0.6)] mt-2">
                      Choose a preset or enter custom amount
                    </p>
                  </div>

                  {/* Current bet display */}
                  <div className="mb-6 text-center">
                    <p className="text-xs text-softer uppercase tracking-wide mb-2">Current Bet</p>
                    <motion.div 
                      className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ${bet.toFixed(2)}
                    </motion.div>
                  </div>

                  {/* Quick bet presets */}
                  <div className="mb-6">
                    <p className="text-xs text-softer uppercase tracking-wide mb-3 flex items-center gap-2">
                      <span>⚡</span>
                      <span>Quick Bets</span>
                    </p>
                    <div className="space-y-2">
                      {/* First row */}
                      <div className="flex flex-wrap gap-2">
                        {[1, 5, 10, 25, 50, 100].map((amount) => (
                          <motion.button
                            key={amount}
                            type="button"
                            onClick={() => {
                              setQuickBet(amount);
                              setShowCustomBetModal(false);
                            }}
                            className={`flex-1 min-w-[60px] px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                              bet === amount && !customBetInput
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-lg shadow-purple-500/30"
                                : "bg-[rgb(var(--fg)/0.1)] border border-[rgb(var(--fg)/0.2)] hover:border-purple-400/50 hover:bg-purple-500/20"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ${amount}
                          </motion.button>
                        ))}
                      </div>
                      {/* Second row */}
                      <div className="flex flex-wrap gap-2">
                        {[250, 500, 1000, 2500, 5000].map((amount) => (
                          <motion.button
                            key={amount}
                            type="button"
                            onClick={() => {
                              setQuickBet(amount);
                              setShowCustomBetModal(false);
                            }}
                            className={`flex-1 min-w-[70px] px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                              bet === amount && !customBetInput
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-lg shadow-purple-500/30"
                                : "bg-[rgb(var(--fg)/0.1)] border border-[rgb(var(--fg)/0.2)] hover:border-purple-400/50 hover:bg-purple-500/20"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ${amount >= 1000 ? `${amount / 1000}K` : amount}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Custom input section */}
                  <div className="pt-4 border-t border-[rgb(var(--fg)/0.2)] mb-6">
                    <p className="text-xs text-softer uppercase tracking-wide mb-3 flex items-center gap-2">
                      <span>✏️</span>
                      <span>Custom Amount</span>
                    </p>
                    <div className="relative mb-3">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-purple-400">
                        $
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={customBetInput}
                        onChange={handleCustomBetChange}
                        placeholder="Enter custom amount..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') applyCustomBet();
                          if (e.key === 'Escape') cancelCustomBet();
                        }}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-purple-500/30 bg-black/30 text-lg font-semibold focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 transition-all"
                      />
                    </div>
                    {customBetInput && parseFloat(customBetInput) > balance && (
                      <motion.p
                        className="text-xs text-red-400 flex items-center gap-1 mb-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <span>⚠️</span>
                        <span>Amount exceeds your balance (${balance.toFixed(2)})</span>
                      </motion.p>
                    )}
                    {customBetInput && parseFloat(customBetInput) > 0 && parseFloat(customBetInput) <= balance && (
                      <motion.button
                        type="button"
                        onClick={applyCustomBet}
                        className="w-full px-4 py-2.5 rounded-lg font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg hover:shadow-emerald-500/50 transition-all"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Apply ${parseFloat(customBetInput).toFixed(2)}
                      </motion.button>
                    )}
                  </div>

                  {/* Close button */}
                  <motion.button
                    type="button"
                    onClick={cancelCustomBet}
                    className="w-full px-6 py-3 rounded-xl font-bold bg-[rgb(var(--fg)/0.1)] border border-[rgb(var(--fg)/0.2)] hover:bg-[rgb(var(--fg)/0.15)] transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Close
                  </motion.button>

                  <p className="text-xs text-center text-softer mt-3">
                    Press <kbd className="px-2 py-0.5 rounded bg-[rgb(var(--fg)/0.1)] border border-[rgb(var(--fg)/0.2)]">Esc</kbd> to close
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multiplier flash overlay */}
      <AnimatePresence>
        {multiplierFlash && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300"
              style={{ textShadow: '0 0 80px rgba(250, 204, 21, 0.8)' }}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: [0, 1.5, 1], rotate: [0, 5, -5, 0] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.8, ease: "backOut" }}
            >
              {multiplierFlash}×
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win Popup Overlay */}
      <AnimatePresence>
        {showWinPopup && winPopupData && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissWinPopup}
          >
            <motion.div
              className="relative mx-4 max-w-lg w-full rounded-3xl overflow-hidden"
              initial={{ scale: 0.5, y: 50, opacity: 0, rotateX: 45 }}
              animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.8, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated gradient border */}
              <motion.div
                className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ backgroundSize: '200% 200%' }}
              />
              
              <div className="relative bg-gradient-to-b from-[rgb(var(--bg))] to-emerald-950/50 p-8 text-center rounded-3xl">
                {/* Sparkle background */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}
                </div>

              <div className="relative z-10">
                  {/* Trophy/celebration based on win size */}
                <motion.div
                    className="text-7xl mb-4"
                  animate={{ 
                      rotate: [0, -15, 15, -15, 15, 0],
                      scale: [1, 1.3, 1.1, 1.3, 1],
                      y: [0, -10, 0],
                  }}
                    transition={{ duration: 1, delay: 0.2 }}
                >
                    {winPopupData.amount >= winPopupData.bet * 20 ? '👑' :
                     winPopupData.amount >= winPopupData.bet * 10 ? '🏆' : 
                     winPopupData.amount >= winPopupData.bet * 5 ? '🎉' : '✨'}
                </motion.div>

                  {/* Win label with glow */}
                  <motion.div
                    className="mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                    <span className={`text-2xl font-black uppercase tracking-[0.3em] ${
                      winPopupData.amount >= winPopupData.bet * 20 ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300' :
                      winPopupData.amount >= winPopupData.bet * 10 ? 'text-yellow-400' :
                      winPopupData.amount >= winPopupData.bet * 5 ? 'text-emerald-400' : 'text-emerald-300'
                    }`}>
                      {winPopupData.amount >= winPopupData.bet * 20 ? "JACKPOT!" :
                       winPopupData.amount >= winPopupData.bet * 10 ? "MEGA WIN!" : 
                       winPopupData.amount >= winPopupData.bet * 5 ? "BIG WIN!" : "YOU WON!"}
                    </span>
                  </motion.div>

                  {/* Win amount with counter animation */}
                  <motion.div
                    className="relative mb-6"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <motion.span
                      className="text-6xl font-black text-white block"
                      animate={{
                        textShadow: [
                          '0 0 20px rgba(16, 185, 129, 0.5)',
                          '0 0 60px rgba(16, 185, 129, 0.8)',
                          '0 0 20px rgba(16, 185, 129, 0.5)',
                        ],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="text-emerald-400">$</span>
                  {winPopupData.amount.toFixed(2)}
                    </motion.span>
                    
                    {/* Multiplier badge */}
                    <motion.span
                      className="absolute -right-2 -top-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold text-sm px-3 py-1 rounded-full"
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      {Math.round(winPopupData.amount / winPopupData.bet)}×
                    </motion.span>
                  </motion.div>

                {/* Win breakdown */}
                <motion.div
                  className="space-y-2 text-sm text-[rgb(var(--fg)/0.7)] mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {winPopupData.winningLines.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {winPopupData.winningLines.map((line, idx) => (
                          <motion.span
                          key={idx}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + idx * 0.1 }}
                          >
                            <span className="text-emerald-400 font-semibold">Line {line.lineIndex}</span>
                            <span className="text-lg">{line.symbol}</span>
                            <span>×{line.count}</span>
                          </motion.span>
                      ))}
                    </div>
                  )}
                  {winPopupData.scatterCount >= 3 && (
                      <motion.p 
                        className="text-yellow-400 font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        ⭐ Scatter Bonus: {winPopupData.scatterCount}× stars = ${winPopupData.scatterWin.toFixed(2)}
                      </motion.p>
                  )}
                </motion.div>

                  {/* Continue button */}
                <motion.button
                  type="button"
                  onClick={dismissWinPopup}
                    className="relative overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-10 py-4 text-lg font-bold text-white shadow-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(16, 185, 129, 0.6)' }}
                  whileTap={{ scale: 0.95 }}
                >
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                    />
                    <span className="relative">🎰 SPIN AGAIN</span>
                </motion.button>
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar with neon glow */}
      <section className="relative border-b border-[rgb(var(--fg)/0.1)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div>
            <motion.h1 
              className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% 200%' }}
            >
              Classic Slots
            </motion.h1>
            <button
              type="button"
              onClick={() => setShowRules((v) => !v)}
              className="mt-2 text-xs text-purple-300 hover:text-purple-200 border border-purple-500/40 hover:border-purple-400/60 px-3 py-1.5 rounded-full transition-all duration-200 hover:bg-purple-500/10"
            >
              ℹ️ How this game works · Odds &amp; limits
            </button>
          </div>
          
          {/* Balance with streak indicator */}
          <div className="text-right relative">
            {winStreak >= 2 && (
              <motion.div
                className="absolute -top-3 -right-3 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                🔥 {winStreak} streak
              </motion.div>
            )}
            <p className="text-xs text-softer uppercase tracking-wide">
              Balance
            </p>
            <AnimatedBalance value={balance} previousValue={previousBalance} />
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main slot area */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              className="relative overflow-hidden rounded-3xl border-2 p-8"
              style={{
                background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.3) 0%, rgba(30, 27, 75, 0.4) 50%, rgba(88, 28, 135, 0.3) 100%)',
              }}
              animate={
                isSpinning
                  ? {
                      borderColor: ['rgba(251, 191, 36, 0.5)', 'rgba(251, 191, 36, 1)', 'rgba(251, 191, 36, 0.5)'],
                      boxShadow: [
                        '0 0 20px rgba(251, 191, 36, 0.3)',
                        '0 0 60px rgba(251, 191, 36, 0.6)',
                        '0 0 20px rgba(251, 191, 36, 0.3)',
                      ],
                    }
                  : hasWin
                  ? {
                      borderColor: 'rgba(52, 211, 153, 0.8)',
                      boxShadow: '0 0 40px rgba(52, 211, 153, 0.5)',
                    }
                  : {
                      borderColor: 'rgba(139, 92, 246, 0.3)',
                      boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
                    }
              }
              transition={{
                duration: 0.5,
                repeat: isSpinning ? Infinity : 0,
                repeatType: "reverse",
              }}
            >
              {/* Streak fire effect */}
              <StreakFire streak={winStreak} />
              
              {/* Spinning indicator */}
              <AnimatePresence>
              {isSpinning && (
                <motion.div
                    className="absolute inset-x-8 top-4 z-20 flex justify-center"
                    initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <motion.div 
                      className="rounded-full border-2 border-yellow-400/60 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 backdrop-blur-sm px-6 py-2 text-sm font-bold uppercase tracking-[0.2em] text-yellow-200"
                      animate={{ 
                        boxShadow: [
                          '0 0 20px rgba(250, 204, 21, 0.5)',
                          '0 0 40px rgba(250, 204, 21, 0.8)',
                          '0 0 20px rgba(250, 204, 21, 0.5)',
                        ],
                      }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      ⚡ Spinning... ⚡
                    </motion.div>
                </motion.div>
              )}
              </AnimatePresence>

              {/* Reel window */}
              {isSpinning ? (
                <SpinningReels speedSettings={speedSettings} />
              ) : (
                <StaticReels 
                  reels={reels} 
                  hasWin={hasWin} 
                  winningPositions={winningPositions}
                  scatterPositions={scatterPositions}
                  isBigWin={isBigWin}
                />
              )}

              {/* Controls */}
              <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Bet controls */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-softer uppercase tracking-wide font-medium">
                    💰 Bet size
                  </span>
                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      onClick={() => changeBet(-1)}
                      className="btn-ghost px-4 py-2 text-lg font-bold"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      −
                    </motion.button>
                    <motion.div 
                      className="min-w-[120px] rounded-xl border-2 border-purple-500/30 bg-gradient-to-b from-purple-900/50 to-purple-950/50 px-6 py-3 text-center text-xl font-bold"
                      animate={isSpinning ? { opacity: [1, 0.7, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      ${bet.toFixed(2)}
                    </motion.div>
                    <motion.button
                      type="button"
                      onClick={() => changeBet(1)}
                      className="btn-ghost px-4 py-2 text-lg font-bold"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      +
                    </motion.button>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => setShowCustomBetModal(true)}
                    className="w-full px-4 py-3 rounded-lg text-sm font-semibold bg-[rgb(var(--fg)/0.05)] border border-[rgb(var(--fg)/0.2)] hover:border-purple-400/50 hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>💰</span>
                    <span>Select Bet Amount</span>
                  </motion.button>
                </div>

                {/* Spin buttons */}
                <div className="flex flex-1 flex-col items-stretch gap-3 md:items-end">
                  <motion.button
                    type="button"
                    onClick={handleSpin}
                    disabled={!canSpin}
                    className={`relative overflow-hidden w-full md:w-auto px-12 py-4 rounded-2xl text-lg font-black uppercase tracking-wider ${
                      !canSpin 
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed" 
                        : "bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 text-white shadow-xl shadow-emerald-500/30"
                    }`}
                    whileHover={canSpin ? { scale: 1.02, boxShadow: '0 0 40px rgba(16, 185, 129, 0.5)' } : {}}
                    whileTap={canSpin ? { scale: 0.98 } : {}}
                    animate={canSpin && !isSpinning ? {
                      boxShadow: [
                        '0 0 20px rgba(16, 185, 129, 0.3)',
                        '0 0 40px rgba(16, 185, 129, 0.6)',
                        '0 0 20px rgba(16, 185, 129, 0.3)',
                      ],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {canSpin && (
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
                      />
                    )}
                    <span className="relative flex items-center justify-center gap-2">
                      {isSpinning ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            🎰
                          </motion.span>
                          Spinning...
                        </>
                      ) : (
                        <>🎰 SPIN</>
                      )}
                    </span>
                  </motion.button>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="uppercase tracking-wide text-softer font-medium">⚡ Auto spin</span>
                    {[10, 25, 50, 100].map((count) => (
                      <motion.button
                        key={count}
                        type="button"
                        onClick={() => startAutoSpin(count)}
                        className="rounded-lg border border-[rgb(var(--fg)/0.25)] bg-[rgb(var(--fg)/0.05)] px-3 py-1.5 text-xs font-medium hover:border-purple-400/50 hover:bg-purple-500/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {count}×
                      </motion.button>
                    ))}
                    {autoSpinsRemaining > 0 && (
                      <motion.span 
                        className="ml-2 flex items-center gap-2 text-yellow-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          🔄
                        </motion.span>
                        {autoSpinsRemaining} left
                        <button
                          type="button"
                          onClick={stopAutoSpin}
                          className="text-red-400 hover:text-red-300 font-semibold"
                        >
                          ✕ Stop
                        </button>
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Responsible play notice */}
            <motion.div 
              className="rounded-2xl border border-[rgb(var(--fg)/0.1)] bg-[rgb(var(--fg)/0.02)] p-4 flex items-center justify-between gap-4"
              whileHover={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <p className="text-xs text-softer">
                  Please play responsibly. Set limits that work for you.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings((v) => !v)}
                className="btn-ghost px-4 py-2 text-xs font-medium"
              >
                ⚙️ Settings
              </button>
            </motion.div>
          </div>

          {/* Info & history */}
          <div className="space-y-4">
            {/* Last result card */}
            <motion.div 
              className="rounded-2xl border border-[rgb(var(--fg)/0.1)] bg-gradient-to-b from-[rgb(var(--fg)/0.03)] to-transparent p-5"
              animate={hasWin ? { borderColor: 'rgba(52, 211, 153, 0.5)' } : {}}
            >
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                📊 Last result
              </h2>
              {lastResult ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-softer text-sm">Bet</span>
                    <span className="font-semibold">${lastResult.bet.toFixed(2)}</span>
                  </div>
                  
                  <motion.div 
                    className={`text-center py-3 rounded-xl ${
                      lastResult.win > 0 
                        ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30' 
                        : 'bg-[rgb(var(--fg)/0.05)]'
                    }`}
                    animate={lastResult.win > 0 ? { 
                      boxShadow: ['0 0 0 rgba(52, 211, 153, 0)', '0 0 20px rgba(52, 211, 153, 0.3)', '0 0 0 rgba(52, 211, 153, 0)']
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {lastResult.win > 0 ? (
                      <div>
                        <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">You won</p>
                        <p className="text-2xl font-bold text-emerald-400">
                          +${lastResult.win.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-softer">No win this round</p>
                    )}
                  </motion.div>
                  
                  {lastResult.winningLines.length > 0 && (
                    <div className="pt-2 border-t border-[rgb(var(--fg)/0.08)]">
                      <p className="text-xs text-softer mb-2">Winning lines:</p>
                      <div className="space-y-1">
                        {lastResult.winningLines.map((line, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-[rgb(var(--fg)/0.03)] rounded-lg px-2 py-1">
                            <span className="text-softer">Line {line.lineIndex}</span>
                            <span>{line.count}× {line.symbol}</span>
                            <span className="text-emerald-400 font-medium">+${line.win.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {lastResult.scatterCount >= 3 && (
                    <div className="pt-2 border-t border-[rgb(var(--fg)/0.08)]">
                      <div className="flex items-center justify-between text-xs bg-yellow-500/10 rounded-lg px-2 py-1">
                        <span className="text-yellow-400">⭐ Scatter</span>
                        <span>{lastResult.scatterCount}× stars</span>
                        <span className="text-yellow-400 font-medium">+${lastResult.scatterWin.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-softer">
                  <p className="text-3xl mb-2">🎰</p>
                  <p className="text-sm">Place a bet and spin to start!</p>
            </div>
              )}
            </motion.div>

            {/* Recent spins */}
            <div className="rounded-2xl border border-[rgb(var(--fg)/0.1)] bg-[rgb(var(--fg)/0.02)] p-5">
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
                📜 Recent spins
              </h2>
              {history.length === 0 ? (
                <p className="text-sm text-softer text-center py-4">Your spin history will appear here</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between rounded-xl border border-[rgb(var(--fg)/0.08)] bg-[rgb(var(--bg)/0.95)] px-3 py-2 text-xs"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <span className="text-softer">{item.time}</span>
                      <span>-${item.bet.toFixed(2)}</span>
                      <span
                        className={`font-semibold ${
                          item.win > 0 ? "text-emerald-400" : "text-softer"
                        }`}
                      >
                        {item.win > 0 ? `+$${item.win.toFixed(2)}` : "—"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rules panel */}
        <AnimatePresence>
        {showRules && (
            <motion.div
              className="mt-8 rounded-2xl border border-[rgb(var(--fg)/0.12)] bg-[rgb(var(--bg)/0.98)] p-6 text-sm space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
            <h2 className="text-base font-semibold">How this game works</h2>
            <p className="text-softer">
              This 5×3 slot uses weighted reel strips and 10 paylines. All outcomes are 
              calculated on the server using a cryptographically secure random number generator.
            </p>
            
            <div>
              <h3 className="font-medium mb-2">Paytable (multipliers per line bet)</h3>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="font-medium text-softer">Symbol</div>
                <div className="font-medium text-softer text-center">3×</div>
                <div className="font-medium text-softer text-center">4×</div>
                <div className="font-medium text-softer text-center">5×</div>
                
                <div>🍒 Cherry</div>
                <div className="text-center">5×</div>
                <div className="text-center">15×</div>
                <div className="text-center">40×</div>
                
                <div>🍋 Lemon</div>
                <div className="text-center">8×</div>
                <div className="text-center">25×</div>
                <div className="text-center">60×</div>
                
                <div>🔔 Bell</div>
                <div className="text-center">15×</div>
                <div className="text-center">50×</div>
                <div className="text-center">150×</div>
                
                <div>💎 Diamond</div>
                <div className="text-center">25×</div>
                <div className="text-center">100×</div>
                <div className="text-center">300×</div>
                
                <div>7️⃣ Seven</div>
                <div className="text-center">50×</div>
                <div className="text-center">200×</div>
                <div className="text-center text-yellow-500 font-semibold">1000×</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Scatter Symbol</h3>
              <p className="text-softer text-xs">
                ⭐ Star scatters pay anywhere on the grid (not just paylines):
              </p>
              <p className="text-xs mt-1">
                3× = 5× total bet · 4× = 20× total bet · 5× = 100× total bet
              </p>
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings panel */}
        <AnimatePresence>
        {showSettings && (
            <motion.div
              className="mt-4 rounded-2xl border border-[rgb(var(--fg)/0.12)] bg-[rgb(var(--bg)/0.98)] p-6 text-sm space-y-5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
            <h2 className="text-base font-semibold">Session settings</h2>
            
            <div>
              <h3 className="font-medium mb-3">Animation Speed</h3>
                <div className="flex gap-3">
                {Object.entries(SPEED_PRESETS).map(([key, preset]) => (
                    <motion.button
                    key={key}
                    type="button"
                    onClick={() => setAnimationSpeed(key)}
                      className={`flex-1 px-4 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      animationSpeed === key
                          ? "border-purple-500 bg-purple-500/20 text-purple-300"
                          : "border-[rgb(var(--fg)/0.15)] bg-[rgb(var(--fg)/0.03)] text-[rgb(var(--fg)/0.7)] hover:border-[rgb(var(--fg)/0.3)]"
                    }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-center">
                        <span className="block text-2xl mb-1">
                        {key === "fast" ? "⚡" : key === "normal" ? "🎰" : "🌙"}
                      </span>
                        <span className="font-semibold">{preset.label}</span>
                    </div>
                    </motion.button>
                ))}
              </div>
            </div>
            </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Spinning reels with enhanced blur and motion effects
const SpinningReels = React.memo(function SpinningReels({ speedSettings }) {
  const columns = 5;
  const visibleRows = 3;
  const stripLength = 15;
  const tileHeight = 96;
  const containerHeight = tileHeight * visibleRows;
  const travel = tileHeight * stripLength;

  const strips = React.useMemo(() => {
    const makeStrip = () =>
      Array.from({ length: stripLength }, () => randomSymbol());
    return Array.from({ length: columns }, makeStrip);
  }, []);

  return (
    <div className="mb-8 grid grid-cols-5 gap-3 relative">
      {/* Blur overlay for motion effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.3) 100%)',
        }}
      />
      
      {strips.map((strip, colIndex) => (
        <motion.div
          key={colIndex}
          className="relative overflow-hidden rounded-xl border-2 border-purple-500/30"
          style={{ 
            height: containerHeight,
            background: 'linear-gradient(180deg, rgba(88, 28, 135, 0.4) 0%, rgba(30, 27, 75, 0.6) 100%)',
          }}
          animate={{
            borderColor: ['rgba(139, 92, 246, 0.3)', 'rgba(236, 72, 153, 0.5)', 'rgba(139, 92, 246, 0.3)'],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: colIndex * 0.1,
          }}
        >
          <motion.div
            className="flex flex-col"
            animate={{ y: [0, -travel] }}
            transition={{
              duration: speedSettings.spinDuration + colIndex * speedSettings.spinStagger,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ willChange: "transform" }}
          >
            {strip.map((symbol, idx) => (
              <div
                key={idx}
                className="flex h-24 items-center justify-center text-5xl select-none"
                style={{ filter: 'blur(1px)' }}
              >
                {symbol}
              </div>
            ))}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
});

// Static reels with enhanced win animations
const StaticReels = React.memo(function StaticReels({ 
  reels, 
  hasWin, 
  winningPositions, 
  scatterPositions,
  isBigWin,
}) {
  return (
    <div className="mb-8 grid grid-cols-5 gap-3">
      {reels.map((row, rowIndex) =>
        row.map((symbol, colIndex) => {
          const posKey = `${rowIndex}-${colIndex}`;
          const isWinning = winningPositions.has(posKey);
          const isScatter = scatterPositions.has(posKey);
          const shouldAnimate = isWinning || isScatter;

          return (
            <motion.div
              key={posKey}
              className={`relative flex h-24 items-center justify-center rounded-xl border-2 text-5xl select-none overflow-hidden ${
                isWinning
                  ? "border-emerald-400 bg-gradient-to-b from-emerald-500/30 to-emerald-700/30"
                  : isScatter
                  ? "border-yellow-400 bg-gradient-to-b from-yellow-500/30 to-amber-700/30"
                  : "border-purple-500/30 bg-gradient-to-b from-purple-900/40 to-indigo-900/40"
              }`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={
                shouldAnimate
                  ? {
                      scale: [1, 1.15, 1],
                      y: [0, -8, 0],
                      opacity: 1,
                    }
                  : { scale: 1, y: 0, opacity: 1 }
              }
              transition={{
                duration: shouldAnimate ? 0.6 : 0.3,
                repeat: shouldAnimate ? Infinity : 0,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: colIndex * 0.1,
              }}
            >
              {/* Glow effect for winning cells */}
              {shouldAnimate && (
                <>
                <motion.div
                  className={`absolute inset-0 ${
                    isScatter
                        ? "bg-gradient-to-br from-yellow-400/40 via-transparent to-yellow-400/40"
                        : "bg-gradient-to-br from-emerald-400/40 via-transparent to-emerald-400/40"
                    }`}
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                  
                  {/* Sparkle particles */}
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-2 h-2 rounded-full ${
                        isScatter ? "bg-yellow-300" : "bg-emerald-300"
                  }`}
                      style={{
                        left: `${20 + i * 20}%`,
                        top: `${20 + (i % 2) * 60}%`,
                      }}
                  animate={{
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0],
                  }}
                  transition={{
                        duration: 1,
                    repeat: Infinity,
                        delay: i * 0.2,
                  }}
                />
                  ))}
                </>
              )}
              
              {/* Symbol with animation */}
              <motion.span
                className="relative z-10 drop-shadow-lg"
                animate={
                  shouldAnimate
                    ? {
                        rotate: [0, -8, 8, 0],
                        scale: [1, 1.2, 1],
                        filter: [
                          'drop-shadow(0 0 0 transparent)',
                          `drop-shadow(0 0 20px ${isScatter ? 'rgba(250, 204, 21, 0.8)' : 'rgba(52, 211, 153, 0.8)'})`,
                          'drop-shadow(0 0 0 transparent)',
                        ],
                      }
                    : {}
                }
                transition={{
                  duration: 0.5,
                  repeat: shouldAnimate ? Infinity : 0,
                  repeatType: "reverse",
                  delay: colIndex * 0.1,
                }}
              >
                {symbol}
              </motion.span>
            </motion.div>
          );
        })
      )}
    </div>
  );
});

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "./Footer";
import { apiRequest } from "./utils/api";

// Stake-inspired color palette
const COLORS = {
  bg: "#0f212e",           // Main dark background
  bgLight: "#1a2c38",      // Lighter background
  bgCard: "#213743",       // Card background
  red: "#ed4163",          // Coral red for numbers
  black: "#2f4553",        // Dark slate for black numbers
  green: "#00e701",        // Bright green
  greenDark: "#1a4d1a",    // Dark green
  gold: "#d4af37",         // Gold accents
  text: "#ffffff",         // White text
  textMuted: "#b1bad3",    // Muted text
  border: "#2f4553",       // Border color
};

// European roulette numbers in wheel order
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Red numbers in European roulette
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Get color for a number
function getNumberColor(num) {
  if (num === 0) return "green";
  return RED_NUMBERS.includes(num) ? "red" : "black";
}

// Bet type multipliers
const BET_PAYOUTS = {
  straight: 35, split: 17, street: 11, corner: 8, line: 5,
  column: 2, dozen: 2, red: 1, black: 1, odd: 1, even: 1, low: 1, high: 1,
};

export default function RoulettePage() {
  const [balance, setBalance] = useState(0);
  const [bets, setBets] = useState([]);
  const [chipValue, setChipValue] = useState(5);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [showLossPopup, setShowLossPopup] = useState(false);
  const [lastBetAmount, setLastBetAmount] = useState(0);
  const [user, setUser] = useState(null);
  const [serverBalance, setServerBalance] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      apiRequest(`/user/${userData.id}/balance`, { method: 'GET' })
        .then((data) => {
          if (data.balance !== undefined) {
            setBalance(data.balance);
            setServerBalance(data.balance);
          }
        })
        .catch(err => console.error('Failed to fetch balance:', err));
    }
  }, []);

  const totalBet = useMemo(() => bets.reduce((sum, b) => sum + b.amount, 0), [bets]);
  const canSpin = totalBet > 0 && !isSpinning && user;

  const placeBet = useCallback((type, value) => {
    if (isSpinning) return;
    if (balance < chipValue) return;
    setBets(prev => {
      const existing = prev.find(b => b.type === type && b.value === value);
      if (existing) {
        return prev.map(b => b.type === type && b.value === value ? { ...b, amount: b.amount + chipValue } : b);
      }
      return [...prev, { type, value, amount: chipValue }];
    });
    setBalance(prev => prev - chipValue);
  }, [chipValue, balance, isSpinning]);

  const clearBets = useCallback(() => {
    if (isSpinning) return;
    setBalance(prev => prev + totalBet);
    setBets([]);
  }, [totalBet, isSpinning]);

  const spin = useCallback(async () => {
    if (!canSpin || !user) return;
    setIsSpinning(true);
    setResult(null);
    setWinAmount(0);
    setLastBetAmount(totalBet);

    try {
      const data = await apiRequest("/roulette/spin", {
        method: "POST",
        body: { bets, userId: user.id },
      });

      const winningNumber = data.winningNumber;
      const numberIndex = WHEEL_NUMBERS.indexOf(winningNumber);
      const degreesPerNumber = 360 / 37;
      const targetAngle = numberIndex * degreesPerNumber;
      const currentAngle = wheelRotation % 360;
      const extraRotation = (360 - ((targetAngle + currentAngle) % 360)) % 360;
      const spins = 5 + Math.floor(Math.random() * 3);
      const finalRotation = wheelRotation + (spins * 360) + extraRotation;
      setWheelRotation(finalRotation);

      setTimeout(() => {
        setResult(winningNumber);
        setWinAmount(data.totalWin);
        setBalance(data.newBalance);
        setServerBalance(data.newBalance);
        setHistory(prev => [{ number: winningNumber, color: getNumberColor(winningNumber), win: data.totalWin, bet: totalBet, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15));
        setBets([]);
        setIsSpinning(false);
        if (data.totalWin > 0) setShowWinPopup(true);
        else setShowLossPopup(true);
      }, 5000);
    } catch (error) {
      console.error("Spin error:", error);
      setIsSpinning(false);
      setBalance(prev => prev + totalBet);
      setBets([]);
    }
  }, [canSpin, bets, wheelRotation, totalBet, user]);

  useEffect(() => {
    if (showWinPopup) {
      const timer = setTimeout(() => setShowWinPopup(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showWinPopup]);

  useEffect(() => {
    if (showLossPopup) {
      const timer = setTimeout(() => setShowLossPopup(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showLossPopup]);

  // Betting table layout - 3 rows of 12 numbers each
  const tableRows = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      {/* Win Popup */}
      <AnimatePresence>
        {showWinPopup && winAmount > 0 && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWinPopup(false)}
          >
            <motion.div
              className="relative mx-4 max-w-md w-full rounded-2xl p-8 text-center shadow-2xl"
              style={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.green}40` }}
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div className="text-6xl mb-4" animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }}>
                🎉
              </motion.div>
              <p className="text-lg font-bold uppercase tracking-widest mb-2" style={{ color: COLORS.green }}>
                {winAmount >= lastBetAmount * 10 ? "JACKPOT!" : "YOU WON!"}
              </p>
              <p className="text-5xl font-bold text-white mb-4">
                <span style={{ color: COLORS.green }}>$</span>{winAmount.toFixed(2)}
              </p>
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm mb-6"
                style={{
                  backgroundColor: getNumberColor(result) === "red" ? COLORS.red + "40" : getNumberColor(result) === "black" ? COLORS.black : COLORS.green + "40",
                  border: `1px solid ${getNumberColor(result) === "red" ? COLORS.red : getNumberColor(result) === "black" ? "#fff3" : COLORS.green}`,
                  color: COLORS.text
                }}
              >
                <span className="text-2xl font-bold">{result}</span>
              </div>
              <motion.button
                onClick={() => setShowWinPopup(false)}
                className="block w-full rounded-lg px-8 py-3 text-sm font-bold text-black transition-all hover:brightness-110"
                style={{ backgroundColor: COLORS.green }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue Playing
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loss Popup */}
      <AnimatePresence>
        {showLossPopup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLossPopup(false)}
          >
            <motion.div
              className="relative mx-4 max-w-md w-full rounded-2xl p-8 text-center shadow-2xl"
              style={{ backgroundColor: COLORS.bgCard, border: `1px solid ${COLORS.red}40` }}
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl mb-4">😔</div>
              <p className="text-lg font-bold uppercase tracking-widest mb-2" style={{ color: COLORS.red }}>
                No Luck This Time
              </p>
              <p className="text-3xl font-bold text-white/80 mb-4">
                <span style={{ color: COLORS.red }}>-$</span>{lastBetAmount.toFixed(2)}
              </p>
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm mb-6"
                style={{
                  backgroundColor: getNumberColor(result) === "red" ? COLORS.red + "40" : getNumberColor(result) === "black" ? COLORS.black : COLORS.green + "40",
                  border: `1px solid ${getNumberColor(result) === "red" ? COLORS.red : getNumberColor(result) === "black" ? "#fff3" : COLORS.green}`,
                  color: COLORS.text
                }}
              >
                <span className="text-2xl font-bold">{result}</span>
              </div>
              <motion.button
                onClick={() => setShowLossPopup(false)}
                className="block w-full rounded-lg px-8 py-3 text-sm font-bold transition-all hover:brightness-110"
                style={{ backgroundColor: COLORS.red, color: COLORS.text }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Try Again
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>Roulette</h1>
            <button onClick={() => setShowRules(v => !v)} className="text-xs hover:underline" style={{ color: COLORS.textMuted }}>
              How to play · Betting odds
            </button>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide" style={{ color: COLORS.textMuted }}>Balance</p>
            <p className="text-xl font-bold" style={{ color: COLORS.text }}>
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Wheel and Table Container */}
            <div className="rounded-xl p-6" style={{ backgroundColor: COLORS.bgLight }}>
              <div className="flex flex-col items-center justify-center gap-6">
                {/* Roulette Wheel */}
                <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full shadow-2xl" style={{ background: `linear-gradient(135deg, ${COLORS.bgCard}, #0a1a24)` }} />
                  
                  {/* Wheel */}
                  <motion.div
                    className="absolute inset-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: "#0a1218" }}
                    animate={{ rotate: wheelRotation }}
                    transition={{ duration: 5, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    {WHEEL_NUMBERS.map((num, i) => {
                      const angle = (i * 360) / 37;
                      const color = getNumberColor(num);
                      return (
                        <div key={num} className="absolute w-full h-full" style={{ transform: `rotate(${angle}deg)` }}>
                          <div
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-14 flex items-start justify-center pt-1 text-[9px] font-bold text-white"
                            style={{
                              background: color === "red" ? COLORS.red : color === "black" ? COLORS.black : COLORS.green,
                              clipPath: "polygon(30% 0%, 70% 0%, 80% 100%, 20% 100%)"
                            }}
                          >
                            {num}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Gold center hub */}
                    <div className="absolute inset-[30%] rounded-full shadow-lg" style={{ background: `linear-gradient(135deg, ${COLORS.gold}, #8b6914)` }}>
                      <div className="absolute inset-2 rounded-full" style={{ background: `linear-gradient(135deg, #c9a227, ${COLORS.gold})` }}>
                        {/* Cross pattern */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-1 h-full" style={{ backgroundColor: "#8b6914" }} />
                          <div className="absolute w-full h-1" style={{ backgroundColor: "#8b6914" }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Pointer */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                    <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent" style={{ borderTopColor: COLORS.gold }} />
                  </div>
                </div>

                {/* Result Display */}
                {result !== null && !isSpinning && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-20 h-20 rounded-lg flex items-center justify-center text-3xl font-bold text-white shadow-lg"
                    style={{
                      backgroundColor: getNumberColor(result) === "red" ? COLORS.red : getNumberColor(result) === "black" ? COLORS.black : COLORS.green
                    }}
                  >
                    {result}
                  </motion.div>
                )}
                {isSpinning && (
                  <motion.p
                    className="text-lg font-semibold"
                    style={{ color: COLORS.gold }}
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    Spinning...
                  </motion.p>
                )}
              </div>
            </div>

            {/* Betting Table */}
            <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bgLight }}>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Main number grid */}
                  <div className="flex gap-1">
                    {/* Zero */}
                    <button
                      onClick={() => placeBet("straight", 0)}
                      disabled={isSpinning}
                      className="w-12 rounded-lg font-bold text-white text-lg transition-all hover:brightness-125 disabled:opacity-50 relative flex items-center justify-center"
                      style={{ backgroundColor: COLORS.green, height: "144px" }}
                    >
                      0
                      {bets.find(b => b.type === "straight" && b.value === 0) && (
                        <span className="absolute bottom-1 right-1 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: COLORS.gold, color: "#000" }}>
                          {bets.find(b => b.type === "straight" && b.value === 0).amount}
                        </span>
                      )}
                    </button>

                    {/* Number rows */}
                    <div className="flex-1">
                      {tableRows.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-1 mb-1">
                          {row.map(num => {
                            const isRed = RED_NUMBERS.includes(num);
                            const bet = bets.find(b => b.type === "straight" && b.value === num);
                            return (
                              <button
                                key={num}
                                onClick={() => placeBet("straight", num)}
                                disabled={isSpinning}
                                className="flex-1 h-11 rounded-md font-semibold text-white text-sm transition-all hover:brightness-125 disabled:opacity-50 relative"
                                style={{ backgroundColor: isRed ? COLORS.red : COLORS.black }}
                              >
                                {num}
                                {bet && (
                                  <span className="absolute -top-1 -right-1 text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center" style={{ backgroundColor: COLORS.gold, color: "#000" }}>
                                    {bet.amount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                          {/* 2:1 column bet */}
                          <button
                            onClick={() => placeBet("column", 3 - rowIndex)}
                            disabled={isSpinning}
                            className="w-12 h-11 rounded-md font-semibold text-sm transition-all hover:brightness-125 disabled:opacity-50"
                            style={{ backgroundColor: COLORS.black, color: COLORS.textMuted }}
                          >
                            2:1
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dozen bets */}
                  <div className="flex gap-1 mt-2 ml-[52px]">
                    {[{ label: "1 to 12", value: "1st" }, { label: "13 to 24", value: "2nd" }, { label: "25 to 36", value: "3rd" }].map(dozen => (
                      <button
                        key={dozen.value}
                        onClick={() => placeBet("dozen", dozen.value)}
                        disabled={isSpinning}
                        className="flex-1 h-10 rounded-md font-medium text-sm transition-all hover:brightness-125 disabled:opacity-50 relative"
                        style={{ backgroundColor: COLORS.black, color: COLORS.textMuted }}
                      >
                        {dozen.label}
                        {bets.find(b => b.type === "dozen" && b.value === dozen.value) && (
                          <span className="absolute top-1 right-1 text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center" style={{ backgroundColor: COLORS.gold, color: "#000" }}>
                            {bets.find(b => b.type === "dozen" && b.value === dozen.value).amount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Outside bets */}
                  <div className="flex gap-1 mt-2 ml-[52px]">
                    {[
                      { type: "low", label: "1 to 18" },
                      { type: "even", label: "Even" },
                      { type: "red", label: "", isRed: true },
                      { type: "black", label: "", isBlack: true },
                      { type: "odd", label: "Odd" },
                      { type: "high", label: "19 to 36" },
                    ].map(bet => (
                      <button
                        key={bet.type}
                        onClick={() => placeBet(bet.type, bet.type)}
                        disabled={isSpinning}
                        className="flex-1 h-10 rounded-md font-medium text-sm transition-all hover:brightness-125 disabled:opacity-50 relative"
                        style={{
                          backgroundColor: bet.isRed ? COLORS.red : bet.isBlack ? COLORS.black : COLORS.black,
                          color: bet.isRed || bet.isBlack ? "transparent" : COLORS.textMuted
                        }}
                      >
                        {bet.label}
                        {bets.find(b => b.type === bet.type) && (
                          <span className="absolute top-1 right-1 text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center" style={{ backgroundColor: COLORS.gold, color: "#000" }}>
                            {bets.find(b => b.type === bet.type).amount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center gap-2">
                  <button onClick={clearBets} disabled={isSpinning || totalBet === 0} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-125 disabled:opacity-50" style={{ color: COLORS.textMuted }}>
                    ↩ Undo
                  </button>
                </div>
                <button onClick={clearBets} disabled={isSpinning || totalBet === 0} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-125 disabled:opacity-50" style={{ color: COLORS.textMuted }}>
                  Clear ⟳
                </button>
              </div>
            </div>

            {/* Chip selector and Spin */}
            <div className="rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ backgroundColor: COLORS.bgLight }}>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide mr-2" style={{ color: COLORS.textMuted }}>Chip Value</span>
                {[1, 5, 10, 25, 100].map(value => (
                  <button
                    key={value}
                    onClick={() => setChipValue(value)}
                    className={`w-12 h-12 rounded-full font-bold text-xs transition-all ${chipValue === value ? "scale-110 ring-2" : "hover:scale-105"}`}
                    style={{
                      backgroundColor: chipValue === value ? COLORS.gold : COLORS.bgCard,
                      color: chipValue === value ? "#000" : COLORS.textMuted,
                      ringColor: COLORS.gold
                    }}
                  >
                    ${value}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Total Amount</p>
                  <p className="text-lg font-bold" style={{ color: COLORS.text }}>${totalBet.toFixed(2)}</p>
                </div>
                <button
                  onClick={spin}
                  disabled={!canSpin}
                  className="px-12 py-3 rounded-lg text-lg font-bold transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS.green, color: "#000" }}
                >
                  Play
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Last Numbers */}
            <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bgLight }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Last Numbers</h2>
              {history.length === 0 ? (
                <p className="text-sm" style={{ color: COLORS.textMuted }}>No spins yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {history.slice(0, 10).map((item, i) => (
                    <motion.div
                      key={i}
                      initial={i === 0 ? { scale: 0 } : false}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        backgroundColor: item.color === "red" ? COLORS.red : item.color === "black" ? COLORS.black : COLORS.green
                      }}
                    >
                      {item.number}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bgLight }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Statistics</h2>
              {history.length === 0 ? (
                <p className="text-sm" style={{ color: COLORS.textMuted }}>Play to see statistics.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.textMuted }}>Red</span>
                    <span className="font-medium" style={{ color: COLORS.red }}>{history.filter(h => h.color === "red").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.textMuted }}>Black</span>
                    <span className="font-medium" style={{ color: COLORS.text }}>{history.filter(h => h.color === "black").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.textMuted }}>Green</span>
                    <span className="font-medium" style={{ color: COLORS.green }}>{history.filter(h => h.color === "green").length}</span>
                  </div>
                  <div className="pt-2 mt-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.textMuted }}>Total Wins</span>
                      <span className="font-medium" style={{ color: COLORS.green }}>${history.reduce((sum, h) => sum + h.win, 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Spins */}
            <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.bgLight }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>Recent Spins</h2>
              {history.length === 0 ? (
                <p className="text-sm" style={{ color: COLORS.textMuted }}>Your history will appear here.</p>
              ) : (
                <ul className="space-y-1 text-xs max-h-48 overflow-y-auto">
                  {history.slice(0, 10).map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-md px-3 py-2"
                      style={{ backgroundColor: COLORS.bgCard }}
                    >
                      <span style={{ color: COLORS.textMuted }}>{item.time}</span>
                      <span className="font-bold" style={{ color: item.color === "red" ? COLORS.red : item.color === "green" ? COLORS.green : COLORS.text }}>
                        {item.number}
                      </span>
                      <span className="font-medium" style={{ color: item.win > 0 ? COLORS.green : COLORS.red }}>
                        {item.win > 0 ? `+${item.win.toFixed(2)}` : `-${(item.bet || 0).toFixed(2)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Rules */}
        {showRules && (
          <div className="mt-6 rounded-xl p-6 text-sm space-y-4" style={{ backgroundColor: COLORS.bgLight }}>
            <h2 className="text-base font-semibold" style={{ color: COLORS.text }}>How to Play European Roulette</h2>
            <p style={{ color: COLORS.textMuted }}>
              European Roulette features a wheel with numbers 0-36. Place your bets on the table, then spin the wheel.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { name: "Straight Up", desc: "Single number: 35:1" },
                { name: "Dozen", desc: "12 numbers: 2:1" },
                { name: "Column", desc: "12 numbers: 2:1" },
                { name: "Red/Black", desc: "18 numbers: 1:1" },
                { name: "Odd/Even", desc: "18 numbers: 1:1" },
                { name: "1-18/19-36", desc: "18 numbers: 1:1" },
              ].map(item => (
                <div key={item.name} className="rounded-lg p-2" style={{ backgroundColor: COLORS.bgCard }}>
                  <p className="font-medium" style={{ color: COLORS.text }}>{item.name}</p>
                  <p style={{ color: COLORS.textMuted }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";

function AnimatedNumber({ value }) {
  const motionValue = useMotionValue(value);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.5 });
    return controls.stop;
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
}

export default function WinsStrip({ slotCount = 8, intervalMs = 600 }) {
  const usernames = useMemo(
    () => [
      "@luna_wave","@cryptoWolf","@aceHunter42","@nova99",
      "@pixelDreamer","@zenFlow","@midnightEcho","@xplora",
      "@elysium23","@stormRider","@frostbyte","@skyline7",
      "@cashflow_mike","@neonPulse","@vegaQueen","@satoshi_baby",
      "@gooner67gambler","@goon3","@tradegenius","@winner_of_67", "@elio67", "@magenta_rider",
      "@41doll", "@inter433", "@casino886", "@lucky.larry", "@por.q74", "@explo.nova",
      "@41or67", "@next.mio", "@juan.rhr", "@mindset.juan"
    ],
    []
  );

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // items + graph
  const [items, setItems] = useState([]);
  const [justId, setJustId] = useState(null);
  const [series, setSeries] = useState([0]);

  function makeEvent() {
    const name = usernames[Math.floor(Math.random() * usernames.length)];
    const amount = Math.floor(Math.random() * 2000) + 50;
    const isWin = Math.random() < 0.6; // win probability
    return { id: Date.now(), name, amount, isWin, life: 0 }; // life increments each shift
  }

  function insertLeft() {
    const ev = makeEvent();
    setItems((prev) => {
      // age existing items (add 1 life = shifted one to the right)
      const aged = prev.map((item) => (item ? { ...item, life: item.life + 1 } : null));
      // new item enters on the left, keep those with life < 5 (5th shift -> gone)
      const next = [ev, ...aged].filter((i) => !i || i.life < 5);
      return next.slice(0, slotCount);
    });
    setJustId(ev.id);

    // update sparkline (up on win, down on loss)
    setSeries((prev) => {
      const next = [...prev, prev[prev.length - 1] + (ev.isWin ? 1 : -1)];
      return next.slice(-40);
    });
  }

  useEffect(() => {
    const id = setInterval(insertLeft, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const wrapBg = isDark
    ? "text-white"
    : "";

  const chipClass = (win) =>
    win
      ? isDark ? "bg-green-900 text-green-300" : "bg-green-50 text-green-700"
      : isDark ? "bg-red-900 text-red-300" : "bg-red-50 text-red-700";

  const amtClass = (win) =>
    win
      ? isDark ? "text-green-400" : "text-green-600"
      : isDark ? "text-red-400" : "text-red-600";

  // map life -> opacity class (0..4)
  const lifeToOpacity = (life) => {
    const map = ["opacity-100", "opacity-90", "opacity-80", "opacity-60", "opacity-40"];
    return map[Math.min(life, map.length - 1)];
  };

  function Sparkline({ data }) {
    const w = 160, h = 30, pad = 10;
    if (data.length < 2) return <svg width={w} height={h} />;
    const min = Math.min(...data), max = Math.max(...data);
    const dx = (w - pad * 2) / (data.length - 1);
    const mapY = (v) =>
      max === min ? h / 2 : h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    const stroke =
      data[data.length - 1] >= data[data.length - 2]
        ? isDark ? "#4ade80" : "#16a34a"
        : isDark ? "#f87171" : "#dc2626";
    return (
      <svg width={w} height={h}>
        <polyline
          points={data.map((v, i) => `${pad + dx * i},${mapY(v)}`).join(" ")}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <div className={`w-full ${wrapBg}`}>
      {/* header: label + sparkline */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-start gap-1">
        <div className="text-xs font-medium opacity-70">Live results</div>
        <Sparkline data={series} />
      </div>

      {/* cards row */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-3">
        <div className="flex items-stretch gap-3">
          <AnimatePresence>
            {items.map((ev) =>
              ev ? (
                <motion.div
                  key={ev.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{
                    opacity: 1,
                    scale: ev.isWin ? [1, 1.05, 1] : 1,
                    x: 0,
                    transition: {
                      scale: ev.isWin
                        ? { duration: 0.3, ease: "easeOut" }
                        : { duration: 0 },
                    },
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={[
                    "min-w-[230px] max-w-[250px] px-4 py-2 rounded-lg shadow-sm",
                    chipClass(ev.isWin),
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="leading-tight">
                      <div className="font-semibold text-sm">{ev.name}</div>
                      <div className="text-xs opacity-80">{ev.isWin ? "won" : "lost"}</div>
                    </div>
                    <div className={`font-semibold text-sm ${amtClass(ev.isWin)}`}>
                      {ev.isWin ? "" : "-"}$<AnimatedNumber value={ev.amount} />
                    </div>
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

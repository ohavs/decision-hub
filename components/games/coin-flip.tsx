"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"

type CoinResult = "heads" | "tails" | null

export function CoinFlip() {
  const { t, direction } = useLanguage()
  const { soundEnabled, recordWin } = useStats()
  const [result, setResult] = useState<CoinResult>(null)
  const [flipping, setFlipping] = useState(false)
  const [flipCount, setFlipCount] = useState(0)

  const flipCoin = useCallback(() => {
    if (flipping) return
    
    setFlipping(true)
    setResult(null)
    playSound("coin", soundEnabled)
    
    const flips = 8 + Math.floor(Math.random() * 4)
    setFlipCount(flips)
    
    setTimeout(() => {
      const outcome: CoinResult = Math.random() < 0.5 ? "heads" : "tails"
      setResult(outcome)
      setFlipping(false)
      playSound("success", soundEnabled)
      
      const winnerName = outcome === "heads" ? t("coin.heads") : t("coin.tails")
      recordWin("coinFlip", winnerName, [t("coin.heads"), t("coin.tails")])
    }, 2000)
  }, [flipping, soundEnabled, recordWin, t])

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-background select-none" dir={direction}>
      
      {/* Decorative Blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      {/* Coin container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-48 h-48 sm:w-56 sm:h-56 mb-12 relative z-10"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          animate={flipping ? {
            rotateY: flipCount * 180,
            y: [-20, -120, -20],
          } : {
            rotateY: result === "tails" ? 180 : 0,
          }}
          transition={{
            duration: flipping ? 2 : 0.6,
            ease: flipping ? "easeOut" : "easeInOut",
          }}
          className="w-full h-full relative"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Heads side */}
          <div 
            className="absolute inset-0 rounded-full flex items-center justify-center border-8 border-white/80"
            style={{
              backfaceVisibility: "hidden",
              background: "linear-gradient(135deg, #fcd34d, #f59e0b)",
              boxShadow: `
                0 12px 30px rgba(245, 158, 11, 0.3),
                inset 0 -8px 16px rgba(0, 0, 0, 0.15),
                inset 0 8px 16px rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            <div className="text-center">
              <div className="text-6xl mb-3 select-none">👤</div>
              <div className="text-base font-black text-amber-950/80 tracking-tight">{t("coin.heads")}</div>
            </div>
          </div>

          {/* Tails side */}
          <div 
            className="absolute inset-0 rounded-full flex items-center justify-center border-8 border-white/80"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg, #fcd34d, #f59e0b)",
              boxShadow: `
                0 12px 30px rgba(245, 158, 11, 0.3),
                inset 0 -8px 16px rgba(0, 0, 0, 0.15),
                inset 0 8px 16px rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            <div className="text-center">
              <div className="text-6xl mb-3 select-none">🦅</div>
              <div className="text-base font-black text-amber-950/80 tracking-tight">{t("coin.tails")}</div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Result display */}
      <div className="h-16 mb-8 flex items-center justify-center relative z-10">
        <AnimatePresence mode="wait">
          {result && !flipping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
                className="text-4xl font-black text-foreground tracking-tight"
              >
                {result === "heads" ? t("coin.heads") : t("coin.tails")}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Flip Button (Mockup capsule button) */}
      <button
        onClick={flipCoin}
        disabled={flipping}
        className="relative z-10 w-full max-w-xs flex items-center justify-between px-8 py-5 rounded-full bg-foreground text-background font-black text-sm shadow-[0_12px_36px_rgba(0,0,0,0.15)] hover:bg-foreground/90 transition-all cursor-pointer disabled:opacity-50"
      >
        <span>{flipping ? t("coin.flipping") : t("coin.flip")}</span>
        <span className="tracking-widest opacity-80" dir="ltr"> &gt;&gt;&gt;</span>
      </button>
    </div>
  )
}

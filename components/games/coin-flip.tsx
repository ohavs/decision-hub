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
    
    // Random number of flips for realism
    const flips = 8 + Math.floor(Math.random() * 4)
    setFlipCount(flips)
    
    setTimeout(() => {
      const outcome: CoinResult = Math.random() < 0.5 ? "heads" : "tails"
      setResult(outcome)
      setFlipping(false)
      playSound("success", soundEnabled)
      
      // Record for stats
      const winnerName = outcome === "heads" ? t("coin.heads") : t("coin.tails")
      recordWin("coinFlip", winnerName, [t("coin.heads"), t("coin.tails")])
    }, 2000)
  }, [flipping, soundEnabled, recordWin, t])

  return (
    <div className="h-full flex flex-col items-center justify-center p-6" dir={direction}>
      {/* Coin container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-48 h-48 sm:w-56 sm:h-56 mb-12"
        style={{ perspective: "1000px" }}
      >
        <motion.div
          animate={flipping ? {
            rotateY: flipCount * 180,
            y: [-20, -100, -20],
          } : {
            rotateY: result === "tails" ? 180 : 0,
          }}
          transition={{
            duration: flipping ? 2 : 0.5,
            ease: flipping ? "easeOut" : "easeInOut",
          }}
          className="w-full h-full relative"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Heads side */}
          <div 
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              background: "linear-gradient(145deg, #ffd700, #ffb347)",
              boxShadow: `
                0 4px 0 #b8860b,
                0 8px 20px rgba(0, 0, 0, 0.3),
                inset 0 -4px 8px rgba(0, 0, 0, 0.2),
                inset 0 4px 8px rgba(255, 255, 255, 0.3)
              `,
            }}
          >
            <div className="text-center">
              <div className="text-6xl mb-2">👤</div>
              <div className="text-sm font-bold text-amber-900/80">{t("coin.heads")}</div>
            </div>
          </div>

          {/* Tails side */}
          <div 
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "linear-gradient(145deg, #ffd700, #ffb347)",
              boxShadow: `
                0 4px 0 #b8860b,
                0 8px 20px rgba(0, 0, 0, 0.3),
                inset 0 -4px 8px rgba(0, 0, 0, 0.2),
                inset 0 4px 8px rgba(255, 255, 255, 0.3)
              `,
            }}
          >
            <div className="text-center">
              <div className="text-6xl mb-2">🦅</div>
              <div className="text-sm font-bold text-amber-900/80">{t("coin.tails")}</div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Result display */}
      <AnimatePresence mode="wait">
        {result && !flipping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-8 text-center"
          >
            <motion.p
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-bold text-foreground"
            >
              {result === "heads" ? t("coin.heads") : t("coin.tails")}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flip button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={flipCoin}
        disabled={flipping}
        className="px-12 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 font-semibold text-lg shadow-lg disabled:opacity-50 transition-all"
        style={{
          boxShadow: "0 10px 40px rgba(251, 191, 36, 0.4)",
        }}
      >
        {flipping ? t("coin.flipping") : t("coin.flip")}
      </motion.button>
    </div>
  )
}

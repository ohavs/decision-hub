"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"

const DICE_DOTS: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
}

function Die({ value, rolling, delay = 0 }: { value: number; rolling: boolean; delay?: number }) {
  const dots = DICE_DOTS[value] || []

  return (
    <motion.div
      initial={{ rotateX: 0, rotateY: 0 }}
      animate={rolling ? {
        rotateX: [0, 360, 720, 1080],
        rotateY: [0, 360, 720, 1080],
      } : {
        rotateX: 0,
        rotateY: 0,
      }}
      transition={{
        duration: rolling ? 1.5 : 0.4,
        delay: rolling ? delay : 0,
        ease: rolling ? "easeOut" : "easeInOut",
      }}
      className="relative w-20 h-20 sm:w-24 sm:h-24"
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
    >
      {/* 3D Playful Dice face */}
      <div 
        className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-white to-slate-100 border-4 border-white/80"
        style={{
          boxShadow: "0 12px 28px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.9)",
        }}
      >
        {/* Dots grid */}
        <div className="absolute inset-3 grid grid-cols-3 grid-rows-3 pointer-events-none">
          {[0, 1, 2].map(row => (
            [0, 1, 2].map(col => {
              const hasDot = dots.some(([r, c]) => r === row && c === col)
              return (
                <div key={`${row}-${col}`} className="flex items-center justify-center">
                  {hasDot && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: rolling ? 1.5 + delay : 0, duration: 0.2 }}
                      className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-primary"
                      style={{
                        boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)",
                      }}
                    />
                  )}
                </div>
              )
            })
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function DiceRoller() {
  const { t, direction } = useLanguage()
  const { soundEnabled } = useStats()
  const [diceCount, setDiceCount] = useState(2)
  const [values, setValues] = useState<number[]>([1, 1])
  const [rolling, setRolling] = useState(false)

  const rollDice = useCallback(() => {
    if (rolling) return
    
    setRolling(true)
    playSound("dice", soundEnabled)
    
    // Multiple random values during roll
    const interval = setInterval(() => {
      setValues(prev => prev.map(() => Math.floor(Math.random() * 6) + 1))
    }, 100)
    
    setTimeout(() => {
      clearInterval(interval)
      const finalValues = Array(diceCount).fill(0).map(() => Math.floor(Math.random() * 6) + 1)
      setValues(finalValues)
      setRolling(false)
      playSound("success", soundEnabled)
    }, 1500)
  }, [rolling, diceCount, soundEnabled])

  const handleDiceCountChange = (count: number) => {
    setDiceCount(count)
    setValues(Array(count).fill(1))
    playSound("click", soundEnabled)
  }

  const total = values.reduce((sum, v) => sum + v, 0)

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-background select-none" dir={direction}>
      
      {/* Decorative Blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      {/* Dice count selector */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 relative z-10 text-center"
      >
        <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-4">{t("dice.count")}</p>
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3, 4].map(count => (
            <button
              key={count}
              onClick={() => handleDiceCountChange(count)}
              className={`w-12 h-12 rounded-full border-2 font-black text-sm transition-all cursor-pointer shadow-sm ${
                diceCount === count
                  ? "border-foreground bg-foreground text-background scale-110"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Dice display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-wrap items-center justify-center gap-6 mb-12 relative z-10 max-w-xs"
      >
        {values.map((value, index) => (
          <Die 
            key={index} 
            value={value} 
            rolling={rolling}
            delay={index * 0.1}
          />
        ))}
      </motion.div>

      {/* Total */}
      <div className="h-24 mb-6 flex items-center justify-center relative z-10">
        <AnimatePresence mode="wait">
          {!rolling && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <p className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                {t("dice.count") === "מספר קוביות" ? "סה״כ" : "Total"}
              </p>
              <p className="text-5xl font-black text-foreground mt-1 tracking-tight">{total}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Roll button (Mockup capsule button) */}
      <button
        onClick={rollDice}
        disabled={rolling}
        className="relative z-10 w-full max-w-xs flex items-center justify-between px-8 py-5 rounded-full bg-foreground text-background font-black text-sm shadow-[0_12px_36px_rgba(0,0,0,0.15)] hover:bg-foreground/90 transition-all cursor-pointer disabled:opacity-50"
      >
        <span>{rolling ? t("dice.rolling") : t("dice.roll")}</span>
        <span className="tracking-widest opacity-80" dir="ltr"> &gt;&gt;&gt;</span>
      </button>
    </div>
  )
}

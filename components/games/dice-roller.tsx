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
        duration: rolling ? 1.5 : 0.3,
        delay: rolling ? delay : 0,
        ease: rolling ? "easeOut" : "easeInOut",
      }}
      className="relative w-20 h-20 sm:w-24 sm:h-24"
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
    >
      {/* 3D Dice face */}
      <div 
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white to-gray-100 shadow-xl"
        style={{
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        }}
      >
        {/* Dots grid */}
        <div className="absolute inset-3 grid grid-cols-3 grid-rows-3">
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
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gray-800"
                      style={{
                        boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.3)",
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
    <div className="h-full flex flex-col items-center justify-center p-6" dir={direction}>
      {/* Dice count selector */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-sm text-muted-foreground text-center mb-3">{t("dice.count")}</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(count => (
            <button
              key={count}
              onClick={() => handleDiceCountChange(count)}
              className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                diceCount === count
                  ? "bg-primary text-primary-foreground scale-110"
                  : "bg-secondary/50 text-foreground/70 hover:bg-secondary"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Dice display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-wrap items-center justify-center gap-4 mb-8"
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
      <AnimatePresence mode="wait">
        {!rolling && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 text-center"
          >
            <p className="text-sm text-muted-foreground">{t("dice.count") === "מספר קוביות" ? "סה״כ" : "Total"}</p>
            <p className="text-5xl font-bold text-foreground">{total}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roll button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={rollDice}
        disabled={rolling}
        className="px-12 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg shadow-lg disabled:opacity-50 transition-all"
        style={{
          boxShadow: "0 10px 40px rgba(6, 182, 212, 0.4)",
        }}
      >
        {rolling ? t("dice.rolling") : t("dice.roll")}
      </motion.button>
    </div>
  )
}

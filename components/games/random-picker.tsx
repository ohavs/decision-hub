"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"

type PickerMode = "names" | "numbers"

export function RandomPicker() {
  const { t, language, direction } = useLanguage()
  const { soundEnabled, recordWin } = useStats()
  
  const [mode, setMode] = useState<PickerMode>("names")
  const [names, setNames] = useState<string[]>([])
  const [newName, setNewName] = useState("")
  const [minNum, setMinNum] = useState(1)
  const [maxNum, setMaxNum] = useState(100)
  const [picking, setPicking] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [displayValue, setDisplayValue] = useState<string>("")
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const addName = useCallback(() => {
    const trimmed = newName.trim()
    if (trimmed && !names.includes(trimmed)) {
      setNames(prev => [...prev, trimmed])
      setNewName("")
      playSound("pop", soundEnabled)
    }
  }, [newName, names, soundEnabled])

  const removeName = (name: string) => {
    setNames(prev => prev.filter(n => n !== name))
    playSound("click", soundEnabled)
  }

  const pick = useCallback(() => {
    if (picking) return
    if (mode === "names" && names.length < 2) return
    
    setPicking(true)
    setResult(null)
    playSound("spin", soundEnabled)
    
    const items = mode === "names" 
      ? names 
      : Array.from({ length: maxNum - minNum + 1 }, (_, i) => String(minNum + i))
    
    let count = 0
    const maxCount = 30
    
    intervalRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * items.length)
      setDisplayValue(items[randomIndex])
      count++
      
      if (count > maxCount * 0.7) {
        playSound("tick", soundEnabled)
      }
      
      if (count >= maxCount) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        
        const winner = items[Math.floor(Math.random() * items.length)]
        setDisplayValue(winner)
        setResult(winner)
        setPicking(false)
        playSound("success", soundEnabled)
        
        if (mode === "names") {
          recordWin("randomPicker", winner, names)
        }
      }
    }, 50 + count * 5)
  }, [picking, mode, names, minNum, maxNum, soundEnabled, recordWin])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const canPick = mode === "names" ? names.length >= 2 : minNum < maxNum

  return (
    <div className="h-full flex flex-col p-6 pt-16" dir={direction}>
      {/* Mode toggle */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center mb-6"
      >
        <div className="flex rounded-full bg-secondary/50 p-1">
          <button
            onClick={() => {
              setMode("names")
              setResult(null)
              playSound("click", soundEnabled)
            }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              mode === "names"
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            {language === "he" ? "שמות" : "Names"}
          </button>
          <button
            onClick={() => {
              setMode("numbers")
              setResult(null)
              playSound("click", soundEnabled)
            }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              mode === "numbers"
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            {language === "he" ? "מספרים" : "Numbers"}
          </button>
        </div>
      </motion.div>

      {/* Names mode */}
      {mode === "names" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col"
        >
          {/* Add name input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addName()}
              placeholder={t("picker.enterName")}
              className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={addName}
              disabled={!newName.trim()}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 transition-all"
            >
              +
            </button>
          </div>

          {/* Names list */}
          <div className="flex-1 overflow-y-auto mb-4">
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {names.map((name) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 border border-border/50"
                  >
                    <span className="text-foreground">{name}</span>
                    <button
                      onClick={() => removeName(name)}
                      className="w-5 h-5 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* Numbers mode */}
      {mode === "numbers" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center"
        >
          <p className="text-sm text-muted-foreground mb-4">{t("picker.orRange")}</p>
          <div className="flex items-center gap-4 mb-8">
            <div className="text-center">
              <label className="text-xs text-muted-foreground block mb-1">{t("picker.min")}</label>
              <input
                type="number"
                value={minNum}
                onChange={(e) => setMinNum(parseInt(e.target.value) || 1)}
                className="w-24 px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <span className="text-2xl text-muted-foreground">-</span>
            <div className="text-center">
              <label className="text-xs text-muted-foreground block mb-1">{t("picker.max")}</label>
              <input
                type="number"
                value={maxNum}
                onChange={(e) => setMaxNum(parseInt(e.target.value) || 100)}
                className="w-24 px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Result display */}
      <motion.div
        className="h-32 flex items-center justify-center mb-6"
        initial={false}
      >
        <AnimatePresence mode="wait">
          {(picking || result) && (
            <motion.div
              key={displayValue}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.1 }}
              className={`text-5xl sm:text-6xl font-bold ${
                result ? "text-primary" : "text-foreground"
              }`}
              style={result ? {
                textShadow: "0 0 40px rgba(236, 72, 153, 0.6)",
              } : undefined}
            >
              {displayValue}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Pick button */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={pick}
        disabled={picking || !canPick}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-semibold text-lg shadow-lg disabled:opacity-50 transition-all"
        style={{
          boxShadow: "0 10px 40px rgba(168, 85, 247, 0.4)",
        }}
      >
        {picking ? t("picker.picking") : t("picker.pick")}
      </motion.button>
    </div>
  )
}

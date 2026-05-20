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
    <div className="h-full flex flex-col p-6 pt-20 bg-background select-none" dir={direction}>
      
      {/* Decorative Blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute bottom-1/4 left-1/4 w-82 h-82 rounded-full bg-purple-200/20 blur-3xl" />
      </div>

      {/* Mode Selector using Mockup Dot Toggles */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center gap-4 mb-6 relative z-10"
      >
        <button
          onClick={() => {
            setMode("names")
            setResult(null)
            playSound("click", soundEnabled)
          }}
          className={`flex items-center gap-3 px-6 py-3 rounded-full border-2 transition-all cursor-pointer ${
            mode === "names"
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-card text-muted-foreground hover:bg-secondary/40"
          }`}
        >
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
            mode === "names" ? "border-background" : "border-muted-foreground"
          }`}>
            {mode === "names" && <span className="w-2 h-2 rounded-full bg-background" />}
          </span>
          <span className="font-extrabold text-xs">
            {language === "he" ? "שמות" : "Names"}
          </span>
        </button>

        <button
          onClick={() => {
            setMode("numbers")
            setResult(null)
            playSound("click", soundEnabled)
          }}
          className={`flex items-center gap-3 px-6 py-3 rounded-full border-2 transition-all cursor-pointer ${
            mode === "numbers"
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-card text-muted-foreground hover:bg-secondary/40"
          }`}
        >
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
            mode === "numbers" ? "border-background" : "border-muted-foreground"
          }`}>
            {mode === "numbers" && <span className="w-2 h-2 rounded-full bg-background" />}
          </span>
          <span className="font-extrabold text-xs">
            {language === "he" ? "מספרים" : "Numbers"}
          </span>
        </button>
      </motion.div>

      {/* Content Panels */}
      <div className="flex-1 flex flex-col relative z-10 min-h-0">
        {mode === "names" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Add Name Input Form */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addName()}
                placeholder={t("picker.enterName")}
                className="flex-1 px-5 py-4 rounded-full border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground font-bold text-sm shadow-sm"
              />
              <button
                onClick={addName}
                disabled={!newName.trim()}
                className="px-6 py-4 rounded-full bg-primary border-2 border-primary text-white font-black text-sm shadow-md disabled:opacity-50 transition-all cursor-pointer hover:bg-primary/95"
              >
                +
              </button>
            </div>

            {/* Scrollable Name Chip Container */}
            <div className="flex-1 overflow-y-auto mb-4 scrollbar-none pr-1 pl-1">
              <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                  {names.map((name) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      layout
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border-2 border-border shadow-[0_4px_12px_rgba(0,0,0,0.015)] font-bold text-xs"
                    >
                      <span className="text-foreground">{name}</span>
                      <button
                        onClick={() => removeName(name)}
                        className="w-5 h-5 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-black cursor-pointer"
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

        {mode === "numbers" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6">{t("picker.orRange")}</p>
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="text-center">
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-2">{t("picker.min")}</label>
                <input
                  type="number"
                  value={minNum}
                  onChange={(e) => setMinNum(parseInt(e.target.value) || 1)}
                  className="w-24 px-4 py-4 rounded-3xl border-2 border-border bg-card text-foreground font-black text-center focus:outline-none focus:border-foreground"
                />
              </div>
              <span className="text-2xl font-black text-muted-foreground/60 mt-6">-</span>
              <div className="text-center">
                <label className="text-[10px] font-black uppercase text-muted-foreground block mb-2">{t("picker.max")}</label>
                <input
                  type="number"
                  value={maxNum}
                  onChange={(e) => setMaxNum(parseInt(e.target.value) || 100)}
                  className="w-24 px-4 py-4 rounded-3xl border-2 border-border bg-card text-foreground font-black text-center focus:outline-none focus:border-foreground"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Result Display Center */}
      <div className="h-32 flex items-center justify-center mb-6 relative z-10">
        <AnimatePresence mode="wait">
          {(picking || result) && (
            <motion.div
              key={displayValue}
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -15 }}
              transition={{ duration: 0.1 }}
              className={`text-5xl sm:text-6xl font-black tracking-tight ${
                result ? "text-primary" : "text-foreground"
              }`}
              style={result ? {
                textShadow: "0 8px 30px rgba(59, 130, 246, 0.2)",
              } : undefined}
            >
              {displayValue}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pick Capsule Button */}
      <button
        onClick={pick}
        disabled={picking || !canPick}
        className="relative z-10 w-full flex items-center justify-between px-8 py-5 rounded-full bg-foreground text-background font-black text-sm shadow-[0_12px_36px_rgba(0,0,0,0.15)] hover:bg-foreground/90 transition-all cursor-pointer disabled:opacity-50"
      >
        <span>{picking ? t("picker.picking") : t("picker.pick")}</span>
        <span className="tracking-widest opacity-80" dir="ltr"> &gt;&gt;&gt;</span>
      </button>
    </div>
  )
}

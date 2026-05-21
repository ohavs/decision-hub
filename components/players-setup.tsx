"use client"

import { useState, type ChangeEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"

const PLAYER_COLORS = [
  "#3b82f6", // 1 blue
  "#f97316", // 2 orange
  "#10b981", // 3 green
  "#ec4899", // 4 pink
  "#8b5cf6", // 5 purple
  "#eab308", // 6 yellow
  "#06b6d4", // 7 cyan
  "#f43f5e", // 8 rose
]

interface PlayersSetupProps {
  onBack: () => void
}

export function PlayersSetup({ onBack }: PlayersSetupProps) {
  const { language, direction } = useLanguage()
  const { namedPlayers, setNamedPlayers, soundEnabled } = useStats()

  const [localPlayers, setLocalPlayers] = useState<string[]>(() => {
    const p = [...namedPlayers]
    while (p.length < 8) p.push("")
    return p.slice(0, 8)
  })

  const activeCount = localPlayers.filter((n: string) => n.trim()).length

  const handleChange = (index: number, value: string) => {
    const next = [...localPlayers]
    next[index] = value
    setLocalPlayers(next)
  }

  const handleClear = (index: number) => {
    const next = [...localPlayers]
    next[index] = ""
    setLocalPlayers(next)
    playSound("click", soundEnabled)
  }

  const handleSave = () => {
    setNamedPlayers(localPlayers)
    playSound("success", soundEnabled)
    onBack()
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col px-6 pt-8 pb-6" dir={direction}>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-5%] right-[-10%] w-[300px] h-[300px] rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute bottom-[10%] left-[-5%] w-[250px] h-[250px] rounded-full bg-green-200/20 blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between mb-6 flex-shrink-0"
      >
        <button
          onClick={() => { playSound("click", soundEnabled); onBack() }}
          className="p-3 rounded-full bg-card border-2 border-border text-foreground hover:bg-secondary/40 shadow-md transition-all cursor-pointer"
        >
          <svg
            className={`w-5 h-5 ${direction === "rtl" ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {language === "he" ? "שחקנים" : "Players"}
          </h1>
          <p className="text-xs font-bold text-muted-foreground mt-0.5">
            {language === "he" ? "הגדר שמות לשחקנים 1–8" : "Set names for players 1–8"}
          </p>
        </div>

        <div className="w-11" />
      </motion.header>

      {/* Player slots — scrollable */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="space-y-2.5 max-w-md mx-auto pb-4">
          {localPlayers.map((name: string, index: number) => {
            const color = PLAYER_COLORS[index]
            const placeholder = language === "he" ? `שחקן ${index + 1}` : `Player ${index + 1}`

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="flex items-center gap-3"
              >
                {/* Numbered color dot */}
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm"
                  style={{ background: color }}
                >
                  <span className="text-white font-black text-sm">{index + 1}</span>
                </div>

                {/* Input */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
                    placeholder={placeholder}
                    maxLength={20}
                    className="w-full px-4 py-2.5 rounded-full border-2 border-border bg-card text-foreground text-sm font-bold focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/40"
                  />
                  <AnimatePresence>
                    {name && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        onClick={() => handleClear(index)}
                        className={`absolute top-1/2 -translate-y-1/2 ${direction === "rtl" ? "left-3" : "right-3"} w-6 h-6 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center cursor-pointer hover:bg-secondary/60 transition-colors`}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs font-bold text-muted-foreground pt-2 leading-relaxed"
          >
            {language === "he"
              ? "שמות אלה ישמשו בכל המשחקים ויופיעו בטבלת הסטטיסטיקות"
              : "These names will be used in all games and appear in the stats table"}
          </motion.p>
        </div>
      </div>

      {/* Save button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="pt-4 flex-shrink-0 relative z-10"
      >
        <button
          onClick={handleSave}
          className="w-full py-5 rounded-full bg-foreground text-background font-black text-sm shadow-[0_12px_36px_rgba(0,0,0,0.15)] hover:bg-foreground/90 transition-all cursor-pointer flex items-center justify-center gap-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          {language === "he" ? "שמור" : "Save"}
          {activeCount > 0 && (
            <span className="text-background/60 font-bold text-xs">
              ({activeCount} {language === "he" ? "שחקנים" : "players"})
            </span>
          )}
        </button>
      </motion.div>
    </div>
  )
}

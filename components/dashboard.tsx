"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"
import type { GameType } from "@/lib/stats-store"

interface DashboardProps {
  onSelectGame: (game: GameType) => void
  onOpenStats: () => void
  onOpenPlayers: () => void
}

const GAMES: { 
  id: GameType
  icon: string
  category: "group" | "solo"
  playerCount: { he: string; en: string }
  badge: { he: string; en: string } | null
}[] = [
  { 
    id: "fingerDice", 
    icon: "👆", 
    category: "group", 
    playerCount: { he: "2-10 שחקנים", en: "2-10 Players" },
    badge: { he: "הכי פופולרי", en: "Popular" }
  },
  { 
    id: "diceRoller", 
    icon: "🎲", 
    category: "group", 
    playerCount: { he: "1+ שחקנים", en: "1+ Players" },
    badge: null
  },
  { 
    id: "coinFlip", 
    icon: "🪙", 
    category: "solo", 
    playerCount: { he: "1-2 שחקנים", en: "1-2 Players" },
    badge: null
  },
  { 
    id: "randomPicker", 
    icon: "🎰", 
    category: "solo", 
    playerCount: { he: "1+ שחקנים", en: "1+ Players" },
    badge: { he: "מהיר", en: "Quick" }
  },
  { 
    id: "colorRoulette", 
    icon: "🎨", 
    category: "group", 
    playerCount: { he: "2+ שחקנים", en: "2+ Players" },
    badge: null
  },
  { 
    id: "reactionTime", 
    icon: "⚡", 
    category: "solo", 
    playerCount: { he: "2 שחקנים", en: "2 Players" },
    badge: null
  },
  { 
    id: "drawStraws", 
    icon: "🥢", 
    category: "group", 
    playerCount: { he: "2-8 שחקנים", en: "2-8 Players" },
    badge: null
  },
]

export function Dashboard({ onSelectGame, onOpenStats, onOpenPlayers }: DashboardProps) {
  const { t, language, setLanguage, direction } = useLanguage()
  const { soundEnabled, setSoundEnabled } = useStats()
  
  const [filter, setFilter] = useState<"all" | "group" | "solo">("all")
  const [selectedGame, setSelectedGame] = useState<GameType>("fingerDice")

  const handleGameSelect = (gameId: GameType) => {
    playSound("click", soundEnabled)
    setSelectedGame(gameId)
  }

  const handleLaunchGame = () => {
    playSound("success", soundEnabled)
    onSelectGame(selectedGame)
  }

  const filteredGames = GAMES.filter(game => {
    if (filter === "all") return true
    return game.category === filter
  })

  return (
    <div className="fixed inset-0 bg-background overflow-hidden flex flex-col px-6 pt-8 pb-6" dir={direction}>
      
      {/* Decorative Background Blob Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-200/20 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-orange-200/20 blur-3xl" />
      </div>

      {/* Header section */}
      <header className="relative z-10 flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {t("app.title")}
          </h1>
          <p className="text-xs font-bold text-muted-foreground mt-1">
            {t("app.subtitle")}
          </p>
        </div>
        
        {/* Controls block */}
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={() => window.location.reload()}
            className="p-3 rounded-full bg-card border-2 border-border text-foreground hover:bg-secondary/40 shadow-sm transition-all cursor-pointer"
            aria-label="Refresh"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Sound toggle pill */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled)
              playSound("click", true)
            }}
            className="p-3 rounded-full bg-card border-2 border-border text-foreground hover:bg-secondary/40 shadow-sm transition-all cursor-pointer"
            aria-label={soundEnabled ? "Mute" : "Unmute"}
          >
            {soundEnabled ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
          
          {/* Language toggle pill */}
          <button
            onClick={() => {
              playSound("click", soundEnabled)
              setLanguage(language === "he" ? "en" : "he")
            }}
            className="px-4 py-2.5 rounded-full bg-card border-2 border-border text-xs font-black text-foreground hover:bg-secondary/40 shadow-sm transition-all cursor-pointer"
          >
            {language === "he" ? "EN" : "עב"}
          </button>
        </div>
      </header>

      {/* Filter Categories Selector using Mockup Dot Toggles */}
      <div className="relative z-10 flex gap-3 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all", he: "הכל", en: "All" },
          { id: "group", he: "קבוצתי", en: "Group" },
          { id: "solo", he: "אישי", en: "Solo" },
        ].map((item) => {
          const isActive = filter === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                playSound("click", soundEnabled)
                setFilter(item.id as any)
              }}
              className={`flex items-center gap-3 px-5 py-3 rounded-full border-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {/* Dot housing */}
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                isActive ? "border-background" : "border-muted-foreground"
              }`}>
                {isActive && <span className="w-2 h-2 rounded-full bg-background" />}
              </span>
              <span className="font-extrabold text-xs">
                {language === "he" ? item.he : item.en}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main Game Grid list */}
      <div className="flex-1 overflow-y-auto mb-20 scrollbar-none pr-1 pl-1">
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pb-6">
          {filteredGames.map((game) => {
            const isSelected = selectedGame === game.id
            const displayTitle = t(`game.${game.id}`)
            const displayPlayers = language === "he" ? game.playerCount.he : game.playerCount.en
            const badgeText = game.badge ? (language === "he" ? game.badge.he : game.badge.en) : null

            return (
              <motion.button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                whileTap={{ scale: 0.96 }}
                className={`relative rounded-[32px] p-5 flex flex-col justify-between items-start text-start aspect-[1/1.05] border-2 transition-all shadow-[0_12px_36px_rgba(0,0,0,0.02)] cursor-pointer overflow-hidden ${
                  isSelected
                    ? "bg-primary border-primary text-white shadow-[0_12px_40px_rgba(59,130,246,0.3)]"
                    : "bg-card border-border text-foreground hover:bg-secondary/20"
                }`}
              >
                {/* Highlight active selection glow */}
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                )}

                {/* Badge if present */}
                {badgeText && (
                  <span className={`absolute top-4 right-4 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isSelected ? "bg-white text-primary" : "bg-primary/10 text-primary"
                  }`}>
                    {badgeText}
                  </span>
                )}

                {/* Big icon */}
                <span className="text-5xl mt-2 select-none" role="img" aria-hidden="true">
                  {game.icon}
                </span>

                {/* Text details */}
                <div className="w-full mt-4">
                  <h3 className="text-base font-black tracking-tight leading-tight line-clamp-1">
                    {displayTitle}
                  </h3>
                  <p className={`text-[10px] font-bold mt-1 ${
                    isSelected ? "text-white/80" : "text-muted-foreground"
                  }`}>
                    {displayPlayers}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Bottom Sticky Action Block */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-6 pb-6 bg-gradient-to-t from-background via-background/90 to-transparent pt-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          
          {/* Players button */}
          <button
            onClick={() => {
              playSound("click", soundEnabled)
              onOpenPlayers()
            }}
            className="p-5 rounded-full border-2 border-border bg-card text-foreground hover:bg-secondary/40 shadow-md transition-all cursor-pointer"
            aria-label="Players"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Stats icon button */}
          <button
            onClick={() => {
              playSound("click", soundEnabled)
              onOpenStats()
            }}
            className="p-5 rounded-full border-2 border-border bg-card text-foreground hover:bg-secondary/40 shadow-md transition-all cursor-pointer"
            aria-label="Stats Center"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>

          {/* Primary Start Game Capsule Button with mockup ">>>" arrow symbol */}
          <button
            onClick={handleLaunchGame}
            className="flex-1 flex items-center justify-between px-8 py-5 rounded-full bg-foreground text-background font-black text-sm shadow-[0_12px_36px_rgba(0,0,0,0.15)] hover:bg-foreground/90 transition-all cursor-pointer"
          >
            <span>
              {language === "he" 
                ? `להתחיל: ${t(`game.${selectedGame}`)}`
                : `Play: ${t(`game.${selectedGame}`)}`}
            </span>
            <span className="tracking-widest opacity-80" dir="ltr"> &gt;&gt;&gt;</span>
          </button>
          
        </div>
      </div>
    </div>
  )
}

"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"
import type { GameType } from "@/lib/stats-store"

interface DashboardProps {
  onSelectGame: (game: GameType) => void
  onOpenStats: () => void
}

const GAMES: { id: GameType; icon: string; gradient: string; glowColor: string }[] = [
  { 
    id: "fingerDice", 
    icon: "👆", 
    gradient: "from-pink-500 to-rose-600",
    glowColor: "rgba(236, 72, 153, 0.5)"
  },
  { 
    id: "diceRoller", 
    icon: "🎲", 
    gradient: "from-cyan-500 to-blue-600",
    glowColor: "rgba(6, 182, 212, 0.5)"
  },
  { 
    id: "coinFlip", 
    icon: "🪙", 
    gradient: "from-amber-400 to-yellow-500",
    glowColor: "rgba(251, 191, 36, 0.5)"
  },
  { 
    id: "randomPicker", 
    icon: "🎰", 
    gradient: "from-purple-500 to-violet-600",
    glowColor: "rgba(168, 85, 247, 0.5)"
  },
  { 
    id: "colorRoulette", 
    icon: "🎨", 
    gradient: "from-emerald-500 to-teal-600",
    glowColor: "rgba(16, 185, 129, 0.5)"
  },
  { 
    id: "reactionTime", 
    icon: "⚡", 
    gradient: "from-red-500 to-orange-600",
    glowColor: "rgba(239, 68, 68, 0.5)"
  },
  { 
    id: "drawStraws", 
    icon: "🥢", 
    gradient: "from-lime-500 to-green-600",
    glowColor: "rgba(132, 204, 22, 0.5)"
  },
]

export function Dashboard({ onSelectGame, onOpenStats }: DashboardProps) {
  const { t, language, setLanguage, direction } = useLanguage()
  const { soundEnabled, setSoundEnabled } = useStats()

  const handleGameSelect = (game: GameType) => {
    playSound("click", soundEnabled)
    onSelectGame(game)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  }

  return (
    <div className="fixed inset-0 bg-background overflow-hidden flex flex-col" dir={direction}>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)",
            top: "-10%",
            left: "-10%",
            animation: "pulse 8s ease-in-out infinite",
          }}
        />
        <div 
          className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)",
            bottom: "-10%",
            right: "-10%",
            animation: "pulse 10s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-6 pt-8 pb-4"
      >
        <div className="flex items-center justify-between">
          <motion.h1 
            className="text-3xl font-bold text-foreground"
            initial={{ opacity: 0, x: direction === "rtl" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {t("app.title")}
          </motion.h1>
          
          <div className="flex items-center gap-2">
            {/* Sound toggle */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => {
                setSoundEnabled(!soundEnabled)
                playSound("click", true)
              }}
              className="p-2 rounded-full bg-secondary/50 backdrop-blur-sm border border-border/50 text-foreground/70 hover:text-foreground hover:bg-secondary transition-all"
              aria-label={soundEnabled ? "Mute" : "Unmute"}
            >
              {soundEnabled ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </motion.button>
            
            {/* Language toggle */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => {
                playSound("click", soundEnabled)
                setLanguage(language === "he" ? "en" : "he")
              }}
              className="px-3 py-2 rounded-full bg-secondary/50 backdrop-blur-sm border border-border/50 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary transition-all"
            >
              {language === "he" ? "EN" : "עב"}
            </motion.button>
          </div>
        </div>
        
        <motion.p 
          className="text-muted-foreground mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {t("app.subtitle")}
        </motion.p>
      </motion.header>

      {/* Games Grid */}
      <motion.div 
        className="flex-1 px-4 pb-24 overflow-y-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          {GAMES.map((game) => (
            <motion.button
              key={game.id}
              variants={itemVariants}
              onClick={() => handleGameSelect(game.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative group aspect-[4/3] rounded-2xl overflow-hidden"
            >
              {/* Glow effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: `0 0 40px ${game.glowColor}, 0 0 80px ${game.glowColor}`,
                }}
              />
              
              {/* Glass background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-20`} />
              <div className="absolute inset-0 bg-card/60 backdrop-blur-xl border border-border/50" />
              
              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center p-4">
                <span className="text-4xl mb-2" role="img" aria-hidden="true">
                  {game.icon}
                </span>
                <h3 className="text-sm font-semibold text-foreground text-center leading-tight">
                  {t(`game.${game.id}`)}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1 text-center line-clamp-2">
                  {t(`game.${game.id}.desc`)}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Bottom Navigation */}
      <motion.nav 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 z-20"
      >
        <div className="mx-4 mb-4 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 overflow-hidden">
          <div className="flex items-center justify-around p-2">
            <button 
              className="flex-1 flex flex-col items-center py-3 px-4 rounded-xl bg-primary/10 text-primary"
              onClick={() => playSound("click", soundEnabled)}
            >
              <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">{t("menu.play")}</span>
            </button>
            
            <button 
              className="flex-1 flex flex-col items-center py-3 px-4 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              onClick={() => {
                playSound("click", soundEnabled)
                onOpenStats()
              }}
            >
              <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs font-medium">{t("menu.stats")}</span>
            </button>
          </div>
        </div>
      </motion.nav>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

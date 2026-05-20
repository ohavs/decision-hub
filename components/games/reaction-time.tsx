"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"

type GamePhase = "setup" | "waiting" | "ready" | "go" | "tooEarly" | "result"

interface PlayerZone {
  id: number
  name: string
  reactionTime: number | null
  tappedTooEarly: boolean
  color: string
}

const ZONE_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#eab308", // yellow
  "#a855f7", // purple
  "#f97316", // orange
]

export function ReactionTime() {
  const { t, language, direction } = useLanguage()
  const { soundEnabled, recordWin } = useStats()
  
  const [playerCount, setPlayerCount] = useState(2)
  const [players, setPlayers] = useState<PlayerZone[]>([])
  const [phase, setPhase] = useState<GamePhase>("setup")
  const [goTime, setGoTime] = useState<number>(0)
  const [winner, setWinner] = useState<PlayerZone | null>(null)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize players
  useEffect(() => {
    if (phase === "setup") {
      setPlayers(
        Array.from({ length: playerCount }, (_, i) => ({
          id: i,
          name: `${language === "he" ? "שחקן" : "Player"} ${i + 1}`,
          reactionTime: null,
          tappedTooEarly: false,
          color: ZONE_COLORS[i % ZONE_COLORS.length],
        }))
      )
    }
  }, [playerCount, phase, language])

  const startGame = useCallback(() => {
    setPhase("waiting")
    setWinner(null)
    setPlayers(prev => prev.map(p => ({ ...p, reactionTime: null, tappedTooEarly: false })))
    
    // Random delay between 2-5 seconds
    const delay = 2000 + Math.random() * 3000
    
    timeoutRef.current = setTimeout(() => {
      setPhase("go")
      setGoTime(Date.now())
      playSound("ding", soundEnabled)
    }, delay)
  }, [soundEnabled])

  const handleZoneTap = useCallback((playerId: number) => {
    if (phase === "setup" || phase === "result") return
    
    if (phase === "waiting") {
      // Too early!
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, tappedTooEarly: true } : p
      ))
      setPhase("tooEarly")
      playSound("buzz", soundEnabled)
      
      // Auto reset after 2 seconds
      setTimeout(() => {
        setPhase("setup")
      }, 2000)
      return
    }
    
    if (phase === "go") {
      const reactionTime = Date.now() - goTime
      
      setPlayers(prev => {
        const updated = prev.map(p => 
          p.id === playerId && p.reactionTime === null
            ? { ...p, reactionTime }
            : p
        )
        
        // Check if all players have tapped
        const allTapped = updated.every(p => p.reactionTime !== null)
        if (allTapped) {
          const fastest = updated.reduce((min, p) => 
            (p.reactionTime || Infinity) < (min.reactionTime || Infinity) ? p : min
          )
          setWinner(fastest)
          setPhase("result")
          playSound("success", soundEnabled)
          recordWin("reactionTime", fastest.name, updated.map(p => p.name))
        }
        
        return updated
      })
      
      playSound("pop", soundEnabled)
    }
  }, [phase, goTime, soundEnabled, recordWin])

  const resetGame = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setPhase("setup")
    setWinner(null)
    playSound("click", soundEnabled)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const getPhaseColor = () => {
    switch (phase) {
      case "waiting":
        return "#ef4444" // red
      case "go":
        return "#22c55e" // green
      case "tooEarly":
        return "#ef4444" // red
      default:
        return "transparent"
    }
  }

  return (
    <div className="h-full flex flex-col" dir={direction}>
      {/* Setup phase */}
      {phase === "setup" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center p-6"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {language === "he" ? "מספר שחקנים" : "Number of Players"}
          </h2>
          
          <div className="flex items-center gap-3 mb-8">
            {[2, 3, 4, 5, 6].map(count => (
              <button
                key={count}
                onClick={() => {
                  setPlayerCount(count)
                  playSound("click", soundEnabled)
                }}
                className={`w-12 h-12 rounded-xl font-semibold transition-all ${
                  playerCount === count
                    ? "bg-primary text-primary-foreground scale-110"
                    : "bg-secondary/50 text-foreground/70 hover:bg-secondary"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="px-12 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold text-lg shadow-lg"
            style={{
              boxShadow: "0 10px 40px rgba(239, 68, 68, 0.4)",
            }}
          >
            {t("game.start")}
          </motion.button>
        </motion.div>
      )}

      {/* Game phase */}
      {(phase === "waiting" || phase === "go" || phase === "tooEarly") && (
        <div className="flex-1 flex flex-col">
          {/* Status indicator */}
          <motion.div
            animate={{ backgroundColor: getPhaseColor() }}
            className="py-4 text-center"
          >
            <p className="text-white font-bold text-xl">
              {phase === "waiting" && t("reaction.wait")}
              {phase === "go" && t("reaction.go")}
              {phase === "tooEarly" && t("reaction.tooEarly")}
            </p>
          </motion.div>
          
          {/* Player zones */}
          <div 
            className={`flex-1 grid gap-1 p-1 ${
              playerCount <= 2 ? "grid-rows-2" : 
              playerCount <= 4 ? "grid-rows-2 grid-cols-2" :
              "grid-rows-3 grid-cols-2"
            }`}
          >
            {players.map((player) => (
              <motion.button
                key={player.id}
                onTouchStart={() => handleZoneTap(player.id)}
                onClick={() => handleZoneTap(player.id)}
                disabled={player.reactionTime !== null || player.tappedTooEarly}
                className="relative flex items-center justify-center rounded-xl transition-all"
                style={{
                  backgroundColor: player.tappedTooEarly 
                    ? "rgba(239, 68, 68, 0.3)" 
                    : player.reactionTime !== null
                    ? "rgba(34, 197, 94, 0.3)"
                    : `${player.color}20`,
                  border: `2px solid ${player.color}`,
                }}
                animate={phase === "go" && player.reactionTime === null ? {
                  scale: [1, 1.02, 1],
                } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <div className="text-center">
                  <p className="font-semibold text-foreground">{player.name}</p>
                  {player.reactionTime !== null && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-2xl font-bold"
                      style={{ color: player.color }}
                    >
                      {player.reactionTime} {t("reaction.ms")}
                    </motion.p>
                  )}
                  {player.tappedTooEarly && (
                    <p className="text-red-500 font-medium">{t("reaction.tooEarly")}</p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Result phase */}
      {phase === "result" && winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-center mb-8"
          >
            <p className="text-muted-foreground mb-2">{t("game.winner")}</p>
            <p 
              className="text-4xl font-bold mb-2"
              style={{ color: winner.color }}
            >
              {winner.name}
            </p>
            <p className="text-2xl text-foreground">
              {winner.reactionTime} {t("reaction.ms")}
            </p>
          </motion.div>
          
          {/* All results */}
          <div className="w-full max-w-sm space-y-2 mb-8">
            {[...players]
              .sort((a, b) => (a.reactionTime || Infinity) - (b.reactionTime || Infinity))
              .map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-card/60 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    <span className="font-medium text-foreground">{player.name}</span>
                  </div>
                  <span 
                    className="font-bold"
                    style={{ color: player.color }}
                  >
                    {player.reactionTime} {t("reaction.ms")}
                  </span>
                </motion.div>
              ))}
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
            className="px-12 py-4 rounded-2xl bg-secondary text-foreground font-semibold text-lg"
          >
            {t("game.reset")}
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}

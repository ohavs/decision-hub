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
  bgLight: string
}

const ZONE_COLORS = [
  { hex: "#ef4444", bgLight: "rgba(239, 68, 68, 0.08)" }, // red
  { hex: "#3b82f6", bgLight: "rgba(59, 130, 246, 0.08)" }, // blue
  { hex: "#10b981", bgLight: "rgba(16, 185, 129, 0.08)" }, // green
  { hex: "#eab308", bgLight: "rgba(234, 179, 8, 0.08)" }, // yellow
  { hex: "#a855f7", bgLight: "rgba(168, 85, 247, 0.08)" }, // purple
  { hex: "#f97316", bgLight: "rgba(249, 115, 22, 0.08)" }, // orange
]

export function ReactionTime() {
  const { t, language, direction } = useLanguage()
  const { soundEnabled, recordWin, namedPlayers } = useStats()
  
  const [playerCount, setPlayerCount] = useState(2)
  const [players, setPlayers] = useState<PlayerZone[]>([])
  const [phase, setPhase] = useState<GamePhase>("setup")
  const [goTime, setGoTime] = useState<number>(0)
  const [winner, setWinner] = useState<PlayerZone | null>(null)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const getPlayerName = (index: number) => {
    const named = namedPlayers[index]?.trim()
    if (named) return named
    return language === "he" ? `שחקן ${index + 1}` : `Player ${index + 1}`
  }

  // Initialize players
  useEffect(() => {
    if (phase === "setup") {
      setPlayers(
        Array.from({ length: playerCount }, (_, i) => ({
          id: i,
          name: getPlayerName(i),
          reactionTime: null,
          tappedTooEarly: false,
          color: ZONE_COLORS[i % ZONE_COLORS.length].hex,
          bgLight: ZONE_COLORS[i % ZONE_COLORS.length].bgLight,
        }))
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerCount, phase, language, namedPlayers])

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

  const handleZoneTap = useCallback((playerId: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
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

  return (
    <div className="h-full flex flex-col bg-background select-none" dir={direction}>
      
      {/* Setup phase */}
      {phase === "setup" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center p-6"
        >
          {/* Decorative Blob */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
            <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-red-200/20 blur-3xl" />
          </div>

          <h2 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-6">
            {language === "he" ? "מספר שחקנים" : "Number of Players"}
          </h2>
          
          <div className="flex items-center justify-center gap-3 mb-10 relative z-10">
            {[2, 3, 4, 5, 6].map(count => (
              <button
                key={count}
                onClick={() => {
                  setPlayerCount(count)
                  playSound("click", soundEnabled)
                }}
                className={`w-12 h-12 rounded-full border-2 font-black text-sm transition-all cursor-pointer shadow-sm ${
                  playerCount === count
                    ? "border-foreground bg-foreground text-background scale-110"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
          
          {/* Start Game capsule button */}
          <button
            onClick={startGame}
            className="relative z-10 w-full max-w-xs flex items-center justify-between px-8 py-5 rounded-full bg-foreground text-background font-black text-sm shadow-[0_12px_36px_rgba(0,0,0,0.15)] hover:bg-foreground/90 transition-all cursor-pointer"
          >
            <span>{t("game.start")}</span>
            <span className="tracking-widest opacity-80" dir="ltr"> &gt;&gt;&gt;</span>
          </button>
        </motion.div>
      )}

      {/* Game phase */}
      {(phase === "waiting" || phase === "go" || phase === "tooEarly") && (
        <div className="flex-1 flex flex-col px-4 pt-20 pb-4">
          {/* Status banner indicator */}
          <motion.div
            className={`w-full py-4 px-6 rounded-full text-center border-2 mb-4 ${
              phase === "waiting" 
                ? "bg-red-50 border-red-200 text-red-600" 
                : phase === "go" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            <p className="font-black text-base uppercase tracking-wider">
              {phase === "waiting" && t("reaction.wait")}
              {phase === "go" && t("reaction.go")}
              {phase === "tooEarly" && t("reaction.tooEarly")}
            </p>
          </motion.div>
          
          {/* Player touch zones */}
          <div 
            className={`flex-1 grid gap-4 ${
              playerCount <= 2 ? "grid-rows-2" : 
              playerCount <= 4 ? "grid-rows-2 grid-cols-2" :
              "grid-rows-3 grid-cols-2"
            }`}
          >
            {players.map((player) => (
              <button
                key={player.id}
                onTouchStart={(e) => handleZoneTap(player.id, e)}
                onMouseDown={(e) => handleZoneTap(player.id, e)}
                disabled={player.reactionTime !== null || player.tappedTooEarly}
                className="relative flex items-center justify-center rounded-[32px] border-4 transition-all shadow-[0_8px_24px_rgba(0,0,0,0.015)] overflow-hidden cursor-pointer"
                style={{
                  backgroundColor: player.tappedTooEarly 
                    ? "rgba(239, 68, 68, 0.15)" 
                    : player.reactionTime !== null
                    ? "rgba(16, 185, 129, 0.15)"
                    : player.bgLight,
                  borderColor: player.tappedTooEarly 
                    ? "#ef4444" 
                    : player.reactionTime !== null
                    ? "#10b981"
                    : player.color,
                }}
              >
                <div className="text-center p-3">
                  <p className="font-black text-base text-foreground mb-1">{player.name}</p>
                  {player.reactionTime !== null && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-2xl font-black tracking-tight"
                      style={{ color: player.color }}
                    >
                      {player.reactionTime} {t("reaction.ms")}
                    </motion.p>
                  )}
                  {player.tappedTooEarly && (
                    <p className="text-red-500 font-extrabold text-sm">{t("reaction.tooEarly")}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result phase */}
      {phase === "result" && winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center p-6 pt-20"
        >
          {/* Decorative Blob */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-emerald-200/20 blur-3xl" />
          </div>

          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="text-center mb-8 relative z-10"
          >
            <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">{t("game.winner")}</p>
            <p 
              className="text-4xl font-black tracking-tight mb-2"
              style={{ color: winner.color }}
            >
              {winner.name}
            </p>
            <p className="text-2xl font-black text-foreground">
              {winner.reactionTime} {t("reaction.ms")}
            </p>
          </motion.div>
          
          {/* Scoreboard table */}
          <div className="w-full max-w-sm space-y-3 mb-8 relative z-10">
            {[...players]
              .sort((a, b) => (a.reactionTime || Infinity) - (b.reactionTime || Infinity))
              .map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between px-5 py-4 rounded-[24px] bg-card border-2 border-border shadow-[0_12px_24px_rgba(0,0,0,0.01)]"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-muted-foreground/60">#{index + 1}</span>
                    <span className="font-extrabold text-foreground text-sm">{player.name}</span>
                  </div>
                  <span 
                    className="font-black text-sm"
                    style={{ color: player.color }}
                  >
                    {player.reactionTime} {t("reaction.ms")}
                  </span>
                </motion.div>
              ))}
          </div>
          
          {/* Reset Capsule Button */}
          <button
            onClick={resetGame}
            className="relative z-10 w-full max-w-xs flex items-center justify-between px-8 py-5 rounded-full bg-foreground text-background font-black text-sm shadow-[0_12px_36px_rgba(0,0,0,0.15)] hover:bg-foreground/90 transition-all cursor-pointer"
          >
            <span>{t("game.reset")}</span>
            <span className="tracking-widest opacity-80" dir="ltr"> &gt;&gt;&gt;</span>
          </button>
        </motion.div>
      )}
    </div>
  )
}

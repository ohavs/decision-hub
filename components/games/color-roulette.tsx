"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"

const COLORS = [
  { name: "Red", hex: "#ef4444", glow: "rgba(239, 68, 68, 0.6)" },
  { name: "Blue", hex: "#3b82f6", glow: "rgba(59, 130, 246, 0.6)" },
  { name: "Green", hex: "#22c55e", glow: "rgba(34, 197, 94, 0.6)" },
  { name: "Yellow", hex: "#eab308", glow: "rgba(234, 179, 8, 0.6)" },
  { name: "Purple", hex: "#a855f7", glow: "rgba(168, 85, 247, 0.6)" },
  { name: "Pink", hex: "#ec4899", glow: "rgba(236, 72, 153, 0.6)" },
  { name: "Orange", hex: "#f97316", glow: "rgba(249, 115, 22, 0.6)" },
  { name: "Cyan", hex: "#06b6d4", glow: "rgba(6, 182, 212, 0.6)" },
]

interface Player {
  id: string
  name: string
  color: typeof COLORS[number]
}

export function ColorRoulette() {
  const { t, language, direction } = useLanguage()
  const { soundEnabled, recordWin } = useStats()
  
  const [players, setPlayers] = useState<Player[]>([])
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<Player | null>(null)
  const [orbPosition, setOrbPosition] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const colorIndexRef = useRef(0)

  const addPlayer = useCallback(() => {
    if (players.length >= COLORS.length) return
    
    const color = COLORS[colorIndexRef.current % COLORS.length]
    colorIndexRef.current++
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: `${language === "he" ? "שחקן" : "Player"} ${players.length + 1}`,
      color,
    }
    
    setPlayers(prev => [...prev, newPlayer])
    playSound("pop", soundEnabled)
  }, [players, soundEnabled, language])

  const removePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id))
    playSound("click", soundEnabled)
  }

  const spin = useCallback(() => {
    if (spinning || players.length < 2) return
    
    setSpinning(true)
    setWinner(null)
    playSound("spin", soundEnabled)
    
    // Get container bounds
    const container = containerRef.current
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const radius = Math.min(rect.width, rect.height) * 0.35
    
    // Animate orb bouncing between players
    let bounceCount = 0
    const totalBounces = 15 + Math.floor(Math.random() * 10)
    const winnerIndex = Math.floor(Math.random() * players.length)
    
    const bounceInterval = setInterval(() => {
      const targetIndex = bounceCount < totalBounces - 1
        ? Math.floor(Math.random() * players.length)
        : winnerIndex
      
      const angle = (targetIndex / players.length) * Math.PI * 2 - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      
      setOrbPosition({ x, y })
      playSound("tick", soundEnabled)
      bounceCount++
      
      if (bounceCount >= totalBounces) {
        clearInterval(bounceInterval)
        setWinner(players[winnerIndex])
        setSpinning(false)
        playSound("success", soundEnabled)
        recordWin("colorRoulette", players[winnerIndex].name, players.map(p => p.name))
      }
    }, 100 + bounceCount * 20)
  }, [spinning, players, soundEnabled, recordWin])

  const resetGame = () => {
    setWinner(null)
    setOrbPosition(null)
    playSound("click", soundEnabled)
  }

  return (
    <div className="h-full flex flex-col p-6 pt-16" dir={direction}>
      {/* Players display */}
      <div 
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center"
      >
        {/* Player circles arranged in a ring */}
        {players.map((player, index) => {
          const angle = (index / players.length) * Math.PI * 2 - Math.PI / 2
          const radius = Math.min(window.innerWidth, window.innerHeight) * 0.28
          const x = 50 + Math.cos(angle) * 35
          const y = 50 + Math.sin(angle) * 35
          
          return (
            <motion.div
              key={player.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: winner?.id === player.id ? 1.3 : 1, 
                opacity: 1 
              }}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <motion.div
                animate={winner?.id === player.id ? {
                  boxShadow: [
                    `0 0 20px ${player.color.glow}`,
                    `0 0 60px ${player.color.glow}`,
                    `0 0 20px ${player.color.glow}`,
                  ],
                } : {}}
                transition={{ duration: 0.5, repeat: winner?.id === player.id ? Infinity : 0 }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  backgroundColor: player.color.hex,
                  boxShadow: `0 0 20px ${player.color.glow}`,
                }}
                onClick={() => !spinning && removePlayer(player.id)}
              >
                <span className="text-white font-bold text-xs sm:text-sm text-center px-1">
                  {player.name.length > 8 ? player.name.slice(0, 6) + "..." : player.name}
                </span>
              </motion.div>
            </motion.div>
          )
        })}

        {/* Bouncing orb */}
        <AnimatePresence>
          {orbPosition && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ 
                x: orbPosition.x - 24,
                y: orbPosition.y - 24,
                scale: 1,
              }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute top-0 left-0 w-12 h-12 rounded-full"
              style={{
                background: "radial-gradient(circle at 30% 30%, white, #ccc)",
                boxShadow: "0 0 30px white, 0 0 60px white",
              }}
            />
          )}
        </AnimatePresence>

        {/* Center add button */}
        {players.length < COLORS.length && !spinning && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={addPlayer}
            className="absolute w-16 h-16 rounded-full bg-card/80 backdrop-blur border border-border/50 flex items-center justify-center text-2xl text-foreground/70 hover:text-foreground transition-colors"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            +
          </motion.button>
        )}

        {/* Instructions */}
        {players.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground text-center"
          >
            {t("roulette.addPlayer")}
          </motion.p>
        )}
      </div>

      {/* Winner announcement */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center mb-6"
          >
            <p className="text-sm text-muted-foreground">{t("game.winner")}</p>
            <p 
              className="text-3xl font-bold"
              style={{ color: winner.color.hex }}
            >
              {winner.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-3">
        {winner ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={resetGame}
            className="flex-1 py-4 rounded-2xl bg-secondary text-foreground font-semibold text-lg"
          >
            {t("game.reset")}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={spin}
            disabled={spinning || players.length < 2}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg shadow-lg disabled:opacity-50 transition-all"
            style={{
              boxShadow: "0 10px 40px rgba(16, 185, 129, 0.4)",
            }}
          >
            {spinning ? t("roulette.spinning") : t("roulette.spin")}
          </motion.button>
        )}
      </div>
    </div>
  )
}

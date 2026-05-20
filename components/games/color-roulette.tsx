"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"

const COLORS = [
  { name: "Red", hex: "#f43f5e", glow: "rgba(244, 63, 94, 0.25)" },
  { name: "Blue", hex: "#3b82f6", glow: "rgba(59, 130, 246, 0.25)" },
  { name: "Green", hex: "#10b981", glow: "rgba(16, 185, 129, 0.25)" },
  { name: "Yellow", hex: "#eab308", glow: "rgba(234, 179, 8, 0.25)" },
  { name: "Purple", hex: "#8b5cf6", glow: "rgba(139, 92, 246, 0.25)" },
  { name: "Pink", hex: "#ec4899", glow: "rgba(236, 72, 153, 0.25)" },
  { name: "Orange", hex: "#f97316", glow: "rgba(249, 115, 22, 0.25)" },
  { name: "Cyan", hex: "#06b6d4", glow: "rgba(6, 182, 212, 0.25)" },
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
    
    const container = containerRef.current
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const radius = Math.min(rect.width, rect.height) * 0.35
    
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
    <div className="h-full flex flex-col p-6 pt-20 bg-background select-none" dir={direction}>
      
      {/* Decorative Blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-emerald-200/20 blur-3xl" />
      </div>

      {/* Players display wheel */}
      <div 
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center min-h-0"
      >
        {/* Player circles arranged in a ring */}
        {players.map((player, index) => {
          const angle = (index / players.length) * Math.PI * 2 - Math.PI / 2
          const x = 50 + Math.cos(angle) * 36
          const y = 50 + Math.sin(angle) * 36
          
          return (
            <motion.div
              key={player.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: winner?.id === player.id ? 1.25 : 1, 
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
                    `0 0 50px ${player.color.glow}`,
                    `0 0 20px ${player.color.glow}`,
                  ],
                } : {}}
                transition={{ duration: 0.5, repeat: winner?.id === player.id ? Infinity : 0 }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center cursor-pointer border-4 border-white shadow-lg transition-transform hover:scale-105"
                style={{
                  backgroundColor: player.color.hex,
                }}
                onClick={() => !spinning && removePlayer(player.id)}
              >
                <span className="text-white font-black text-xs sm:text-sm text-center px-1 truncate max-w-full">
                  {player.name.split(" ")[1] || player.name}
                </span>
              </motion.div>
            </motion.div>
          )
        })}

        {/* Bouncing selector orb */}
        <AnimatePresence>
          {orbPosition && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ 
                x: orbPosition.x - 20,
                y: orbPosition.y - 20,
                scale: 1,
              }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-white shadow-[0_4px_15px_rgba(0,0,0,0.15)]"
              style={{
                background: "radial-gradient(circle at 35% 35%, white, #cbd5e1)",
                boxShadow: "0 0 24px white, 0 0 40px white",
              }}
            />
          )}
        </AnimatePresence>

        {/* Center add button */}
        {players.length < COLORS.length && !spinning && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={addPlayer}
            className="absolute w-14 h-14 rounded-full bg-card border-2 border-border shadow-[0_8px_24px_rgba(0,0,0,0.05)] flex items-center justify-center text-3xl font-black text-foreground hover:bg-secondary/40 transition-colors cursor-pointer"
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
            className="text-sm font-bold text-muted-foreground text-center"
          >
            {t("roulette.addPlayer")}
          </motion.p>
        )}
      </div>

      {/* Winner announcement */}
      <div className="h-20 mb-6 flex items-center justify-center relative z-10">
        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-1">{t("game.winner")}</p>
              <p 
                className="text-3xl font-black tracking-tight"
                style={{ color: winner.color.hex }}
              >
                {winner.name}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spin Capsule Button */}
      <button
        onClick={winner ? resetGame : spin}
        disabled={!winner && (spinning || players.length < 2)}
        className="relative z-10 w-full flex items-center justify-between px-8 py-5 rounded-full bg-foreground text-background font-black text-sm shadow-[0_12px_36px_rgba(0,0,0,0.15)] hover:bg-foreground/90 transition-all cursor-pointer disabled:opacity-50"
      >
        <span>
          {winner 
            ? t("game.reset") 
            : spinning 
              ? t("roulette.spinning") 
              : t("roulette.spin")}
        </span>
        <span className="tracking-widest opacity-80" dir="ltr"> &gt;&gt;&gt;</span>
      </button>
    </div>
  )
}

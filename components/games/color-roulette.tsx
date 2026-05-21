"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"

const COLORS = [
  { hex: "#3b82f6", glow: "rgba(59,130,246,0.4)" },
  { hex: "#f97316", glow: "rgba(249,115,22,0.4)" },
  { hex: "#10b981", glow: "rgba(16,185,129,0.4)" },
  { hex: "#ec4899", glow: "rgba(236,72,153,0.4)" },
  { hex: "#8b5cf6", glow: "rgba(139,92,246,0.4)" },
  { hex: "#eab308", glow: "rgba(234,179,8,0.4)" },
  { hex: "#06b6d4", glow: "rgba(6,182,212,0.4)" },
  { hex: "#f43f5e", glow: "rgba(244,63,94,0.4)" },
]

// Radius of player circles from wheel center, in %
const RING_RADIUS = 37

function ringPos(index: number, total: number) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2
  return {
    x: 50 + Math.cos(angle) * RING_RADIUS,
    y: 50 + Math.sin(angle) * RING_RADIUS,
  }
}

interface Player {
  id: string
  name: string
  colorIndex: number
}

export function ColorRoulette() {
  const { t, language, direction } = useLanguage()
  const { soundEnabled, recordWin, namedPlayers } = useStats()

  const [players, setPlayers] = useState<Player[]>([])
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<Player | null>(null)
  // Orb target in % coords (same coordinate space as ringPos)
  const [orbPos, setOrbPos] = useState<{ x: number; y: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getDefaultName = useCallback((index: number) => {
    return namedPlayers[index]?.trim() || (language === "he" ? `שחקן ${index + 1}` : `Player ${index + 1}`)
  }, [namedPlayers, language])

  const addPlayer = useCallback(() => {
    if (players.length >= COLORS.length) return
    setPlayers((prev: Player[]) => [
      ...prev,
      { id: Date.now().toString(), name: getDefaultName(prev.length), colorIndex: prev.length },
    ])
    playSound("pop", soundEnabled)
  }, [players.length, soundEnabled, getDefaultName])

  const removePlayer = useCallback((id: string) => {
    if (spinning) return
    setPlayers((prev: Player[]) => {
      const next = prev.filter((p: Player) => p.id !== id)
      return next.map((p: Player, i: number) => ({ ...p, colorIndex: i }))
    })
    setWinner(null)
    setOrbPos(null)
    playSound("click", soundEnabled)
  }, [spinning, soundEnabled])

  const spin = useCallback(() => {
    if (spinning || players.length < 2) return

    setSpinning(true)
    setWinner(null)
    playSound("spin", soundEnabled)

    const winnerIndex = Math.floor(Math.random() * players.length)
    const totalSteps = 18 + Math.floor(Math.random() * 8)
    let step = 0

    const doStep = () => {
      const targetIndex = step < totalSteps - 1
        ? Math.floor(Math.random() * players.length)
        : winnerIndex

      setOrbPos(ringPos(targetIndex, players.length))
      playSound("tick", soundEnabled)
      step++

      if (step >= totalSteps) {
        setTimeout(() => {
          setWinner(players[winnerIndex])
          setSpinning(false)
          playSound("success", soundEnabled)
          recordWin("colorRoulette", players[winnerIndex].name, players.map((p: Player) => p.name))
        }, 300)
        return
      }

      // Ease out: start fast (80ms), end slow (500ms)
      const delay = 80 + (step / totalSteps) * (step / totalSteps) * 420
      timerRef.current = setTimeout(doStep, delay)
    }

    timerRef.current = setTimeout(doStep, 80)
  }, [spinning, players, soundEnabled, recordWin])

  const resetGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setWinner(null)
    setOrbPos(null)
    playSound("click", soundEnabled)
  }

  const canSpin = !spinning && players.length >= 2

  return (
    // No dir on this container - it uses physical CSS coordinates (left/top %)
    <div className="h-full flex flex-col pt-20 pb-6 bg-background select-none">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      {/* Wheel area — square, centered */}
      <div className="flex-1 flex items-center justify-center min-h-0 px-6">
        <div
          className="relative"
          style={{ width: "min(72vw, 72vh, 300px)", height: "min(72vw, 72vh, 300px)" }}
        >
          {/* Faint ring guide */}
          {players.length > 0 && (
            <div
              className="absolute rounded-full border-2 border-border/30"
              style={{
                left: `${50 - RING_RADIUS}%`,
                top: `${50 - RING_RADIUS}%`,
                width: `${RING_RADIUS * 2}%`,
                height: `${RING_RADIUS * 2}%`,
              }}
            />
          )}

          {/* Player circles */}
          <AnimatePresence>
            {players.map((player: Player) => {
              const pos = ringPos(player.colorIndex, players.length)
              const color = COLORS[player.colorIndex % COLORS.length]
              const isWinner = winner?.id === player.id
              const shortName = player.name.split(/\s+/).pop() ?? player.name

              return (
                <motion.div
                  key={player.id}
                  className="absolute"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isWinner ? 1.18 : 1,
                    opacity: winner && !isWinner ? 0.45 : 1,
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)" }}
                >
                  <motion.button
                    whileTap={!spinning ? { scale: 0.9 } : {}}
                    onClick={() => removePlayer(player.id)}
                    className="w-14 h-14 rounded-full flex items-center justify-center border-[3px] border-white/70 shadow-lg cursor-pointer relative"
                    style={{
                      backgroundColor: color.hex,
                      boxShadow: isWinner ? `0 0 0 4px ${color.hex}40, 0 0 24px ${color.glow}` : undefined,
                    }}
                  >
                    <span
                      className="text-white font-black text-xs text-center leading-tight px-1 max-w-full truncate"
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)", fontSize: "clamp(9px,2.5vw,12px)" }}
                    >
                      {shortName}
                    </span>
                  </motion.button>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Orb — uses left/top (not x/y transform) to stay direction-agnostic */}
          <AnimatePresence>
            {orbPos && (
              <motion.div
                className="absolute z-10 rounded-full pointer-events-none"
                style={{
                  width: 32,
                  height: 32,
                  transform: "translate(-50%,-50%)",
                  background: "radial-gradient(circle at 35% 30%, #fff, #94a3b8)",
                  boxShadow: "0 0 0 3px white, 0 0 20px rgba(255,255,255,0.8)",
                }}
                animate={{ left: `${orbPos.x}%`, top: `${orbPos.y}%` }}
                initial={{ left: `${orbPos.x}%`, top: `${orbPos.y}%`, scale: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            )}
          </AnimatePresence>

          {/* Center button */}
          <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
            {players.length < COLORS.length && !spinning && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.88 }}
                onClick={addPlayer}
                className="w-14 h-14 rounded-full bg-card border-2 border-border shadow-md flex items-center justify-center cursor-pointer hover:bg-secondary/40 transition-colors"
              >
                <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Status area */}
      <div className="h-16 flex items-center justify-center px-6" dir={direction}>
        <AnimatePresence mode="wait">
          {winner ? (
            <motion.div
              key="winner"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">
                {t("game.winner")}
              </p>
              <p
                className="text-2xl font-black tracking-tight"
                style={{ color: COLORS[winner.colorIndex % COLORS.length].hex }}
              >
                {winner.name}
              </p>
            </motion.div>
          ) : players.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-bold text-muted-foreground text-center"
            >
              {language === "he" ? "לחץ + להוספת שחקנים" : "Tap + to add players"}
            </motion.p>
          ) : players.length === 1 ? (
            <motion.p
              key="one"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-bold text-muted-foreground text-center"
            >
              {language === "he" ? "הוסף עוד שחקן אחד לפחות" : "Add at least one more player"}
            </motion.p>
          ) : spinning ? (
            <motion.p
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-sm font-black text-muted-foreground"
            >
              {t("roulette.spinning")}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Action button */}
      <div className="px-6" dir={direction}>
        <button
          onClick={winner ? resetGame : spin}
          disabled={!winner && !canSpin}
          className="w-full flex items-center justify-between px-8 py-5 rounded-full bg-foreground text-background font-black text-sm shadow-[0_12px_36px_rgba(0,0,0,0.15)] hover:bg-foreground/90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>
            {winner ? t("game.reset") : spinning ? t("roulette.spinning") : t("roulette.spin")}
          </span>
          <span className="tracking-widest opacity-80" dir="ltr">&gt;&gt;&gt;</span>
        </button>
      </div>
    </div>
  )
}

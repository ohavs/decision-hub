"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"

const FINGER_COLORS = [
  "#3b82f6",
  "#f97316",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#eab308",
]

type FingerTouch = {
  id: number
  x: number
  y: number
  colorIndex: number
  playerIndex: number
}

type GamePhase = "idle" | "ready" | "spinning" | "result"

export function FingerDice() {
  const { t, language, direction } = useLanguage()
  const { soundEnabled, recordWin, namedPlayers } = useStats()

  const [fingers, setFingers] = useState<Map<number, FingerTouch>>(new Map())
  const [phase, setPhase] = useState<GamePhase>("idle")
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const [loserId, setLoserId] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef<GamePhase>("idle")
  const fingersRef = useRef<Map<number, FingerTouch>>(new Map())
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const colorCounterRef = useRef(0)
  const playerIndexCounterRef = useRef(0)
  const spinStepRef = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { fingersRef.current = fingers }, [fingers])

  const clearAllTimers = useCallback(() => {
    if (spinTimerRef.current) { clearTimeout(spinTimerRef.current); spinTimerRef.current = null }
    if (readyTimerRef.current) { clearTimeout(readyTimerRef.current); readyTimerRef.current = null }
  }, [])

  const resetGame = useCallback(() => {
    clearAllTimers()
    setFingers(new Map())
    setPhase("idle")
    setHighlighted(null)
    setLoserId(null)
    colorCounterRef.current = 0
    playerIndexCounterRef.current = 0
    spinStepRef.current = 0
  }, [clearAllTimers])

  const getPlayerName = useCallback((playerIndex: number): string => {
    const named = namedPlayers[playerIndex]?.trim()
    if (named) return named
    return language === "he" ? `שחקן ${playerIndex + 1}` : `Player ${playerIndex + 1}`
  }, [namedPlayers, language])

  const startSpin = useCallback(() => {
    const currentFingers: FingerTouch[] = Array.from(fingersRef.current.values())
    if (currentFingers.length < 2) return

    setPhase("spinning")
    phaseRef.current = "spinning"

    const loserIndex = Math.floor(Math.random() * currentFingers.length)

    const totalFingers = currentFingers.length
    const minLaps = 3
    const minSteps = minLaps * totalFingers
    const extraSteps = ((loserIndex - (minSteps % totalFingers)) + totalFingers) % totalFingers
    const totalSteps = minSteps + extraSteps + totalFingers

    spinStepRef.current = 0

    const getDelay = (step: number): number => {
      const progress = step / totalSteps
      return 60 + progress * progress * 540
    }

    const doStep = () => {
      const step = spinStepRef.current
      const fingersCurrent: FingerTouch[] = Array.from(fingersRef.current.values())

      if (fingersCurrent.length < 2 || phaseRef.current !== "spinning") return

      const currentIndex = step % fingersCurrent.length
      const currentFinger: FingerTouch = fingersCurrent[currentIndex]
      setHighlighted(currentFinger.id)
      playSound("tick", soundEnabled)
      spinStepRef.current++

      if (step < totalSteps - 1) {
        spinTimerRef.current = setTimeout(doStep, getDelay(step))
      } else {
        const finalFingers: FingerTouch[] = Array.from(fingersRef.current.values())
        const finalLoser: FingerTouch = finalFingers[loserIndex % finalFingers.length]

        setHighlighted(null)
        setLoserId(finalLoser.id)
        setPhase("result")
        phaseRef.current = "result"
        playSound("lose", soundEnabled)

        const participants = finalFingers.map(f => getPlayerName(f.playerIndex))
        const loserName = getPlayerName(finalLoser.playerIndex)
        recordWin("fingerDice", loserName, participants)
      }
    }

    spinTimerRef.current = setTimeout(doStep, getDelay(0))
  }, [soundEnabled, recordWin, getPlayerName])

  const enterReady = useCallback(() => {
    if (phaseRef.current !== "idle") return
    setPhase("ready")
    phaseRef.current = "ready"
    readyTimerRef.current = setTimeout(() => {
      if (phaseRef.current === "ready") startSpin()
    }, 1200)
  }, [startSpin])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (phaseRef.current === "result" || phaseRef.current === "spinning") {
        resetGame()
        return
      }

      setFingers((prev: Map<number, FingerTouch>) => {
        const next = new Map(prev)
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i]
          if (!next.has(t.identifier)) {
            next.set(t.identifier, {
              id: t.identifier,
              x: t.clientX,
              y: t.clientY,
              colorIndex: colorCounterRef.current % FINGER_COLORS.length,
              playerIndex: playerIndexCounterRef.current,
            })
            colorCounterRef.current++
            playerIndexCounterRef.current++
            playSound("pop", soundEnabled)
          }
        }
        if (next.size >= 2 && phaseRef.current === "idle") {
          setTimeout(enterReady, 0)
        }
        return next
      })
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (phaseRef.current === "result" || phaseRef.current === "spinning") return

      setFingers((prev: Map<number, FingerTouch>) => {
        const next = new Map(prev)
        let changed = false
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i]
          const existing = next.get(t.identifier)
          if (existing) {
            next.set(t.identifier, { ...existing, x: t.clientX, y: t.clientY })
            changed = true
          }
        }
        return changed ? next : prev
      })
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (phaseRef.current === "result") { resetGame(); return }
      if (phaseRef.current === "spinning") return

      setFingers((prev: Map<number, FingerTouch>) => {
        const next = new Map(prev)
        for (let i = 0; i < e.changedTouches.length; i++) {
          next.delete(e.changedTouches[i].identifier)
        }
        if (next.size < 2 && phaseRef.current === "ready") {
          clearAllTimers()
          setPhase("idle")
          phaseRef.current = "idle"
        }
        return next
      })
    }

    el.addEventListener("touchstart", onTouchStart, { passive: false })
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", onTouchEnd, { passive: false })
    el.addEventListener("touchcancel", onTouchEnd, { passive: false })

    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
      el.removeEventListener("touchcancel", onTouchEnd)
    }
  }, [soundEnabled, resetGame, enterReady, clearAllTimers])

  const fingerArray: FingerTouch[] = Array.from(fingers.values())
  const showInstructions = phase === "idle" && fingerArray.length === 0

  return (
    // No dir prop here — finger positions use physical screen coords (clientX/clientY)
    // which are always LTR. dir="rtl" on a transformed parent inverts translateX.
    <div
      ref={containerRef}
      className="fixed inset-0 bg-background overflow-hidden select-none touch-none"
      onClick={() => {
        if (phase === "result" || phase === "spinning") resetGame()
      }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-purple-300/20 blur-3xl" />
      </div>

      {/* Instructions */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none"
            dir={direction}
          >
            <div className="bg-card border-2 border-border rounded-[32px] px-10 py-10 flex flex-col items-center shadow-xl max-w-xs w-full">
              <motion.span
                className="text-7xl mb-5"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                👆
              </motion.span>
              <h1 className="text-2xl font-black tracking-tight text-foreground mb-3">
                {t("game.fingerDice")}
              </h1>
              <p className="text-sm font-semibold text-muted-foreground leading-relaxed">
                {t("game.placeFinger")}
              </p>
              <div className="mt-4 flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary/40"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Place more fingers" hint */}
      <AnimatePresence>
        {phase === "idle" && fingerArray.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 left-0 right-0 text-center pointer-events-none"
            dir={direction}
          >
            <span className="text-sm font-bold text-muted-foreground">
              {t("game.placeFinger")}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ready pulse */}
      <AnimatePresence>
        {phase === "ready" && (
          <motion.div
            key="ready-ring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              className="w-32 h-32 rounded-full border-4 border-primary/30"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finger circles — positioned via style (left/top), NOT framer-motion x/y transforms,
          because dir="rtl" on the parent inverts translateX direction */}
      <AnimatePresence>
        {fingerArray.map((finger: FingerTouch) => {
          const color = FINGER_COLORS[finger.colorIndex]
          const isHighlighted = highlighted === finger.id
          const isLoser = phase === "result" && loserId === finger.id
          const isWinner = phase === "result" && loserId !== null && loserId !== finger.id
          const size = isLoser ? 130 : isWinner ? 90 : 110
          const playerName = getPlayerName(finger.playerIndex)

          return (
            <motion.div
              key={finger.id}
              className="absolute pointer-events-none"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: isWinner ? 0.35 : 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28, opacity: { duration: 0.2 } }}
              style={{
                left: finger.x - size / 2,
                top: finger.y - size / 2,
                width: size,
                height: size,
              }}
            >
              {/* Glow */}
              {(isHighlighted || isLoser) && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: color, filter: "blur(22px)", opacity: 0.55 }}
                  animate={{ scale: [1, 1.35, 1] }}
                  transition={{ duration: isHighlighted ? 0.25 : 0.8, repeat: Infinity }}
                />
              )}

              {/* Main circle */}
              <motion.div
                className="absolute inset-2 rounded-full flex items-center justify-center border-4 border-white/50 shadow-lg overflow-hidden"
                style={{ background: `radial-gradient(circle at 35% 30%, ${color}dd, ${color}99)` }}
                animate={isHighlighted ? { scale: [1, 1.06, 1] } : isLoser ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: isHighlighted ? 0.2 : 0.7, repeat: isHighlighted || isLoser ? Infinity : 0 }}
              >
                {/* Gloss */}
                <div
                  className="absolute top-2 left-2 w-1/3 h-1/3 rounded-full opacity-50"
                  style={{ background: "radial-gradient(circle, rgba(255,255,255,0.9), transparent)" }}
                />

                {/* Player name (idle/ready/spinning) */}
                {!isLoser && !isWinner && (
                  <span
                    className="text-white font-black text-xs text-center px-1 leading-tight"
                    style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)", maxWidth: "90%" }}
                  >
                    {playerName}
                  </span>
                )}

                {/* Spinning white dot */}
                {isHighlighted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute w-5 h-5 bg-white rounded-full shadow-lg"
                  />
                )}

                {/* Loser */}
                {isLoser && (
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <span className="text-3xl">💀</span>
                    <span
                      className="text-white font-black text-xs text-center leading-tight px-1"
                      style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
                    >
                      {playerName}
                    </span>
                  </motion.div>
                )}
              </motion.div>

              {/* Spinning outline ring */}
              {isHighlighted && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4"
                  style={{ borderColor: color }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                />
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Result banner */}
      <AnimatePresence>
        {phase === "result" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="absolute bottom-14 left-0 right-0 flex justify-center pointer-events-none"
            dir={direction}
          >
            <div className="bg-foreground text-background px-7 py-4 rounded-full shadow-2xl">
              <span className="font-black text-base">
                {t("game.tapToRestart")}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

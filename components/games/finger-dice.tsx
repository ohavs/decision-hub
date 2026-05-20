"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"

// Playful light color palette matching the mockup
const PLAYFUL_COLORS = [
  { bg: "#3b82f6", glow: "rgba(59, 130, 246, 0.25)" }, // Blue
  { bg: "#f97316", glow: "rgba(249, 115, 22, 0.25)" }, // Orange
  { bg: "#10b981", glow: "rgba(16, 185, 129, 0.25)" }, // Green
  { bg: "#ec4899", glow: "rgba(236, 72, 153, 0.25)" }, // Pink
  { bg: "#8b5cf6", glow: "rgba(139, 92, 246, 0.25)" }, // Purple
  { bg: "#eab308", glow: "rgba(234, 179, 8, 0.25)" }, // Yellow
  { bg: "#06b6d4", glow: "rgba(6, 182, 212, 0.25)" }, // Cyan
  { bg: "#f43f5e", glow: "rgba(244, 63, 94, 0.25)" }, // Rose
]

// Team colors for group mode
const TEAM_COLORS = [
  { bg: "#3b82f6", glow: "rgba(59, 130, 246, 0.3)" }, // Blue
  { bg: "#f97316", glow: "rgba(249, 115, 22, 0.3)" }, // Orange
  { bg: "#10b981", glow: "rgba(16, 185, 129, 0.3)" }, // Green
  { bg: "#ec4899", glow: "rgba(236, 72, 153, 0.3)" }, // Pink
]

type Touch = {
  id: number
  x: number
  y: number
  color: typeof PLAYFUL_COLORS[number]
  isWinner: boolean
  isLoser: boolean
  team?: number
}

type GameMode = "solo" | "teams"
type GameState = "idle" | "waiting" | "counting" | "selecting" | "result"

export function FingerDice() {
  const { t, direction } = useLanguage()
  const { soundEnabled, recordWin } = useStats()
  
  const [touches, setTouches] = useState<Map<number, Touch>>(new Map())
  const [gameState, setGameState] = useState<GameState>("idle")
  const [gameMode, setGameMode] = useState<GameMode>("solo")
  const [teamCount, setTeamCount] = useState(2)
  const [countdown, setCountdown] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const stationaryTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastPositionsRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const colorIndexRef = useRef(0)

  const getNextColor = useCallback(() => {
    const color = PLAYFUL_COLORS[colorIndexRef.current % PLAYFUL_COLORS.length]
    colorIndexRef.current++
    return color
  }, [])

  const resetGame = useCallback(() => {
    setTouches(new Map())
    setGameState("idle")
    setCountdown(0)
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    if (stationaryTimerRef.current) clearTimeout(stationaryTimerRef.current)
    lastPositionsRef.current.clear()
    colorIndexRef.current = 0
  }, [])

  const selectWinner = useCallback(() => {
    setGameState("selecting")
    playSound("ding", soundEnabled)
    
    setTouches(prev => {
      const touchArray = Array.from(prev.values())
      if (touchArray.length < 2) return prev
      
      const newMap = new Map(prev)
      
      if (gameMode === "solo") {
        const winnerIndex = Math.floor(Math.random() * touchArray.length)
        touchArray.forEach((touch, index) => {
          newMap.set(touch.id, {
            ...touch,
            isWinner: index === winnerIndex,
            isLoser: index !== winnerIndex,
          })
        })
        
        // Record win
        const participants = touchArray.map((_, i) => `${t("game.fingerDice")} ${i + 1}`)
        const winnerName = participants[winnerIndex]
        recordWin("fingerDice", winnerName, participants)
      } else {
        // Team division mode
        const shuffled = [...touchArray].sort(() => Math.random() - 0.5)
        shuffled.forEach((touch, index) => {
          const team = index % teamCount
          newMap.set(touch.id, {
            ...touch,
            team,
            color: TEAM_COLORS[team],
            isWinner: false,
            isLoser: false,
          })
        })
      }
      
      return newMap
    })
    
    setGameState("result")
  }, [gameMode, teamCount, soundEnabled, recordWin, t])

  const startCountdown = useCallback(() => {
    if (gameState !== "waiting") return
    
    setGameState("counting")
    setCountdown(2.5)
    
    let timeLeft = 2.5
    const tickInterval = 0.25
    
    countdownTimerRef.current = setInterval(() => {
      timeLeft -= tickInterval
      setCountdown(Math.max(0, timeLeft))
      
      if (timeLeft > 0) {
        playSound("tick", soundEnabled)
      }
      
      if (timeLeft <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
        selectWinner()
      }
    }, tickInterval * 1000)
  }, [gameState, selectWinner, soundEnabled])

  const checkStationary = useCallback(() => {
    const touchArray = Array.from(touches.values())
    if (touchArray.length < 2) {
      setGameState("idle")
      return
    }
    
    const lastPositions = lastPositionsRef.current
    let allStationary = true
    
    for (const touch of touchArray) {
      const lastPos = lastPositions.get(touch.id)
      if (!lastPos) {
        allStationary = false
        break
      }
      
      const distance = Math.sqrt(
        Math.pow(touch.x - lastPos.x, 2) + Math.pow(touch.y - lastPos.y, 2)
      )
      
      if (distance > 15) {
        allStationary = false
        break
      }
    }
    
    // Update last positions
    touchArray.forEach(touch => {
      lastPositions.set(touch.id, { x: touch.x, y: touch.y })
    })
    
    if (allStationary && gameState === "waiting") {
      startCountdown()
    }
  }, [touches, gameState, startCountdown])

  // --- ATTACH RAW TOUCH LISTENERS (to force passive: false) ---
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleTouchStartRaw = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (gameState === "result" || gameState === "selecting") {
        resetGame()
        return
      }

      setTouches(prev => {
        const newTouches = new Map(prev)
        let didChange = false
        
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i]
          if (!newTouches.has(touch.identifier)) {
            playSound("pop", soundEnabled)
            const color = getNextColor()
            newTouches.set(touch.identifier, {
              id: touch.identifier,
              x: touch.clientX,
              y: touch.clientY,
              color,
              isWinner: false,
              isLoser: false,
            })
            didChange = true
          }
        }
        return didChange ? newTouches : prev
      })
    }

    const handleTouchMoveRaw = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (gameState === "result" || gameState === "selecting") return

      setTouches(prev => {
        const newTouches = new Map(prev)
        let didChange = false
        
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i]
          const existing = newTouches.get(touch.identifier)
          if (existing) {
            newTouches.set(touch.identifier, {
              ...existing,
              x: touch.clientX,
              y: touch.clientY,
            })
            didChange = true
          }
        }
        
        // Reset countdown if fingers are moving significantly
        if (gameState === "counting" && didChange) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
          setCountdown(0)
          setGameState("waiting")
        }
        
        return didChange ? newTouches : prev
      })
    }

    const handleTouchEndRaw = (e: TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (gameState === "result" || gameState === "selecting") {
        resetGame()
        return
      }

      setTouches(prev => {
        const newTouches = new Map(prev)
        let didChange = false
        
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i]
          if (newTouches.has(touch.identifier)) {
            newTouches.delete(touch.identifier)
            lastPositionsRef.current.delete(touch.identifier)
            didChange = true
          }
        }
        return didChange ? newTouches : prev
      })
    }

    el.addEventListener("touchstart", handleTouchStartRaw, { passive: false })
    el.addEventListener("touchmove", handleTouchMoveRaw, { passive: false })
    el.addEventListener("touchend", handleTouchEndRaw, { passive: false })
    el.addEventListener("touchcancel", handleTouchEndRaw, { passive: false })

    return () => {
      el.removeEventListener("touchstart", handleTouchStartRaw)
      el.removeEventListener("touchmove", handleTouchMoveRaw)
      el.removeEventListener("touchend", handleTouchEndRaw)
      el.removeEventListener("touchcancel", handleTouchEndRaw)
    }
  }, [gameState, resetGame, getNextColor, soundEnabled])

  // --- SYSTEM LOGIC STATE MANAGEMENT ---
  useEffect(() => {
    const touchArray = Array.from(touches.values())
    
    if (touchArray.length >= 2 && gameState === "idle") {
      setGameState("waiting")
      
      // Initialize last positions
      touchArray.forEach(touch => {
        lastPositionsRef.current.set(touch.id, { x: touch.x, y: touch.y })
      })
      
      stationaryTimerRef.current = setTimeout(checkStationary, 500)
    } else if (touchArray.length < 2 && (gameState === "waiting" || gameState === "counting")) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      if (stationaryTimerRef.current) clearTimeout(stationaryTimerRef.current)
      setGameState("idle")
      setCountdown(0)
    } else if (gameState === "waiting") {
      if (stationaryTimerRef.current) clearTimeout(stationaryTimerRef.current)
      stationaryTimerRef.current = setTimeout(checkStationary, 500)
    }
    
    return () => {
      if (stationaryTimerRef.current) clearTimeout(stationaryTimerRef.current)
    }
  }, [touches, gameState, checkStationary])

  // --- DESKTOP MOUSE FALLBACK ---
  const [isMouseDown, setIsMouseDown] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (gameState === "result" || gameState === "selecting") {
      resetGame()
      return
    }
    
    if ((e.target as HTMLElement).closest("[data-interactive-element]")) {
      return
    }
    
    setIsMouseDown(true)
    const color = getNextColor()
    playSound("pop", soundEnabled)
    
    setTouches(prev => {
      const newMap = new Map(prev)
      newMap.set(999, {
        id: 999,
        x: e.clientX,
        y: e.clientY,
        color,
        isWinner: false,
        isLoser: false,
      })
      return newMap
    })
  }, [gameState, resetGame, getNextColor, soundEnabled])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMouseDown || gameState === "result" || gameState === "selecting") return
    
    setTouches(prev => {
      const existing = prev.get(999)
      if (!existing) return prev
      const newMap = new Map(prev)
      newMap.set(999, {
        ...existing,
        x: e.clientX,
        y: e.clientY,
      })
      return newMap
    })
  }, [isMouseDown, gameState])

  const handleMouseUp = useCallback(() => {
    if (!isMouseDown) return
    setIsMouseDown(false)
    
    if (gameState === "result" || gameState === "selecting") {
      resetGame()
      return
    }

    setTouches(prev => {
      const newMap = new Map(prev)
      newMap.delete(999)
      lastPositionsRef.current.delete(999)
      return newMap
    })
  }, [isMouseDown, gameState, resetGame])

  const touchArray = Array.from(touches.values())
  const hasEnoughTouches = touchArray.length >= 2
  const showInstructions = touchArray.length === 0 && gameState === "idle"

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-background overflow-hidden select-none"
      dir={direction}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Playful background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-orange-300/20 blur-3xl" />
      </div>
      
      {/* Instructions */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none"
          >
            <div className="max-w-md bg-card p-8 rounded-[32px] border-2 border-border shadow-[0_16px_40px_rgba(0,0,0,0.03)] flex flex-col items-center">
              <span className="text-6xl mb-6 animate-bounce">👆</span>
              <h1 className="text-3xl font-black tracking-tight text-foreground mb-4">
                {t("game.fingerDice")}
              </h1>
              <p className="text-base font-semibold text-muted-foreground mb-2">
                {t("game.placeFinger")}
              </p>
              <p className="text-xs font-bold text-muted-foreground/60">
                {t("game.holdToSelect")}
              </p>

              {/* Game Mode Selector with Mockup Dot Toggle design */}
              <div className="flex gap-4 mt-8" data-interactive-element>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setGameMode("solo")
                    resetGame()
                  }}
                  className={`flex items-center gap-3 px-5 py-3 rounded-full border-2 transition-all cursor-pointer ${
                    gameMode === "solo"
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    gameMode === "solo" ? "border-background" : "border-muted-foreground"
                  }`}>
                    {gameMode === "solo" && <span className="w-2 h-2 rounded-full bg-background" />}
                  </span>
                  <span className="font-bold text-xs">Solo</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setGameMode("teams")
                    resetGame()
                  }}
                  className={`flex items-center gap-3 px-5 py-3 rounded-full border-2 transition-all cursor-pointer ${
                    gameMode === "teams"
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    gameMode === "teams" ? "border-background" : "border-muted-foreground"
                  }`}>
                    {gameMode === "teams" && <span className="w-2 h-2 rounded-full bg-background" />}
                  </span>
                  <span className="font-bold text-xs">Teams</span>
                </button>
              </div>

              {/* Teams Count Selector */}
              {gameMode === "teams" && (
                <div className="flex items-center gap-3 mt-4" data-interactive-element>
                  <span className="text-xs font-bold text-muted-foreground">Teams:</span>
                  {[2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={(e) => {
                        e.stopPropagation()
                        setTeamCount(num)
                        resetGame()
                      }}
                      className={`w-8 h-8 rounded-full border-2 font-bold text-xs transition-all cursor-pointer ${
                        teamCount === num
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch circles */}
      <AnimatePresence>
        {touchArray.map((touch) => (
          <TouchCircle
            key={touch.id}
            touch={touch}
            gameState={gameState}
            countdown={countdown}
          />
        ))}
      </AnimatePresence>

      {/* Countdown overlay */}
      <AnimatePresence>
        {gameState === "counting" && hasEnoughTouches && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1, 1.3, 1], opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-8xl font-black text-foreground/20 tracking-tighter"
            >
              {Math.ceil(countdown)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Result restart instruction */}
      <AnimatePresence>
        {gameState === "result" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 left-0 right-0 text-center pointer-events-none"
          >
            <span className="inline-block bg-foreground text-background px-6 py-3 rounded-full font-bold text-sm shadow-md">
              {t("game.tapToRestart")}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting indicator */}
      <AnimatePresence>
        {gameState === "waiting" && hasEnoughTouches && (
          <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none">
            <motion.p
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm font-bold text-muted-foreground"
            >
              {t("game.holdStill")}
            </motion.p>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TouchCircle({ 
  touch, 
  gameState,
  countdown
}: { 
  touch: Touch
  gameState: GameState
  countdown: number
}) {
  const isActive = !touch.isLoser
  const isCounting = gameState === "counting"
  const isResult = gameState === "result"
  
  const baseSize = 110
  const winnerSize = 170
  const loserSize = 70
  
  let size = baseSize
  if (touch.isWinner) size = winnerSize
  if (touch.isLoser) size = loserSize

  const progress = isCounting ? (2.5 - countdown) / 2.5 : 0
  const circumference = 2 * Math.PI * 65 // radius of 65

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: touch.isLoser ? 0.25 : 1,
        x: touch.x - size / 2,
        y: touch.y - size / 2,
        width: size,
        height: size,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 350,
        damping: 24,
        opacity: { duration: 0.25 }
      }}
      className="absolute pointer-events-none"
      style={{ 
        willChange: "transform",
      }}
    >
      {/* Outer soft shadow/glow */}
      <motion.div
        animate={touch.isWinner ? {
          scale: [1, 1.25, 1],
          opacity: [0.5, 0.2, 0.5],
        } : isCounting && isActive ? {
          scale: [1, 1.08, 1],
        } : {}}
        transition={{ 
          duration: touch.isWinner ? 1.2 : 0.6, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-full"
        style={{
          background: touch.color.bg,
          filter: "blur(24px)",
          opacity: touch.isLoser ? 0.1 : 0.45,
        }}
      />
      
      {/* Main playful capsule sphere */}
      <motion.div
        animate={touch.isWinner ? {
          scale: [1, 1.04, 1],
        } : isCounting ? {
          scale: [1, 1.02, 1],
        } : {}}
        transition={{ 
          duration: 0.3, 
          repeat: isCounting || touch.isWinner ? Infinity : 0,
          ease: "easeInOut"
        }}
        className="absolute inset-2 rounded-full flex items-center justify-center border-4 border-white/60 shadow-[0_10px_25px_rgba(0,0,0,0.15)]"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${touch.color.bg}ee, ${touch.color.bg}aa)`,
        }}
      >
        {/* Soft gloss highlight */}
        <div 
          className="absolute top-2 left-2 w-1/3 h-1/3 rounded-full opacity-60"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.95), transparent)"
          }}
        />
        
        {/* Team number for team mode */}
        {isResult && touch.team !== undefined && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-4xl font-black text-white"
            style={{ 
              textShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
          >
            {touch.team + 1}
          </motion.span>
        )}
        
        {/* Winner crown/star effect */}
        {touch.isWinner && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="text-5xl"
            style={{
              filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.2))"
            }}
          >
            ⭐
          </motion.div>
        )}
      </motion.div>

      {/* Countdown progress ring */}
      {isCounting && isActive && (
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 150 150"
        >
          <circle
            cx="75"
            cy="75"
            r="65"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="5"
          />
          <motion.circle
            cx="75"
            cy="75"
            r="65"
            fill="none"
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{
              filter: `drop-shadow(0 0 6px ${touch.color.bg})`
            }}
          />
        </svg>
      )}
    </motion.div>
  )
}

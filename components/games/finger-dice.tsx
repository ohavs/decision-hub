"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"

// Neon color palette
const NEON_COLORS = [
  { bg: "#ff006e", glow: "0 0 30px #ff006e, 0 0 60px #ff006e, 0 0 90px #ff006e" },
  { bg: "#00f5ff", glow: "0 0 30px #00f5ff, 0 0 60px #00f5ff, 0 0 90px #00f5ff" },
  { bg: "#39ff14", glow: "0 0 30px #39ff14, 0 0 60px #39ff14, 0 0 90px #39ff14" },
  { bg: "#ff9500", glow: "0 0 30px #ff9500, 0 0 60px #ff9500, 0 0 90px #ff9500" },
  { bg: "#bf00ff", glow: "0 0 30px #bf00ff, 0 0 60px #bf00ff, 0 0 90px #bf00ff" },
  { bg: "#ffff00", glow: "0 0 30px #ffff00, 0 0 60px #ffff00, 0 0 90px #ffff00" },
  { bg: "#ff1493", glow: "0 0 30px #ff1493, 0 0 60px #ff1493, 0 0 90px #ff1493" },
  { bg: "#00ff88", glow: "0 0 30px #00ff88, 0 0 60px #00ff88, 0 0 90px #00ff88" },
  { bg: "#4169e1", glow: "0 0 30px #4169e1, 0 0 60px #4169e1, 0 0 90px #4169e1" },
  { bg: "#ff4500", glow: "0 0 30px #ff4500, 0 0 60px #ff4500, 0 0 90px #ff4500" },
]

// Team colors for group mode
const TEAM_COLORS = [
  { bg: "#ff006e", glow: "0 0 30px #ff006e, 0 0 60px #ff006e" },
  { bg: "#00f5ff", glow: "0 0 30px #00f5ff, 0 0 60px #00f5ff" },
  { bg: "#39ff14", glow: "0 0 30px #39ff14, 0 0 60px #39ff14" },
  { bg: "#ff9500", glow: "0 0 30px #ff9500, 0 0 60px #ff9500" },
]

type Touch = {
  id: number
  x: number
  y: number
  color: typeof NEON_COLORS[number]
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
  const [showModeMenu, setShowModeMenu] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const stationaryTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastPositionsRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const colorIndexRef = useRef(0)

  const getNextColor = useCallback(() => {
    const color = NEON_COLORS[colorIndexRef.current % NEON_COLORS.length]
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
      
      if (distance > 10) {
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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    
    if (gameState === "result" || gameState === "selecting") {
      resetGame()
      return
    }
    
    const newTouches = new Map(touches)
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const color = getNextColor()
      
      playSound("pop", soundEnabled)
      
      newTouches.set(touch.identifier, {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        color,
        isWinner: false,
        isLoser: false,
      })
    }
    
    setTouches(newTouches)
  }, [touches, gameState, resetGame, getNextColor, soundEnabled])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    
    if (gameState === "result" || gameState === "selecting") return
    
    const newTouches = new Map(touches)
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const existing = newTouches.get(touch.identifier)
      
      if (existing) {
        newTouches.set(touch.identifier, {
          ...existing,
          x: touch.clientX,
          y: touch.clientY,
        })
      }
    }
    
    setTouches(newTouches)
    
    // Reset countdown if fingers are moving
    if (gameState === "counting") {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      setCountdown(0)
      setGameState("waiting")
    }
  }, [touches, gameState])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    
    if (gameState === "result" || gameState === "selecting") {
      resetGame()
      return
    }
    
    const newTouches = new Map(touches)
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      newTouches.delete(touch.identifier)
      lastPositionsRef.current.delete(touch.identifier)
    }
    
    setTouches(newTouches)
  }, [touches, gameState, resetGame])

  // For desktop testing with mouse
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (gameState === "result" || gameState === "selecting") {
      resetGame()
      return
    }
    
    // Check if clicking on mode button
    if ((e.target as HTMLElement).closest('[data-mode-button]')) {
      return
    }
    
    const color = getNextColor()
    playSound("pop", soundEnabled)
    
    setTouches(prev => {
      const newMap = new Map(prev)
      newMap.set(Date.now(), {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
        color,
        isWinner: false,
        isLoser: false,
      })
      return newMap
    })
  }, [gameState, resetGame, getNextColor, soundEnabled])

  const touchArray = Array.from(touches.values())
  const hasEnoughTouches = touchArray.length >= 2
  const showInstructions = touchArray.length === 0 && gameState === "idle"

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-background overflow-hidden touch-none select-none"
      style={{ touchAction: "none" }}
      dir={direction}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={handleMouseDown}
    >
      {/* Background subtle gradient */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(100,100,100,0.1) 0%, transparent 70%)"
        }}
      />
      
      {/* Instructions */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.6, 0.8, 0.6] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-center px-8"
            >
              <h1 className="text-3xl font-bold text-foreground/80 mb-4">
                {t("game.fingerDice")}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t("game.placeFinger")}
              </p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                {t("game.holdToSelect")}
              </p>
            </motion.div>
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 0.25, 
                repeat: Infinity,
                ease: "easeOut"
              }}
              className="text-6xl font-bold text-foreground/40"
            >
              {Math.ceil(countdown)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result message for team mode */}
      <AnimatePresence>
        {gameState === "result" && gameMode === "teams" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-32 left-0 right-0 text-center pointer-events-none"
          >
            <p className="text-xl font-medium text-foreground/60">
              {t("game.tapToRestart")}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode toggle button */}
      <motion.button
        data-mode-button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={(e) => {
          e.stopPropagation()
          setShowModeMenu(!showModeMenu)
        }}
        className="absolute top-6 right-6 rtl:right-auto rtl:left-6 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm border border-border/50 text-sm text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors z-10"
      >
        {gameMode === "solo" ? "Solo" : `${teamCount} Teams`}
      </motion.button>

      {/* Mode menu */}
      <AnimatePresence>
        {showModeMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            data-mode-button
            className="absolute top-16 right-6 rtl:right-auto rtl:left-6 p-2 rounded-xl bg-card/90 backdrop-blur-sm border border-border/50 z-20"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                setGameMode("solo")
                setShowModeMenu(false)
                resetGame()
              }}
              className={`block w-full px-4 py-2 text-start text-sm rounded-lg transition-colors ${
                gameMode === "solo" 
                  ? "bg-primary/20 text-foreground" 
                  : "text-foreground/70 hover:bg-secondary"
              }`}
            >
              Solo Winner
            </button>
            {[2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={(e) => {
                  e.stopPropagation()
                  setGameMode("teams")
                  setTeamCount(num)
                  setShowModeMenu(false)
                  resetGame()
                }}
                className={`block w-full px-4 py-2 text-start text-sm rounded-lg transition-colors ${
                  gameMode === "teams" && teamCount === num
                    ? "bg-primary/20 text-foreground" 
                    : "text-foreground/70 hover:bg-secondary"
                }`}
              >
                {num} Teams
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting indicator */}
      <AnimatePresence>
        {gameState === "waiting" && hasEnoughTouches && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 left-0 right-0 text-center pointer-events-none"
          >
            <motion.p
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm text-muted-foreground"
            >
              {t("game.holdStill")}
            </motion.p>
          </motion.div>
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
  
  const baseSize = 100
  const winnerSize = 160
  const loserSize = 60
  
  let size = baseSize
  if (touch.isWinner) size = winnerSize
  if (touch.isLoser) size = loserSize

  // Progress for countdown ring
  const progress = isCounting ? (2.5 - countdown) / 2.5 : 0
  const circumference = 2 * Math.PI * 60 // radius of 60

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: touch.isLoser ? 0.3 : 1,
        x: touch.x - size / 2,
        y: touch.y - size / 2,
        width: size,
        height: size,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 25,
        opacity: { duration: 0.3 }
      }}
      className="absolute pointer-events-none"
      style={{ 
        willChange: "transform",
      }}
    >
      {/* Outer glow */}
      <motion.div
        animate={touch.isWinner ? {
          scale: [1, 1.3, 1],
          opacity: [0.8, 0.4, 0.8],
        } : isCounting && isActive ? {
          scale: [1, 1.1, 1],
        } : {}}
        transition={{ 
          duration: touch.isWinner ? 1 : 0.5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-full"
        style={{
          background: touch.color.bg,
          filter: "blur(20px)",
          opacity: touch.isLoser ? 0.2 : 0.6,
        }}
      />
      
      {/* Main circle */}
      <motion.div
        animate={touch.isWinner ? {
          scale: [1, 1.05, 1],
        } : isCounting ? {
          scale: [1, 1.02, 1],
        } : {}}
        transition={{ 
          duration: 0.3, 
          repeat: isCounting || touch.isWinner ? Infinity : 0,
          ease: "easeInOut"
        }}
        className="absolute inset-2 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${touch.color.bg}dd, ${touch.color.bg}88)`,
          boxShadow: touch.isLoser ? "none" : touch.color.glow,
        }}
      >
        {/* Inner highlight */}
        <div 
          className="absolute top-3 left-3 w-1/3 h-1/3 rounded-full opacity-50"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.8), transparent)"
          }}
        />
        
        {/* Team number for team mode */}
        {isResult && touch.team !== undefined && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold"
            style={{ 
              color: "rgba(0,0,0,0.7)",
              textShadow: "0 0 10px rgba(255,255,255,0.5)"
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
            className="text-3xl"
            style={{
              filter: "drop-shadow(0 0 10px rgba(255,255,255,0.8))"
            }}
          >
            ★
          </motion.div>
        )}
      </motion.div>

      {/* Countdown progress ring */}
      {isCounting && isActive && (
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 140 140"
        >
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="4"
          />
          <motion.circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke={touch.color.bg}
            strokeWidth="4"
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

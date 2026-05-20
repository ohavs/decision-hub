"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"

interface Straw {
  id: number
  isShort: boolean
  pulled: boolean
  pulledBy: string | null
}

export function DrawStraws() {
  const { t, language, direction } = useLanguage()
  const { soundEnabled, recordWin } = useStats()
  
  const [playerCount, setPlayerCount] = useState(4)
  const [straws, setStraws] = useState<Straw[]>([])
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [gameStarted, setGameStarted] = useState(false)
  const [loser, setLoser] = useState<number | null>(null)
  const [revealAll, setRevealAll] = useState(false)

  const startGame = useCallback(() => {
    // Create straws with one random short one
    const shortIndex = Math.floor(Math.random() * playerCount)
    const newStraws: Straw[] = Array.from({ length: playerCount }, (_, i) => ({
      id: i,
      isShort: i === shortIndex,
      pulled: false,
      pulledBy: null,
    }))
    
    // Shuffle straws
    for (let i = newStraws.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newStraws[i], newStraws[j]] = [newStraws[j], newStraws[i]]
    }
    
    setStraws(newStraws)
    setCurrentPlayer(1)
    setGameStarted(true)
    setLoser(null)
    setRevealAll(false)
    playSound("click", soundEnabled)
  }, [playerCount, soundEnabled])

  const pullStraw = useCallback((strawId: number) => {
    if (!gameStarted || loser !== null) return
    
    const straw = straws.find(s => s.id === strawId)
    if (!straw || straw.pulled) return
    
    playSound("whoosh", soundEnabled)
    
    const playerName = `${language === "he" ? "שחקן" : "Player"} ${currentPlayer}`
    
    setStraws(prev => prev.map(s => 
      s.id === strawId ? { ...s, pulled: true, pulledBy: playerName } : s
    ))
    
    if (straw.isShort) {
      // Found the short straw!
      setTimeout(() => {
        setLoser(currentPlayer)
        setRevealAll(true)
        playSound("lose", soundEnabled)
        
        // Record winner (everyone except the loser)
        const participants = Array.from({ length: playerCount }, (_, i) => 
          `${language === "he" ? "שחקן" : "Player"} ${i + 1}`
        )
        const winnerIndex = Math.floor(Math.random() * (playerCount - 1))
        const winners = participants.filter((_, i) => i + 1 !== currentPlayer)
        if (winners.length > 0) {
          recordWin("drawStraws", winners[winnerIndex], participants)
        }
      }, 500)
    } else {
      // Continue to next player
      if (currentPlayer < playerCount) {
        setCurrentPlayer(prev => prev + 1)
      }
    }
  }, [gameStarted, straws, currentPlayer, playerCount, loser, soundEnabled, language, recordWin])

  const resetGame = () => {
    setGameStarted(false)
    setStraws([])
    setCurrentPlayer(1)
    setLoser(null)
    setRevealAll(false)
    playSound("click", soundEnabled)
  }

  const availableStraws = straws.filter(s => !s.pulled)

  return (
    <div className="h-full flex flex-col p-6 pt-16" dir={direction}>
      {/* Setup phase */}
      {!gameStarted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {t("straws.players")}
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
            className="px-12 py-4 rounded-2xl bg-gradient-to-r from-lime-500 to-green-600 text-white font-semibold text-lg shadow-lg"
            style={{
              boxShadow: "0 10px 40px rgba(132, 204, 22, 0.4)",
            }}
          >
            {t("game.start")}
          </motion.button>
        </motion.div>
      )}

      {/* Game phase */}
      {gameStarted && !loser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col"
        >
          {/* Current player indicator */}
          <div className="text-center mb-8">
            <p className="text-muted-foreground text-sm mb-1">{t("straws.pull")}</p>
            <p className="text-2xl font-bold text-foreground">
              {language === "he" ? "שחקן" : "Player"} {currentPlayer}
            </p>
          </div>

          {/* Straws container - visual hand holding straws */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              {/* Hand visual */}
              <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-t-full"
                style={{
                  background: "linear-gradient(to top, #fbbf24, #d97706)",
                  boxShadow: "inset 0 -10px 20px rgba(0,0,0,0.2)",
                }}
              />
              
              {/* Straws */}
              <div className="relative flex items-end justify-center gap-4 mb-20">
                <AnimatePresence>
                  {availableStraws.map((straw, index) => (
                    <motion.button
                      key={straw.id}
                      initial={{ y: -100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -200, opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => pullStraw(straw.id)}
                      className="relative w-4 sm:w-5 rounded-full cursor-pointer hover:scale-105 transition-transform"
                      style={{
                        height: "180px",
                        background: "linear-gradient(to right, #fef3c7, #fcd34d, #fef3c7)",
                        boxShadow: "2px 0 4px rgba(0,0,0,0.1), -2px 0 4px rgba(0,0,0,0.1)",
                      }}
                      whileHover={{ y: -20 }}
                    >
                      {/* Straw top */}
                      <div 
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 sm:w-6 h-4 rounded-full"
                        style={{
                          background: "linear-gradient(to right, #fcd34d, #f59e0b, #fcd34d)",
                        }}
                      />
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Pulled straws */}
          {straws.filter(s => s.pulled && !s.isShort).length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground text-center mb-2">
                {language === "he" ? "קשים ארוכים" : "Long Straws"}
              </p>
              <div className="flex justify-center gap-2">
                {straws.filter(s => s.pulled && !s.isShort).map(straw => (
                  <div key={straw.id} className="text-center">
                    <div 
                      className="w-3 h-24 rounded-full mx-auto mb-1"
                      style={{
                        background: "linear-gradient(to right, #86efac, #22c55e, #86efac)",
                      }}
                    />
                    <p className="text-xs text-muted-foreground">{straw.pulledBy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Result phase */}
      {loser !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-center mb-8"
          >
            <p className="text-muted-foreground mb-2">{t("straws.short")}</p>
            <p className="text-4xl font-bold text-red-500 mb-4">
              {language === "he" ? "שחקן" : "Player"} {loser}
            </p>
            
            {/* Visual of short straw */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              className="w-6 h-16 rounded-full mx-auto"
              style={{
                background: "linear-gradient(to right, #fca5a5, #ef4444, #fca5a5)",
                boxShadow: "0 0 20px rgba(239, 68, 68, 0.5)",
              }}
            />
          </motion.div>
          
          {/* All straws revealed */}
          {revealAll && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center gap-4 mb-8"
            >
              {straws.map((straw) => (
                <div key={straw.id} className="text-center">
                  <div 
                    className={`w-4 rounded-full mx-auto mb-2 ${
                      straw.isShort ? "h-12" : "h-20"
                    }`}
                    style={{
                      background: straw.isShort
                        ? "linear-gradient(to right, #fca5a5, #ef4444, #fca5a5)"
                        : "linear-gradient(to right, #86efac, #22c55e, #86efac)",
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {straw.pulledBy || "-"}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
          
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
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

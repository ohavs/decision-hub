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
    <div className="h-full flex flex-col p-6 pt-20 bg-background select-none" dir={direction}>
      
      {/* Setup phase */}
      {!gameStarted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center"
        >
          {/* Decorative Blob */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full bg-lime-200/20 blur-3xl" />
          </div>

          <h2 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-6">
            {t("straws.players")}
          </h2>
          
          <div className="flex items-center justify-center gap-3 mb-10 relative z-10">
            {[2, 3, 4, 5, 6, 7, 8].map(count => (
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
      {gameStarted && !loser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col"
        >
          {/* Current player indicator */}
          <div className="text-center mb-6 relative z-10">
            <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-1">{t("straws.pull")}</p>
            <p className="text-2xl font-black text-foreground">
              {language === "he" ? "שחקן" : "Player"} {currentPlayer}
            </p>
          </div>

          {/* Straws cup container */}
          <div className="flex-1 flex flex-col items-center justify-end mb-10 relative z-10">
            <div className="relative">
              
              {/* Straws */}
              <div className="relative flex items-end justify-center gap-3 mb-10">
                <AnimatePresence>
                  {availableStraws.map((straw, index) => (
                    <motion.button
                      key={straw.id}
                      initial={{ y: -120, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -300, opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => pullStraw(straw.id)}
                      className="relative w-4 rounded-full cursor-pointer transition-all border border-black/10 origin-bottom"
                      style={{
                        height: "190px",
                        background: "linear-gradient(to right, #fef3c7, #fde68a, #fcd34d)",
                        boxShadow: "2px 4px 10px rgba(0,0,0,0.06)",
                      }}
                      whileHover={{ y: -25, scale: 1.05 }}
                    >
                      {/* Straw stripe element */}
                      <div className="absolute top-4 bottom-4 left-1.5 w-0.5 bg-primary/20 rounded-full" />
                      
                      {/* Straw top rim */}
                      <div 
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-3 rounded-full border border-black/10"
                        style={{
                          background: "linear-gradient(to right, #fcd34d, #f59e0b, #fcd34d)",
                        }}
                      />
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              {/* Hand held cup holder visual (modern style) */}
              <div 
                className="w-44 h-24 rounded-t-[28px] border-t-4 border-x-4 border-foreground bg-background"
                style={{
                  boxShadow: "inset 0 10px 20px rgba(0,0,0,0.02), 0 -8px 24px rgba(0,0,0,0.03)",
                }}
              />
            </div>
          </div>

          {/* Pulled long straws scoreboard */}
          {straws.filter(s => s.pulled && !s.isShort).length > 0 && (
            <div className="mb-4 bg-card border-2 border-border p-4 rounded-[32px] shadow-sm max-w-sm mx-auto w-full">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider text-center mb-3">
                {language === "he" ? "קשים ארוכים שנמשכו" : "Long Straws Pulled"}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {straws.filter(s => s.pulled && !s.isShort).map(straw => (
                  <div key={straw.id} className="text-center flex flex-col items-center">
                    <div 
                      className="w-2.5 h-16 rounded-full mb-1.5 border border-emerald-300"
                      style={{
                        background: "linear-gradient(to right, #86efac, #10b981, #059669)",
                      }}
                    />
                    <p className="text-[10px] font-black text-foreground">{straw.pulledBy?.split(" ")[1]}</p>
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
          className="flex-1 flex flex-col items-center justify-center p-6 pt-20"
        >
          {/* Decorative Blob */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
            <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-red-200/20 blur-3xl" />
          </div>

          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="text-center mb-8 relative z-10"
          >
            <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">{t("straws.short")}</p>
            <p className="text-4xl font-black text-red-500 mb-6">
              {language === "he" ? "שחקן" : "Player"} {loser}
            </p>
            
            {/* Visual short straw */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              className="w-5 h-16 rounded-full mx-auto border-2 border-red-500 shadow-[0_8px_24px_rgba(239,68,68,0.4)]"
              style={{
                background: "linear-gradient(to right, #fecaca, #f87171, #ef4444)",
              }}
            />
          </motion.div>
          
          {/* All straws reveal list */}
          {revealAll && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center gap-4 mb-10 bg-card border-2 border-border p-5 rounded-[32px] shadow-sm max-w-sm w-full"
            >
              {straws.map((straw) => (
                <div key={straw.id} className="text-center flex flex-col items-center">
                  <div 
                    className={`w-3.5 rounded-full mb-2 border ${
                      straw.isShort ? "h-10 border-red-400" : "h-20 border-emerald-400"
                    }`}
                    style={{
                      background: straw.isShort
                        ? "linear-gradient(to right, #fca5a5, #ef4444, #dc2626)"
                        : "linear-gradient(to right, #a7f3d0, #10b981, #059669)",
                    }}
                  />
                  <p className="text-[10px] font-black text-muted-foreground">
                    {straw.pulledBy ? straw.pulledBy.split(" ")[1] : "-"}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
          
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

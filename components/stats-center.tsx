"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats, type GameType } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"

interface StatsCenterProps {
  onBack: () => void
}

const GAME_NAMES: Record<string, Record<GameType, string>> = {
  he: {
    fingerDice: "קוביית אצבעות",
    diceRoller: "קוביות",
    coinFlip: "מטבע",
    randomPicker: "בוחר אקראי",
    colorRoulette: "רולטה",
    reactionTime: "תגובה מהירה",
    drawStraws: "שליפת קשים",
  },
  en: {
    fingerDice: "Finger Dice",
    diceRoller: "Dice Roller",
    coinFlip: "Coin Flip",
    randomPicker: "Random Picker",
    colorRoulette: "Color Roulette",
    reactionTime: "Reaction Time",
    drawStraws: "Draw Straws",
  },
}

export function StatsCenter({ onBack }: StatsCenterProps) {
  const { t, language, direction } = useLanguage()
  const { 
    getAllPlayers, 
    getMostPlayedGame, 
    getRecentGames, 
    updatePlayerName, 
    resetStats,
    soundEnabled 
  } = useStats()
  
  const [editMode, setEditMode] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const players = getAllPlayers()
  const mostPlayed = getMostPlayedGame()
  const recentGames = getRecentGames(10)

  const handleEditPlayer = (oldName: string) => {
    if (newName.trim() && newName.trim() !== oldName) {
      updatePlayerName(oldName, newName.trim())
      playSound("success", soundEnabled)
    }
    setEditingPlayer(null)
    setNewName("")
  }

  const handleReset = () => {
    resetStats()
    playSound("whoosh", soundEnabled)
    setShowResetConfirm(false)
  }

  const getWinRate = (wins: number, games: number) => {
    if (games === 0) return 0
    return Math.round((wins / games) * 100)
  }

  const getTotalWins = (winsRecord: Record<GameType, number>) => {
    return Object.values(winsRecord).reduce((sum, w) => sum + w, 0)
  }

  const getTotalGames = (gamesRecord: Record<GameType, number>) => {
    return Object.values(gamesRecord).reduce((sum, g) => sum + g, 0)
  }

  return (
    <div className="fixed inset-0 bg-background overflow-hidden flex flex-col px-6 pt-8 pb-6" dir={direction}>
      
      {/* Decorative Background Blob Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-[20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-purple-200/20 blur-3xl" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between mb-6"
      >
        <button
          onClick={() => {
            playSound("click", soundEnabled)
            onBack()
          }}
          className="p-3 rounded-full bg-card border-2 border-border text-foreground hover:bg-secondary/40 shadow-md transition-all cursor-pointer animate-in fade-in"
        >
          <svg 
            className={`w-5 h-5 text-foreground ${direction === "rtl" ? "rotate-180" : ""}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-2xl font-black tracking-tight text-foreground">{t("stats.title")}</h1>
        
        <button
          onClick={() => {
            playSound("click", soundEnabled)
            setEditMode(!editMode)
          }}
          className={`px-5 py-2.5 rounded-full text-xs font-black transition-all border-2 cursor-pointer shadow-sm ${
            editMode 
              ? "bg-foreground text-background border-foreground" 
              : "bg-card text-foreground border-border hover:bg-secondary/40"
          }`}
        >
          {t("stats.editMode")}
        </button>
      </motion.header>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto scrollbar-none pb-20 pr-1 pl-1">
        
        {/* Most Played Card */}
        {mostPlayed && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 rounded-[32px] bg-card border-2 border-border shadow-[0_12px_36px_rgba(0,0,0,0.02)] flex flex-col gap-3"
          >
            <h2 className="text-xs font-black uppercase text-muted-foreground tracking-wider">{t("stats.mostPlayed")}</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[20px] bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-3xl select-none">
                {mostPlayed.game === "fingerDice" && "👆"}
                {mostPlayed.game === "diceRoller" && "🎲"}
                {mostPlayed.game === "coinFlip" && "🪙"}
                {mostPlayed.game === "randomPicker" && "🎰"}
                {mostPlayed.game === "colorRoulette" && "🎨"}
                {mostPlayed.game === "reactionTime" && "⚡"}
                {mostPlayed.game === "drawStraws" && "🥢"}
              </div>
              <div>
                <p className="text-lg font-black text-foreground">
                  {GAME_NAMES[language][mostPlayed.game]}
                </p>
                <p className="text-xs font-bold text-muted-foreground mt-0.5">
                  {mostPlayed.count} {language === "he" ? "משחקים שוחקו" : "games played"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Players Scoreboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-lg font-black tracking-tight text-foreground mb-3">{t("stats.player")}</h2>
          
          {players.length === 0 ? (
            <div className="p-8 rounded-[32px] bg-card border-2 border-border shadow-[0_12px_36px_rgba(0,0,0,0.02)] text-center">
              <span className="text-3xl block mb-2 select-none">📊</span>
              <p className="text-sm font-bold text-muted-foreground">{t("stats.noData")}</p>
            </div>
          ) : (
            <div className="rounded-[32px] bg-card border-2 border-border shadow-[0_12px_36px_rgba(0,0,0,0.02)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border/80 bg-secondary/10">
                    <th className="px-5 py-4 text-start text-xs font-black text-muted-foreground uppercase tracking-wider">
                      {t("stats.player")}
                    </th>
                    <th className="px-5 py-4 text-center text-xs font-black text-muted-foreground uppercase tracking-wider">
                      {t("stats.wins")}
                    </th>
                    <th className="px-5 py-4 text-center text-xs font-black text-muted-foreground uppercase tracking-wider">
                      {t("stats.winRate")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {players.map((player, index) => {
                    const totalWins = getTotalWins(player.wins)
                    const totalGames = getTotalGames(player.gamesPlayed)
                    const winRate = getWinRate(totalWins, totalGames)
                    
                    return (
                      <motion.tr 
                        key={player.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <td className="px-5 py-4">
                          {editMode && editingPlayer === player.name ? (
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              onBlur={() => handleEditPlayer(player.name)}
                              onKeyDown={(e) => e.key === "Enter" && handleEditPlayer(player.name)}
                              autoFocus
                              className="w-full px-3 py-1.5 border-2 border-foreground bg-background rounded-full text-foreground text-xs font-bold focus:outline-none"
                            />
                          ) : (
                            <button
                              onClick={() => {
                                if (editMode) {
                                  setEditingPlayer(player.name)
                                  setNewName(player.name)
                                }
                              }}
                              className={`text-sm font-black text-foreground ${
                                editMode ? "cursor-pointer text-primary underline underline-offset-4 decoration-2" : "cursor-default"
                              }`}
                            >
                              {player.name}
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-black text-foreground">{totalWins}</span>
                          <span className="text-xs font-bold text-muted-foreground">/{totalGames}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                            winRate >= 50 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {winRate}%
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Recent Games Feed */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-lg font-black tracking-tight text-foreground mb-3">{t("stats.recentGames")}</h2>
          
          {recentGames.length === 0 ? (
            <div className="p-8 rounded-[32px] bg-card border-2 border-border shadow-[0_12px_36px_rgba(0,0,0,0.02)] text-center">
              <p className="text-sm font-bold text-muted-foreground">{t("stats.noData")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 rounded-[24px] bg-card border-2 border-border shadow-[0_12px_36px_rgba(0,0,0,0.015)] flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-[16px] bg-secondary/50 flex items-center justify-center text-2xl select-none">
                    {game.gameType === "fingerDice" && "👆"}
                    {game.gameType === "diceRoller" && "🎲"}
                    {game.gameType === "coinFlip" && "🪙"}
                    {game.gameType === "randomPicker" && "🎰"}
                    {game.gameType === "colorRoulette" && "🎨"}
                    {game.gameType === "reactionTime" && "⚡"}
                    {game.gameType === "drawStraws" && "🥢"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground truncate">
                      {game.winner}
                    </p>
                    <p className="text-xs font-bold text-muted-foreground mt-0.5">
                      {GAME_NAMES[language][game.gameType]}
                    </p>
                  </div>
                  <div className="text-[10px] font-black text-muted-foreground/60 uppercase">
                    {new Date(game.timestamp).toLocaleDateString(language === "he" ? "he-IL" : "en-US")}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Danger Zone / Reset Statistics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-4"
        >
          <AnimatePresence mode="wait">
            {showResetConfirm ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 rounded-[28px] border-2 border-destructive bg-destructive/5 text-center flex flex-col items-center gap-4"
              >
                <p className="text-sm font-black text-destructive">{t("stats.confirmReset")}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    className="px-5 py-2.5 rounded-full bg-destructive text-white text-xs font-black shadow-md cursor-pointer hover:bg-destructive/90 transition-colors"
                  >
                    {language === "he" ? "כן, למחוק הכל" : "Yes, Reset All"}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-5 py-2.5 rounded-full bg-card border-2 border-border text-foreground text-xs font-black shadow-sm cursor-pointer hover:bg-secondary/40 transition-colors"
                  >
                    {language === "he" ? "ביטול" : "Cancel"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="reset"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-4 rounded-full border-2 border-destructive/30 bg-destructive/5 text-destructive text-sm font-black hover:bg-destructive/10 transition-all cursor-pointer"
              >
                {t("stats.reset")}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

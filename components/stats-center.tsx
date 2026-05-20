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
    reactionTime: "תגובה",
    drawStraws: "קשים",
  },
  en: {
    fingerDice: "Finger Dice",
    diceRoller: "Dice Roller",
    coinFlip: "Coin Flip",
    randomPicker: "Random Picker",
    colorRoulette: "Color Roulette",
    reactionTime: "Reaction",
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
    <div className="fixed inset-0 bg-background overflow-hidden flex flex-col" dir={direction}>
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, transparent 70%)",
            top: "20%",
            right: "-20%",
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-6 pt-8 pb-4"
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              playSound("click", soundEnabled)
              onBack()
            }}
            className="p-2 -ml-2 rounded-full hover:bg-secondary/50 transition-colors"
          >
            <svg 
              className={`w-6 h-6 text-foreground ${direction === "rtl" ? "rotate-180" : ""}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-xl font-bold text-foreground">{t("stats.title")}</h1>
          
          <button
            onClick={() => {
              playSound("click", soundEnabled)
              setEditMode(!editMode)
            }}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              editMode 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary/50 text-foreground/70 hover:bg-secondary"
            }`}
          >
            {t("stats.editMode")}
          </button>
        </div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 px-4 pb-8 overflow-y-auto">
        {/* Most Played */}
        {mostPlayed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50"
          >
            <h2 className="text-sm text-muted-foreground mb-2">{t("stats.mostPlayed")}</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-2xl">
                  {mostPlayed.game === "fingerDice" && "👆"}
                  {mostPlayed.game === "diceRoller" && "🎲"}
                  {mostPlayed.game === "coinFlip" && "🪙"}
                  {mostPlayed.game === "randomPicker" && "🎰"}
                  {mostPlayed.game === "colorRoulette" && "🎨"}
                  {mostPlayed.game === "reactionTime" && "⚡"}
                  {mostPlayed.game === "drawStraws" && "🥢"}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {GAME_NAMES[language][mostPlayed.game]}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mostPlayed.count} {language === "he" ? "משחקים" : "games"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Players Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">{t("stats.player")}</h2>
          
          {players.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 text-center">
              <p className="text-muted-foreground">{t("stats.noData")}</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-4 py-3 text-start text-xs font-medium text-muted-foreground uppercase">
                      {t("stats.player")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                      {t("stats.wins")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                      {t("stats.winRate")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, index) => {
                    const totalWins = getTotalWins(player.wins)
                    const totalGames = getTotalGames(player.gamesPlayed)
                    const winRate = getWinRate(totalWins, totalGames)
                    
                    return (
                      <motion.tr 
                        key={player.name}
                        initial={{ opacity: 0, x: direction === "rtl" ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border/30 last:border-0"
                      >
                        <td className="px-4 py-3">
                          {editMode && editingPlayer === player.name ? (
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              onBlur={() => handleEditPlayer(player.name)}
                              onKeyDown={(e) => e.key === "Enter" && handleEditPlayer(player.name)}
                              autoFocus
                              className="w-full px-2 py-1 bg-secondary rounded text-foreground text-sm"
                            />
                          ) : (
                            <button
                              onClick={() => {
                                if (editMode) {
                                  setEditingPlayer(player.name)
                                  setNewName(player.name)
                                }
                              }}
                              className={`text-sm font-medium text-foreground ${
                                editMode ? "cursor-pointer hover:text-primary" : "cursor-default"
                              }`}
                            >
                              {player.name}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-foreground">{totalWins}</span>
                          <span className="text-xs text-muted-foreground">/{totalGames}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-semibold ${
                            winRate >= 50 ? "text-emerald-500" : "text-muted-foreground"
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

        {/* Recent Games */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">{t("stats.recentGames")}</h2>
          
          {recentGames.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 text-center">
              <p className="text-muted-foreground">{t("stats.noData")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: direction === "rtl" ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-3 rounded-xl bg-card/40 backdrop-blur border border-border/30 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center text-lg">
                    {game.gameType === "fingerDice" && "👆"}
                    {game.gameType === "diceRoller" && "🎲"}
                    {game.gameType === "coinFlip" && "🪙"}
                    {game.gameType === "randomPicker" && "🎰"}
                    {game.gameType === "colorRoulette" && "🎨"}
                    {game.gameType === "reactionTime" && "⚡"}
                    {game.gameType === "drawStraws" && "🥢"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {game.winner}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {GAME_NAMES[language][game.gameType]}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(game.timestamp).toLocaleDateString(language === "he" ? "he-IL" : "en-US")}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Reset Button */}
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
                className="flex items-center justify-center gap-3"
              >
                <span className="text-sm text-muted-foreground">{t("stats.confirmReset")}</span>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-medium"
                >
                  {language === "he" ? "כן, אפס" : "Yes, Reset"}
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm"
                >
                  {language === "he" ? "ביטול" : "Cancel"}
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="reset"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
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

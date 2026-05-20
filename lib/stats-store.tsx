"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export type GameType = 
  | "fingerDice" 
  | "diceRoller" 
  | "coinFlip" 
  | "randomPicker" 
  | "colorRoulette" 
  | "reactionTime" 
  | "drawStraws"

interface GameResult {
  id: string
  gameType: GameType
  winner: string
  participants: string[]
  timestamp: number
}

interface PlayerStats {
  name: string
  wins: Record<GameType, number>
  gamesPlayed: Record<GameType, number>
}

interface StatsState {
  players: Record<string, PlayerStats>
  gameHistory: GameResult[]
  gameCounts: Record<GameType, number>
}

interface StatsContextType {
  stats: StatsState
  recordWin: (gameType: GameType, winner: string, participants: string[]) => void
  getPlayerStats: (name: string) => PlayerStats | undefined
  getAllPlayers: () => PlayerStats[]
  getMostPlayedGame: () => { game: GameType; count: number } | null
  getRecentGames: (count?: number) => GameResult[]
  updatePlayerName: (oldName: string, newName: string) => void
  resetStats: () => void
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

const defaultStats: StatsState = {
  players: {},
  gameHistory: [],
  gameCounts: {
    fingerDice: 0,
    diceRoller: 0,
    coinFlip: 0,
    randomPicker: 0,
    colorRoulette: 0,
    reactionTime: 0,
    drawStraws: 0,
  },
}

const StatsContext = createContext<StatsContextType | undefined>(undefined)

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<StatsState>(defaultStats)
  const [soundEnabled, setSoundEnabledState] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("decision-hub-stats")
      if (saved) {
        const parsed = JSON.parse(saved)
        setStats(parsed)
      }
      
      const soundSetting = localStorage.getItem("decision-hub-sound")
      if (soundSetting !== null) {
        setSoundEnabledState(soundSetting === "true")
      }
    } catch (e) {
      console.error("Failed to load stats:", e)
    }
  }, [])

  // Save to localStorage when stats change
  useEffect(() => {
    try {
      localStorage.setItem("decision-hub-stats", JSON.stringify(stats))
    } catch (e) {
      console.error("Failed to save stats:", e)
    }
  }, [stats])

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled)
    localStorage.setItem("decision-hub-sound", String(enabled))
  }, [])

  const recordWin = useCallback((gameType: GameType, winner: string, participants: string[]) => {
    setStats(prev => {
      const newStats = { ...prev }
      
      // Update game counts
      newStats.gameCounts = {
        ...prev.gameCounts,
        [gameType]: (prev.gameCounts[gameType] || 0) + 1,
      }
      
      // Update player stats for all participants
      const newPlayers = { ...prev.players }
      
      participants.forEach(name => {
        const normalizedName = name.trim().toLowerCase()
        if (!normalizedName) return
        
        const existing = newPlayers[normalizedName] || {
          name: name.trim(),
          wins: {} as Record<GameType, number>,
          gamesPlayed: {} as Record<GameType, number>,
        }
        
        newPlayers[normalizedName] = {
          ...existing,
          name: name.trim(), // Keep original casing
          wins: {
            ...existing.wins,
            [gameType]: (existing.wins[gameType] || 0) + (name === winner ? 1 : 0),
          },
          gamesPlayed: {
            ...existing.gamesPlayed,
            [gameType]: (existing.gamesPlayed[gameType] || 0) + 1,
          },
        }
      })
      
      newStats.players = newPlayers
      
      // Add to history
      const result: GameResult = {
        id: Date.now().toString(),
        gameType,
        winner,
        participants,
        timestamp: Date.now(),
      }
      
      newStats.gameHistory = [result, ...prev.gameHistory].slice(0, 100) // Keep last 100
      
      return newStats
    })
  }, [])

  const getPlayerStats = useCallback((name: string): PlayerStats | undefined => {
    return stats.players[name.trim().toLowerCase()]
  }, [stats.players])

  const getAllPlayers = useCallback((): PlayerStats[] => {
    return Object.values(stats.players).sort((a, b) => {
      const aTotal = Object.values(a.wins).reduce((sum, w) => sum + w, 0)
      const bTotal = Object.values(b.wins).reduce((sum, w) => sum + w, 0)
      return bTotal - aTotal
    })
  }, [stats.players])

  const getMostPlayedGame = useCallback((): { game: GameType; count: number } | null => {
    const entries = Object.entries(stats.gameCounts) as [GameType, number][]
    if (entries.length === 0) return null
    
    const sorted = entries.sort((a, b) => b[1] - a[1])
    if (sorted[0][1] === 0) return null
    
    return { game: sorted[0][0], count: sorted[0][1] }
  }, [stats.gameCounts])

  const getRecentGames = useCallback((count = 10): GameResult[] => {
    return stats.gameHistory.slice(0, count)
  }, [stats.gameHistory])

  const updatePlayerName = useCallback((oldName: string, newName: string) => {
    setStats(prev => {
      const oldKey = oldName.trim().toLowerCase()
      const newKey = newName.trim().toLowerCase()
      
      if (!prev.players[oldKey] || oldKey === newKey) return prev
      
      const newPlayers = { ...prev.players }
      const playerData = newPlayers[oldKey]
      
      delete newPlayers[oldKey]
      newPlayers[newKey] = {
        ...playerData,
        name: newName.trim(),
      }
      
      // Update history
      const newHistory = prev.gameHistory.map(game => ({
        ...game,
        winner: game.winner.toLowerCase() === oldKey ? newName.trim() : game.winner,
        participants: game.participants.map(p => 
          p.toLowerCase() === oldKey ? newName.trim() : p
        ),
      }))
      
      return {
        ...prev,
        players: newPlayers,
        gameHistory: newHistory,
      }
    })
  }, [])

  const resetStats = useCallback(() => {
    setStats(defaultStats)
    localStorage.removeItem("decision-hub-stats")
  }, [])

  return (
    <StatsContext.Provider
      value={{
        stats,
        recordWin,
        getPlayerStats,
        getAllPlayers,
        getMostPlayedGame,
        getRecentGames,
        updatePlayerName,
        resetStats,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
    </StatsContext.Provider>
  )
}

export function useStats() {
  const context = useContext(StatsContext)
  if (!context) {
    throw new Error("useStats must be used within a StatsProvider")
  }
  return context
}

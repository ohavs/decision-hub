"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LanguageProvider } from "@/lib/language-context"
import { StatsProvider, type GameType } from "@/lib/stats-store"
import { Dashboard } from "./dashboard"
import { StatsCenter } from "./stats-center"
import { PlayersSetup } from "./players-setup"
import { GameWrapper } from "./game-wrapper"
import { FingerDice } from "./games/finger-dice"
import { DiceRoller } from "./games/dice-roller"
import { CoinFlip } from "./games/coin-flip"
import { RandomPicker } from "./games/random-picker"
import { ColorRoulette } from "./games/color-roulette"
import { ReactionTime } from "./games/reaction-time"
import { DrawStraws } from "./games/draw-straws"

type Screen = "dashboard" | "stats" | "players" | GameType

const GAME_TITLES: Record<GameType, { he: string; en: string }> = {
  fingerDice: { he: "קוביית אצבעות", en: "Finger Dice" },
  diceRoller: { he: "קוביות תלת-מימד", en: "3D Dice Roller" },
  coinFlip: { he: "הטלת מטבע", en: "Coin Flip" },
  randomPicker: { he: "בוחר אקראי", en: "Random Picker" },
  colorRoulette: { he: "רולטת צבעים", en: "Color Roulette" },
  reactionTime: { he: "תגובה מהירה", en: "Reaction Time" },
  drawStraws: { he: "שליפת קשים", en: "Draw Straws" },
}

function DecisionHubContent() {
  const [screen, setScreen] = useState<Screen>("dashboard")

  const renderGame = (gameType: GameType) => {
    switch (gameType) {
      case "fingerDice":
        return <FingerDice />
      case "diceRoller":
        return <DiceRoller />
      case "coinFlip":
        return <CoinFlip />
      case "randomPicker":
        return <RandomPicker />
      case "colorRoulette":
        return <ColorRoulette />
      case "reactionTime":
        return <ReactionTime />
      case "drawStraws":
        return <DrawStraws />
      default:
        return null
    }
  }

  const isGame = screen !== "dashboard" && screen !== "stats" && screen !== "players"

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Dashboard
              onSelectGame={(game) => setScreen(game)}
              onOpenStats={() => setScreen("stats")}
              onOpenPlayers={() => setScreen("players")}
            />
          </motion.div>
        )}

        {screen === "stats" && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <StatsCenter onBack={() => setScreen("dashboard")} />
          </motion.div>
        )}

        {screen === "players" && (
          <motion.div
            key="players"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <PlayersSetup onBack={() => setScreen("dashboard")} />
          </motion.div>
        )}

        {isGame && (
          <motion.div
            key={screen}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <GameWrapper
              onBack={() => setScreen("dashboard")}
              title={GAME_TITLES[screen as GameType]?.en || ""}
              showBackButton={screen !== "fingerDice"}
            >
              {renderGame(screen as GameType)}
            </GameWrapper>
            
            {/* Back button for Finger Dice (needs special positioning) */}
            {screen === "fingerDice" && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setScreen("dashboard")}
                className="fixed top-4 left-4 z-50 p-3 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 text-foreground/70 hover:text-foreground hover:bg-card transition-all"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DecisionHub() {
  return (
    <LanguageProvider>
      <StatsProvider>
        <DecisionHubContent />
      </StatsProvider>
    </LanguageProvider>
  )
}

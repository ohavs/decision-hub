"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Language = "he" | "en"
type Direction = "rtl" | "ltr"

interface LanguageContextType {
  language: Language
  direction: Direction
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<Language, Record<string, string>> = {
  he: {
    // App
    "app.title": "מרכז ההחלטות",
    "app.subtitle": "בחרו משחק והתחילו!",
    
    // Menu
    "menu.play": "שחק",
    "menu.stats": "סטטיסטיקות",
    "menu.settings": "הגדרות",
    
    // Games
    "game.fingerDice": "קוביית אצבעות",
    "game.fingerDice.desc": "הניחו אצבעות ותנו לגורל להחליט",
    "game.diceRoller": "קוביות תלת-מימד",
    "game.diceRoller.desc": "הטילו קוביות אמיתיות",
    "game.coinFlip": "הטלת מטבע",
    "game.coinFlip.desc": "עץ או פלי?",
    "game.randomPicker": "בוחר אקראי",
    "game.randomPicker.desc": "בחרו שם או מספר אקראי",
    "game.colorRoulette": "רולטת צבעים",
    "game.colorRoulette.desc": "בחרו צבע וצפו בכדור",
    "game.reactionTime": "תגובה מהירה",
    "game.reactionTime.desc": "מי הכי מהיר?",
    "game.drawStraws": "שליפת קשים",
    "game.drawStraws.desc": "מי ישלוף את הקש הקצר?",
    
    // Game UI
    "game.back": "חזרה",
    "game.reset": "איפוס",
    "game.start": "התחל",
    "game.winner": "מנצח!",
    "game.loser": "הפסדת",
    "game.tapToRestart": "לחצו להתחלה מחדש",
    "game.holdStill": "החזיקו יציב...",
    "game.placeFinger": "הניחו 2+ אצבעות על המסך",
    "game.holdToSelect": "החזיקו יציב לבחירת מנצח",
    
    // Dice Roller
    "dice.roll": "הטל",
    "dice.rolling": "מתגלגל...",
    "dice.count": "מספר קוביות",
    
    // Coin Flip
    "coin.flip": "הטל מטבע",
    "coin.heads": "עץ",
    "coin.tails": "פלי",
    "coin.flipping": "מתהפך...",
    
    // Random Picker
    "picker.addName": "הוסף שם",
    "picker.enterName": "הכנס שם...",
    "picker.orRange": "או בחר טווח מספרים",
    "picker.min": "מינימום",
    "picker.max": "מקסימום",
    "picker.pick": "בחר!",
    "picker.picking": "בוחר...",
    
    // Color Roulette
    "roulette.addPlayer": "הוסף שחקן",
    "roulette.spin": "סובב!",
    "roulette.spinning": "מסתובב...",
    
    // Reaction Time
    "reaction.wait": "המתינו לירוק...",
    "reaction.go": "עכשיו!",
    "reaction.tooEarly": "מוקדם מדי!",
    "reaction.time": "זמן תגובה",
    "reaction.ms": "מ״ש",
    "reaction.playerZone": "אזור שחקן",
    "reaction.ready": "מוכנים?",
    
    // Draw Straws
    "straws.pull": "משוך קש",
    "straws.short": "קש קצר!",
    "straws.long": "קש ארוך",
    "straws.players": "שחקנים",
    
    // Stats
    "stats.title": "מרכז סטטיסטיקות",
    "stats.player": "שחקן",
    "stats.game": "משחק",
    "stats.wins": "ניצחונות",
    "stats.winRate": "אחוז ניצחון",
    "stats.mostPlayed": "הכי שיחקו",
    "stats.recentGames": "משחקים אחרונים",
    "stats.noData": "אין נתונים עדיין",
    "stats.editMode": "מצב עריכה",
    "stats.reset": "איפוס סטטיסטיקות",
    "stats.confirmReset": "האם אתה בטוח?",
    
    // Settings
    "settings.language": "שפה",
    "settings.sound": "צלילים",
    "settings.on": "פועל",
    "settings.off": "כבוי",
  },
  en: {
    // App
    "app.title": "Decision Hub",
    "app.subtitle": "Pick a game and start!",
    
    // Menu
    "menu.play": "Play",
    "menu.stats": "Stats",
    "menu.settings": "Settings",
    
    // Games
    "game.fingerDice": "Finger Dice",
    "game.fingerDice.desc": "Place fingers and let fate decide",
    "game.diceRoller": "3D Dice Roller",
    "game.diceRoller.desc": "Roll realistic dice",
    "game.coinFlip": "Coin Flip",
    "game.coinFlip.desc": "Heads or tails?",
    "game.randomPicker": "Random Picker",
    "game.randomPicker.desc": "Pick a random name or number",
    "game.colorRoulette": "Color Roulette",
    "game.colorRoulette.desc": "Pick a color and watch the orb",
    "game.reactionTime": "Reaction Time",
    "game.reactionTime.desc": "Who's the fastest?",
    "game.drawStraws": "Draw Straws",
    "game.drawStraws.desc": "Who will draw the short straw?",
    
    // Game UI
    "game.back": "Back",
    "game.reset": "Reset",
    "game.start": "Start",
    "game.winner": "Winner!",
    "game.loser": "You Lost",
    "game.tapToRestart": "Tap to restart",
    "game.holdStill": "Hold still...",
    "game.placeFinger": "Place 2+ fingers on the screen",
    "game.holdToSelect": "Hold still to select a winner",
    
    // Dice Roller
    "dice.roll": "Roll",
    "dice.rolling": "Rolling...",
    "dice.count": "Dice count",
    
    // Coin Flip
    "coin.flip": "Flip Coin",
    "coin.heads": "Heads",
    "coin.tails": "Tails",
    "coin.flipping": "Flipping...",
    
    // Random Picker
    "picker.addName": "Add Name",
    "picker.enterName": "Enter name...",
    "picker.orRange": "Or select number range",
    "picker.min": "Minimum",
    "picker.max": "Maximum",
    "picker.pick": "Pick!",
    "picker.picking": "Picking...",
    
    // Color Roulette
    "roulette.addPlayer": "Add Player",
    "roulette.spin": "Spin!",
    "roulette.spinning": "Spinning...",
    
    // Reaction Time
    "reaction.wait": "Wait for green...",
    "reaction.go": "GO!",
    "reaction.tooEarly": "Too early!",
    "reaction.time": "Reaction time",
    "reaction.ms": "ms",
    "reaction.playerZone": "Player Zone",
    "reaction.ready": "Ready?",
    
    // Draw Straws
    "straws.pull": "Pull Straw",
    "straws.short": "Short Straw!",
    "straws.long": "Long Straw",
    "straws.players": "Players",
    
    // Stats
    "stats.title": "Statistics Center",
    "stats.player": "Player",
    "stats.game": "Game",
    "stats.wins": "Wins",
    "stats.winRate": "Win Rate",
    "stats.mostPlayed": "Most Played",
    "stats.recentGames": "Recent Games",
    "stats.noData": "No data yet",
    "stats.editMode": "Edit Mode",
    "stats.reset": "Reset Stats",
    "stats.confirmReset": "Are you sure?",
    
    // Settings
    "settings.language": "Language",
    "settings.sound": "Sound",
    "settings.on": "On",
    "settings.off": "Off",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("he")

  useEffect(() => {
    const saved = localStorage.getItem("decision-hub-language") as Language | null
    if (saved && (saved === "he" || saved === "en")) {
      setLanguageState(saved)
    }
  }, [])

  useEffect(() => {
    document.documentElement.dir = language === "he" ? "rtl" : "ltr"
    document.documentElement.lang = language
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("decision-hub-language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  const direction: Direction = language === "he" ? "rtl" : "ltr"

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

"use client"

import { useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"
import type { GameType } from "@/lib/stats-store"

const GAMES = [
  {
    id: "fingerDice" as GameType,
    icon: "👆",
    nameHe: "שוואזי",
    nameEn: "Swazi",
    descHe: "הניחו אצבעות ותנו לגורל להחליט",
    descEn: "Place fingers, let fate choose",
    playersHe: "2–10 שחקנים",
    playersEn: "2–10 Players",
    gradient: "linear-gradient(150deg, #1d4ed8 0%, #6d28d9 100%)",
    glowRgb: "99, 60, 210",
    badgeHe: "פופולרי",
    badgeEn: "Popular",
    category: "group" as const,
  },
  {
    id: "diceRoller" as GameType,
    icon: "🎲",
    nameHe: "קוביות",
    nameEn: "Dice Roller",
    descHe: "הטל קוביות תלת-מימד",
    descEn: "Roll realistic 3D dice",
    playersHe: "1+ שחקנים",
    playersEn: "1+ Players",
    gradient: "linear-gradient(150deg, #065f46 0%, #0e7490 100%)",
    glowRgb: "5, 150, 105",
    badgeHe: null,
    badgeEn: null,
    category: "group" as const,
  },
  {
    id: "coinFlip" as GameType,
    icon: "🪙",
    nameHe: "הטלת מטבע",
    nameEn: "Coin Flip",
    descHe: "עץ או פלי?",
    descEn: "Heads or tails?",
    playersHe: "1–2 שחקנים",
    playersEn: "1–2 Players",
    gradient: "linear-gradient(150deg, #92400e 0%, #b91c1c 100%)",
    glowRgb: "217, 119, 6",
    badgeHe: null,
    badgeEn: null,
    category: "solo" as const,
  },
  {
    id: "randomPicker" as GameType,
    icon: "🎰",
    nameHe: "בוחר אקראי",
    nameEn: "Random Picker",
    descHe: "שם אקראי או טווח מספרים",
    descEn: "Pick a name or number",
    playersHe: "1+ שחקנים",
    playersEn: "1+ Players",
    gradient: "linear-gradient(150deg, #9f1239 0%, #be185d 100%)",
    glowRgb: "225, 29, 72",
    badgeHe: "מהיר",
    badgeEn: "Quick",
    category: "solo" as const,
  },
  {
    id: "colorRoulette" as GameType,
    icon: "🎨",
    nameHe: "רולטת צבעים",
    nameEn: "Color Roulette",
    descHe: "סובב וגלה מי מנצח",
    descEn: "Spin and find the winner",
    playersHe: "2+ שחקנים",
    playersEn: "2+ Players",
    gradient: "linear-gradient(150deg, #5b21b6 0%, #a21caf 100%)",
    glowRgb: "139, 92, 246",
    badgeHe: null,
    badgeEn: null,
    category: "group" as const,
  },
  {
    id: "reactionTime" as GameType,
    icon: "⚡",
    nameHe: "מהירות תגובה",
    nameEn: "Reaction Time",
    descHe: "מי הכי מהיר?",
    descEn: "Who's the fastest?",
    playersHe: "2 שחקנים",
    playersEn: "2 Players",
    gradient: "linear-gradient(150deg, #78350f 0%, #b45309 100%)",
    glowRgb: "245, 158, 11",
    badgeHe: null,
    badgeEn: null,
    category: "solo" as const,
  },
  {
    id: "drawStraws" as GameType,
    icon: "🥢",
    nameHe: "שליפת קשים",
    nameEn: "Draw Straws",
    descHe: "מי ישלוף את הקש הקצר?",
    descEn: "Who gets the short straw?",
    playersHe: "2–8 שחקנים",
    playersEn: "2–8 Players",
    gradient: "linear-gradient(150deg, #1e293b 0%, #334155 100%)",
    glowRgb: "100, 116, 139",
    badgeHe: null,
    badgeEn: null,
    category: "group" as const,
  },
]

interface DashboardProps {
  onSelectGame: (game: GameType) => void
  onOpenStats: () => void
  onOpenPlayers: () => void
}

export function Dashboard({ onSelectGame, onOpenStats, onOpenPlayers }: DashboardProps) {
  const { language, setLanguage, direction } = useLanguage()
  const { soundEnabled, setSoundEnabled } = useStats()

  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = useCallback(() => {
    const el = carouselRef.current
    if (!el) return
    // card = 78vw, gap = 16px
    const cardStep = el.clientWidth * 0.78 + 16
    const idx = Math.round(el.scrollLeft / cardStep)
    setActiveIndex(Math.max(0, Math.min(GAMES.length - 1, idx)))
  }, [])

  const scrollTo = useCallback((idx: number) => {
    const el = carouselRef.current
    if (!el) return
    const cardStep = el.clientWidth * 0.78 + 16
    el.scrollTo({ left: idx * cardStep, behavior: "smooth" })
    setActiveIndex(idx)
  }, [])

  const activeGame = GAMES[activeIndex]

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col" style={{ background: "#080810" }} dir={direction}>

      {/* Dynamic ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ background: `radial-gradient(ellipse 90% 55% at 50% 20%, rgba(${activeGame.glowRgb}, 0.18) 0%, transparent 70%)` }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      />

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-10 pb-2 flex-shrink-0">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight leading-none">
            {language === "he" ? "מרכז ההחלטות" : "Decision Hub"}
          </h1>
          <p className="text-[11px] font-bold mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
            {language === "he" ? "בחרו משחק והתחילו" : "Choose a game and play"}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => window.location.reload()}
            className="p-2.5 rounded-full cursor-pointer transition-all"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => { setSoundEnabled(!soundEnabled); playSound("click", true) }}
            className="p-2.5 rounded-full cursor-pointer transition-all"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            {soundEnabled ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
          <button
            onClick={() => { playSound("click", soundEnabled); setLanguage(language === "he" ? "en" : "he") }}
            className="px-3 py-2 rounded-full text-xs font-black cursor-pointer transition-all"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            {language === "he" ? "EN" : "עב"}
          </button>
        </div>
      </header>

      {/* ── Carousel ── */}
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 flex py-4"
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          paddingInlineStart: "11vw",
          paddingInlineEnd: "11vw",
          gap: "16px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        } as React.CSSProperties}
      >
        {GAMES.map((game, index) => {
          const isActive = index === activeIndex
          const name = language === "he" ? game.nameHe : game.nameEn
          const desc = language === "he" ? game.descHe : game.descEn
          const players = language === "he" ? game.playersHe : game.playersEn
          const badge = language === "he" ? game.badgeHe : game.badgeEn
          const catLabel = game.category === "group"
            ? (language === "he" ? "קבוצתי" : "Group")
            : (language === "he" ? "אישי" : "Solo")

          return (
            <motion.div
              key={game.id}
              animate={{
                scale: isActive ? 1 : 0.90,
                opacity: isActive ? 1 : 0.45,
                y: isActive ? 0 : 10,
              }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              whileTap={{ scale: isActive ? 0.97 : 0.90 }}
              onClick={() => {
                if (!isActive) { scrollTo(index); return }
                playSound("success", soundEnabled)
                onSelectGame(game.id)
              }}
              className="flex-shrink-0 flex flex-col relative overflow-hidden rounded-[32px] cursor-pointer"
              style={{
                width: "78vw",
                scrollSnapAlign: "center",
                background: game.gradient,
              }}
            >
              {/* Dot texture overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1.5px, transparent 1.5px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Top soft light blob */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute pointer-events-none"
                  style={{
                    top: "-10%", left: "15%",
                    width: "70%", height: "50%",
                    background: "rgba(255,255,255,0.10)",
                    borderRadius: "50%",
                    filter: "blur(48px)",
                  }}
                />
              )}

              {/* Card content */}
              <div className="flex-1 flex flex-col items-center justify-between px-8 pt-10 pb-7 relative z-10">

                {/* Emoji */}
                <div className="flex-1 flex items-center justify-center w-full">
                  <motion.span
                    className="select-none block leading-none"
                    style={{ fontSize: "clamp(70px, 18vw, 96px)" }}
                    animate={isActive ? { y: [0, -7, 0] } : { y: 0 }}
                    transition={isActive
                      ? { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.3 }}
                  >
                    {game.icon}
                  </motion.span>
                </div>

                {/* Text block */}
                <div className="w-full">
                  <h2
                    className="text-white font-black text-center leading-tight mb-2"
                    style={{ fontSize: "clamp(22px, 5.5vw, 30px)", letterSpacing: "-0.02em" }}
                  >
                    {name}
                  </h2>
                  <p
                    className="text-center font-semibold mb-5"
                    style={{ color: "rgba(255,255,255,0.58)", fontSize: "13px" }}
                  >
                    {desc}
                  </p>

                  {/* Chips */}
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span
                      className="px-3 py-1.5 rounded-full text-white font-bold"
                      style={{ background: "rgba(255,255,255,0.18)", fontSize: "11px" }}
                    >
                      {players}
                    </span>
                    <span
                      className="px-3 py-1.5 rounded-full font-bold"
                      style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.65)", fontSize: "11px" }}
                    >
                      {catLabel}
                    </span>
                    {badge && (
                      <span
                        className="px-3 py-1.5 rounded-full font-black text-white"
                        style={{ background: "rgba(255,255,255,0.25)", fontSize: "11px" }}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* "Tap to play" hint on active card */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center pb-5 relative z-10"
                >
                  <span
                    className="font-bold tracking-wide"
                    style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}
                  >
                    {language === "he" ? "לחץ להתחיל ›" : "tap to play ›"}
                  </span>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* ── Dot indicators ── */}
      <div className="flex justify-center items-center gap-2 py-2 flex-shrink-0 relative z-10">
        {GAMES.map((g, i) => (
          <motion.button
            key={i}
            onClick={() => scrollTo(i)}
            animate={{
              width: i === activeIndex ? 22 : 6,
              opacity: i === activeIndex ? 1 : 0.28,
              backgroundColor: i === activeIndex ? `rgb(${g.glowRgb})` : "#ffffff",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-[6px] rounded-full cursor-pointer"
          />
        ))}
      </div>

      {/* ── Footer — Players + Stats ── */}
      <div className="flex items-center gap-3 px-6 pb-8 pt-2 flex-shrink-0 relative z-10">
        <button
          onClick={() => { playSound("click", soundEnabled); onOpenPlayers() }}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full cursor-pointer transition-all font-bold text-sm"
          style={{ background: "rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {language === "he" ? "שחקנים" : "Players"}
        </button>

        <button
          onClick={() => { playSound("click", soundEnabled); onOpenStats() }}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full cursor-pointer transition-all font-bold text-sm"
          style={{ background: "rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {language === "he" ? "סטטיסטיקות" : "Stats"}
        </button>
      </div>
    </div>
  )
}

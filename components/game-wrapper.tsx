"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { useStats } from "@/lib/stats-store"
import { playSound } from "@/lib/sounds"
import type { ReactNode } from "react"

interface GameWrapperProps {
  children: ReactNode
  onBack: () => void
  title: string
  showBackButton?: boolean
}

export function GameWrapper({ children, onBack, title, showBackButton = true }: GameWrapperProps) {
  const { t, direction } = useLanguage()
  const { soundEnabled } = useStats()

  return (
    <div className="fixed inset-0 bg-background overflow-hidden" dir={direction}>
      {/* Back button overlay */}
      {showBackButton && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => {
            playSound("click", soundEnabled)
            onBack()
          }}
          className="absolute top-4 left-4 rtl:left-auto rtl:right-4 z-50 p-3 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 text-foreground/70 hover:text-foreground hover:bg-card transition-all"
        >
          <svg 
            className={`w-5 h-5 ${direction === "rtl" ? "rotate-180" : ""}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
      )}
      
      {/* Game content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  )
}

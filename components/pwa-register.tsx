"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        const basePath = process.env.NODE_ENV === "production" ? "/decision-hub" : ""
        navigator.serviceWorker
          .register(`${basePath}/sw.js`)
          .then((reg) => console.log("Service Worker registered successfully:", reg.scope))
          .catch((err) => console.error("Service Worker registration failed:", err))
      })
    }
  }, [])

  return null
}

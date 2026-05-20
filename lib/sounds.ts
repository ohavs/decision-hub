// Audio context singleton
let audioContext: AudioContext | null = null

const getAudioContext = () => {
  if (typeof window === "undefined") return null
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioContext
}

export type SoundType = 
  | "pop" 
  | "tick" 
  | "ding" 
  | "whoosh" 
  | "click" 
  | "win" 
  | "lose"
  | "dice"
  | "coin"
  | "spin"
  | "buzz"
  | "success"

export function playSound(type: SoundType, enabled = true) {
  if (!enabled) return
  
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    switch (type) {
      case "pop":
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(880, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.1)
        break
        
      case "tick":
        oscillator.type = "square"
        oscillator.frequency.setValueAtTime(600, ctx.currentTime)
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.05)
        break
        
      case "click":
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(1000, ctx.currentTime)
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.03)
        break
        
      case "ding":
      case "win":
      case "success":
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1) // E5
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2) // G5
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.5)
        
        // Add harmonics
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.type = "sine"
        osc2.frequency.setValueAtTime(1046.5, ctx.currentTime) // C6
        gain2.gain.setValueAtTime(0.2, ctx.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        osc2.start(ctx.currentTime)
        osc2.stop(ctx.currentTime + 0.3)
        break
        
      case "lose":
        oscillator.type = "sawtooth"
        oscillator.frequency.setValueAtTime(200, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.3)
        break
        
      case "whoosh":
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(100, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.2)
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4)
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.4)
        break
        
      case "dice":
        // Multiple clicks for dice rolling
        for (let i = 0; i < 5; i++) {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.type = "square"
          osc.frequency.setValueAtTime(200 + Math.random() * 400, ctx.currentTime + i * 0.08)
          gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.08)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.05)
          osc.start(ctx.currentTime + i * 0.08)
          osc.stop(ctx.currentTime + i * 0.08 + 0.05)
        }
        break
        
      case "coin":
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(1500, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.15)
        
        // Ring sound
        const ringOsc = ctx.createOscillator()
        const ringGain = ctx.createGain()
        ringOsc.connect(ringGain)
        ringGain.connect(ctx.destination)
        ringOsc.type = "sine"
        ringOsc.frequency.setValueAtTime(2000, ctx.currentTime + 0.05)
        ringGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.05)
        ringGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        ringOsc.start(ctx.currentTime + 0.05)
        ringOsc.stop(ctx.currentTime + 0.3)
        break
        
      case "spin":
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(400, ctx.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.15)
        break
        
      case "buzz":
        oscillator.type = "sawtooth"
        oscillator.frequency.setValueAtTime(150, ctx.currentTime)
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.2)
        break
    }
  } catch (e) {
    // Silently fail - audio is not critical
  }
}

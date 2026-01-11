"use client"

import { useState, useEffect } from "react"

export function useCurrentTime(updateInterval: number = 60000) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    // Solo establecer la hora después del montaje del cliente
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, updateInterval)

    return () => clearInterval(timer)
  }, [updateInterval])

  return currentTime
}

"use client"

import { useState, useCallback } from "react"

export function useLastUpdate() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const updateTimestamp = useCallback(() => {
    setLastUpdate(new Date())
  }, [])

  const resetTimestamp = useCallback(() => {
    setLastUpdate(null)
  }, [])

  return { lastUpdate, updateTimestamp, resetTimestamp }
}

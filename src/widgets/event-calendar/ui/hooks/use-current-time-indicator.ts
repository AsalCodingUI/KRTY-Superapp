"use client"

import { useEffect, useState } from "react"
import { getCurrentTimePosition } from "../utils"

/**
 * Hook to calculate and update current time indicator position
 * Updates every minute
 */
export function useCurrentTimeIndicator(pixelsPerHour: number = 60) {
  const [position, setPosition] = useState(() =>
    getCurrentTimePosition(pixelsPerHour),
  )

  useEffect(() => {
    // Update position immediately
    setPosition(getCurrentTimePosition(pixelsPerHour))

    // Update every minute
    const interval = setInterval(() => {
      setPosition(getCurrentTimePosition(pixelsPerHour))
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [pixelsPerHour])

  return position
}

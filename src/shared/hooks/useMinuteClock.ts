"use client"

import { useEffect, useState } from "react"

/**
 * Current time, updated on each minute boundary (for HH:mm displays).
 * Returns `null` until mounted so SSR and first client render match.
 */
export function useMinuteClock(): Date | null {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const tick = () => {
      const current = new Date()
      setNow(current)
      // Re-arm for the start of the next minute.
      timeout = setTimeout(
        tick,
        60_000 - (current.getSeconds() * 1000 + current.getMilliseconds()),
      )
    }
    tick()
    return () => clearTimeout(timeout)
  }, [])

  return now
}

"use client"

import { useTheme } from "next-themes"
import { useCallback } from "react"
import { flushSync } from "react-dom"
import { webkitStill } from "@/shared/lib/motion"

/**
 * next-themes' useTheme, with setTheme cross-fading light ↔ dark (a View
 * Transition of the whole page; the timing is in globals.css). Browsers
 * without View Transitions, or with reduced motion, switch instantly.
 */
export function useThemeTransition() {
  const { setTheme: set, ...rest } = useTheme()

  const setTheme = useCallback(
    (theme: string) => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
      if (!document.startViewTransition || reduce || webkitStill())
        return set(theme)
      // The new class has to land inside the callback, so the browser
      // snapshots the old look first and the new one after.
      document.startViewTransition(() => flushSync(() => set(theme)))
    },
    [set],
  )

  return { ...rest, setTheme }
}

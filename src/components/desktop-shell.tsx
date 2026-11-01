"use client"

import { DesktopThemeSync } from "@/components/desktop-theme-sync"
import { createContext, useContext, useEffect, type ReactNode } from "react"

const DesktopShellContext = createContext(false)

/**
 * Whether the page runs inside KRTY for Mac (read from its cookie by the
 * layout, so the first paint is already right). There the window has no
 * title bar: the top bar holds the traffic lights and the sidebar toggle,
 * and the brand and workspace switch move into the sidebar.
 */
export function DesktopShellProvider({
  value,
  children,
}: {
  value: boolean
  children: ReactNode
}) {
  return (
    <DesktopShellContext.Provider value={value}>
      {value && <DesktopThemeSync />}
      {value && <HistoryShortcuts />}
      {children}
    </DesktopShellContext.Provider>
  )
}

export const useDesktopShell = () => useContext(DesktopShellContext)

/**
 * ⌘[ back and ⌘] forward, like Safari and Finder: the app's window has no
 * browser chrome to do it. Left to text editors (they may indent with it).
 */
function HistoryShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      if (e.key !== "[" && e.key !== "]") return
      const el = e.target
      if (el instanceof HTMLElement && el.isContentEditable) return
      e.preventDefault()
      if (e.key === "[") window.history.back()
      else window.history.forward()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  return null
}

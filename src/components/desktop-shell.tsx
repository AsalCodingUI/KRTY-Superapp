"use client"

import { DesktopThemeSync } from "@/components/desktop-theme-sync"
import { createContext, useContext, type ReactNode } from "react"

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
      {children}
    </DesktopShellContext.Provider>
  )
}

export const useDesktopShell = () => useContext(DesktopShellContext)

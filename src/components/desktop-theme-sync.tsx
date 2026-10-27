"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

type TauriGlobal = {
  core: {
    invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
  }
}

/**
 * In KRTY for Mac: tells the window which theme the page uses, so the
 * native blur behind the sidebar is light or dark to match it.
 */
export function DesktopThemeSync() {
  const { theme, resolvedTheme } = useTheme()
  useEffect(() => {
    const tauri = (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__
    const value = theme === "system" ? "system" : resolvedTheme
    if (tauri && value)
      void tauri.core
        .invoke("set_theme", { theme: value })
        .catch(() => undefined)
  }, [theme, resolvedTheme])
  return null
}

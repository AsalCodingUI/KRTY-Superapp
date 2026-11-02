"use client"

import { Moon, Sun } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * One button that flips light / dark, for pages without the app's sidebar
 * (a shared report link). Starts from what the page is showing, so a reader
 * on "system" gets the opposite of their system theme.
 */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useT("common")
  // next-themes only knows the theme after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = mounted && resolvedTheme === "dark"
  const label = t(dark ? "themeLight" : "themeDark")

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      data-no-translate
      aria-label={label}
      title={label}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn("blend-ink text-muted-foreground", className)}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}

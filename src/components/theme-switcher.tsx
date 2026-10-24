"use client"

import { SlidingIndicator } from "@/components/sliding-indicator"
import { cn } from "@/lib/utils"
import { Monitor, Moon, Sun } from "@/components/icons"
import { useT } from "@/shared/i18n/client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const ITEMS = [
  { value: "light", label: "themeLight", icon: Sun },
  { value: "dark", label: "themeDark", icon: Moon },
  { value: "system", label: "themeSystem", icon: Monitor },
] as const

/**
 * Light / dark / system as a compact icon pill in the sidebar (there is no
 * settings page). Fits its content instead of stretching the footer.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const t = useT("common")
  // next-themes only knows the stored theme after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const current = mounted ? (theme ?? "system") : null

  return (
    <div
      role="radiogroup"
      aria-label={t("theme")}
      className={cn(
        "fill-ink inline-flex w-fit items-center gap-0.5 self-start rounded-full p-0.5",
        className,
      )}
    >
      <SlidingIndicator
        activeSelector="[aria-checked=true]"
        className="bg-thumb blend-light rounded-full"
        shadowClassName="rounded-full shadow-(--elev-2)"
      />
      {ITEMS.map(({ value, label, icon: Icon }) => {
        const active = current === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(label)}
            title={t(label)}
            onClick={() => setTheme(value)}
            className={cn(
              "focus-visible:ring-focus-ring relative grid size-7 cursor-pointer place-items-center rounded-full transition-colors duration-150 ease-out outline-none focus-visible:ring-2 [&_svg]:size-3.5",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}

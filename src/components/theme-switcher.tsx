"use client"

import { SlidingIndicator } from "@/components/sliding-indicator"
import { cn } from "@/lib/utils"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const ITEMS = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
] as const

/**
 * Light / dark / system as a compact icon pill in the sidebar (there is no
 * settings page). Fits its content instead of stretching the footer.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  // next-themes only knows the stored theme after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const current = mounted ? (theme ?? "system") : null

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className={cn(
        "bg-sidebar-accent dark:bg-muted relative inline-flex w-fit items-center gap-0.5 self-start rounded-full p-0.5",
        className,
      )}
    >
      <SlidingIndicator
        activeSelector="[aria-checked=true]"
        className="bg-background smooth-shadow-ring-xs dark:bg-foreground/[0.13] rounded-full dark:shadow-none"
      />
      {ITEMS.map(({ value, label, icon: Icon }) => {
        const active = current === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
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

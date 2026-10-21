"use client"

import { cx } from "@/shared/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

type ThemeOption = {
  id: "light" | "dark" | "system"
  name: string
}

const OPTIONS: ThemeOption[] = [
  { id: "light", name: "Terang" },
  { id: "dark", name: "Gelap" },
  { id: "system", name: "Sistem" },
]

/** Fixed swatches so each preview shows its own theme, not the active one. */
const SWATCH = {
  light: { bg: "#ffffff", side: "#f8f8f7", line: "#e9e9e7", ink: "#d3d2ce" },
  dark: { bg: "#141414", side: "#181818", line: "#262626", ink: "#3a3a3a" },
}

function Preview({ tone }: { tone: "light" | "dark" }) {
  const c = SWATCH[tone]
  return (
    <div
      className="flex h-full w-full overflow-hidden"
      style={{ background: c.bg }}
    >
      <div
        className="flex w-1/3 flex-col gap-1.5 p-2"
        style={{ background: c.side, borderRight: `1px solid ${c.line}` }}
      >
        <span className="h-1.5 w-3/4 rounded-full" style={{ background: c.ink }} />
        <span className="h-1.5 w-1/2 rounded-full" style={{ background: c.ink }} />
        <span className="h-1.5 w-2/3 rounded-full" style={{ background: c.ink }} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2">
        <span className="h-2 w-1/2 rounded-full" style={{ background: c.ink }} />
        <span className="h-1.5 w-full rounded-full" style={{ background: c.line }} />
        <span className="h-1.5 w-5/6 rounded-full" style={{ background: c.line }} />
        <span className="h-1.5 w-4/6 rounded-full" style={{ background: c.line }} />
      </div>
    </div>
  )
}

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  // next-themes only knows the stored theme after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const current = mounted ? theme : undefined

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium">Tema</p>
        <p className="text-muted-foreground text-sm">
          Sistem mengikuti pengaturan terang/gelap di perangkat kamu.
        </p>
      </div>
      <div role="radiogroup" className="grid grid-cols-3 gap-3">
        {OPTIONS.map((opt) => {
          const selected = current === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(opt.id)}
              className="group flex cursor-pointer flex-col gap-2 text-left"
            >
              <div
                className={cx(
                  "aspect-[16/10] overflow-hidden rounded-lg border transition-shadow",
                  selected
                    ? "ring-primary ring-2 ring-offset-2 ring-offset-background"
                    : "group-hover:border-foreground/20",
                )}
              >
                {opt.id === "system" ? (
                  <div className="relative h-full w-full">
                    <Preview tone="light" />
                    <div
                      className="absolute inset-0"
                      style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
                    >
                      <Preview tone="dark" />
                    </div>
                  </div>
                ) : (
                  <Preview tone={opt.id} />
                )}
              </div>
              <span
                className={cx(
                  "text-sm",
                  selected ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {opt.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

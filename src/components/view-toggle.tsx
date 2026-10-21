"use client"

import { cn } from "@/lib/utils"
import { ListIcon, Table2 } from "lucide-react"
import * as React from "react"

export type ViewMode = "list" | "table"

const OPTIONS = [
  { value: "list", label: "Tampilan list", icon: ListIcon },
  { value: "table", label: "Tampilan tabel", icon: Table2 },
] as const

/**
 * Per-viewer list/table preference, remembered in this browser. Starts as
 * "list" on the server and on first visit.
 */
export function useViewMode(storageKey: string, fallback: ViewMode = "list") {
  const key = `view:${storageKey}`
  const [mode, setMode] = React.useState<ViewMode>(fallback)

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key)
      if (saved === "list" || saved === "table") setMode(saved)
    } catch {
      // Storage blocked: keep the default.
    }
  }, [key])

  const update = React.useCallback(
    (next: ViewMode) => {
      setMode(next)
      try {
        window.localStorage.setItem(key, next)
      } catch {
        // Storage blocked: the choice lasts for this visit only.
      }
    },
    [key],
  )

  return [mode, update] as const
}

/** Two-icon segmented switch between the list and table views. */
export function ViewToggle({
  value,
  onValueChange,
  className,
}: {
  value: ViewMode
  onValueChange: (value: ViewMode) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label="Tampilan"
      className={cn(
        "bg-muted/60 flex items-center gap-0.5 rounded-md p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value: option, label, icon: Icon }) => (
        <button
          key={option}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={value === option}
          onClick={() => onValueChange(option)}
          className={cn(
            "text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-[5px] transition-colors [&_svg]:size-4",
            value === option && "bg-background text-foreground shadow-xs",
          )}
        >
          <Icon />
        </button>
      ))}
    </div>
  )
}

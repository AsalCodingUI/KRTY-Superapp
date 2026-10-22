"use client"

import { cn } from "@/lib/utils"
import { Columns3, ListIcon, Table2 } from "lucide-react"
import * as React from "react"

export type ViewMode = "list" | "table" | "kanban"

const OPTIONS = [
  { value: "list", label: "Tampilan list", icon: ListIcon },
  { value: "kanban", label: "Tampilan kanban", icon: Columns3 },
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
      if (saved === "list" || saved === "table" || saved === "kanban")
        setMode(saved)
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
  modes = ["list", "table"],
  className,
}: {
  value: ViewMode
  onValueChange: (value: ViewMode) => void
  /** Which views this page offers (default list + table). */
  modes?: ViewMode[]
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label="Tampilan"
      className={cn(
        "bg-accent dark:bg-muted/60 flex items-center gap-0.5 rounded-full p-0.5",
        className,
      )}
    >
      {OPTIONS.filter((o) => modes.includes(o.value)).map(
        ({ value: option, label, icon: Icon }) => (
          <button
            key={option}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={value === option}
            onClick={() => onValueChange(option)}
            className={cn(
              "text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-full transition-colors [&_svg]:size-3.5",
              value === option &&
                "bg-background text-foreground smooth-shadow-ring-xs dark:shadow-xs",
            )}
          >
            <Icon />
          </button>
        ),
      )}
    </div>
  )
}

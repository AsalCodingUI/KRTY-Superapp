"use client"

import { cx } from "@/shared/lib/utils"

interface RSVPButtonsProps {
  value?: "yes" | "no" | "maybe"
  onChange: (value: "yes" | "no" | "maybe") => void
  disabled?: boolean
}

export function RSVPButtons({
  value,
  onChange,
  disabled = false,
}: RSVPButtonsProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-label-md text-content">Going?</h4>
      <div className="flex gap-2">
        <button
          onClick={() => onChange("yes")}
          disabled={disabled}
          className={cx(
            "text-label-md flex-1 rounded-lg px-4 py-2 transition-all",
            "border disabled:cursor-not-allowed disabled:opacity-50",
            value === "yes"
              ? "bg-surface-brand text-primary-fg border-primary"
              : "bg-surface text-content border-border-border hover:bg-muted",
          )}
        >
          Yes
        </button>
        <button
          onClick={() => onChange("no")}
          disabled={disabled}
          className={cx(
            "text-label-md flex-1 rounded-lg px-4 py-2 transition-all",
            "border disabled:cursor-not-allowed disabled:opacity-50",
            value === "no"
              ? "bg-surface text-content border-border-border ring-border ring-2"
              : "bg-surface text-content border-border-border hover:bg-muted",
          )}
        >
          No
        </button>
        <button
          onClick={() => onChange("maybe")}
          disabled={disabled}
          className={cx(
            "text-label-md flex-1 rounded-lg px-4 py-2 transition-all",
            "border disabled:cursor-not-allowed disabled:opacity-50",
            value === "maybe"
              ? "bg-surface text-content border-border-border ring-border ring-2"
              : "bg-surface text-content border-border-border hover:bg-muted",
          )}
        >
          Maybe
        </button>
      </div>
    </div>
  )
}

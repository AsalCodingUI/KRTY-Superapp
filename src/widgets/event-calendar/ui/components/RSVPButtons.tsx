"use client"

import { useT } from "@/shared/i18n/client"
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
  const t = useT("calendar")
  return (
    <div className="space-y-2">
      <h4 className="text-foreground text-sm font-medium">
        {t("rsvpQuestion")}
      </h4>
      <div className="flex gap-2">
        <button
          onClick={() => onChange("yes")}
          disabled={disabled}
          className={cx(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-[color,background-color,border-color,scale] duration-150 ease-out active:scale-[0.97]",
            "border disabled:cursor-not-allowed disabled:opacity-50",
            value === "yes"
              ? "bg-primary text-primary-fg border-primary"
              : "text-foreground border-border hover:bg-muted",
          )}
        >
          {t("rsvpYes")}
        </button>
        <button
          onClick={() => onChange("no")}
          disabled={disabled}
          className={cx(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-[color,background-color,border-color,scale] duration-150 ease-out active:scale-[0.97]",
            "border disabled:cursor-not-allowed disabled:opacity-50",
            value === "no"
              ? "text-foreground border-border ring-border ring-2"
              : "text-foreground border-border hover:bg-muted",
          )}
        >
          {t("rsvpNo")}
        </button>
        <button
          onClick={() => onChange("maybe")}
          disabled={disabled}
          className={cx(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-[color,background-color,border-color,scale] duration-150 ease-out active:scale-[0.97]",
            "border disabled:cursor-not-allowed disabled:opacity-50",
            value === "maybe"
              ? "text-foreground border-border ring-border ring-2"
              : "text-foreground border-border hover:bg-muted",
          )}
        >
          {t("rsvpMaybe")}
        </button>
      </div>
    </div>
  )
}

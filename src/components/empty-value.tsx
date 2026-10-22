import { cn } from "@/lib/utils"
import * as React from "react"

/**
 * The one way to show "no number yet": a short dashed stroke in tertiary
 * text. Sized in `em`, so it scales with the figure it stands in for (table
 * cell or a big stat) instead of reading as a solid bar.
 */
export function EmptyValue({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Belum ada data"
      className={cn(
        "text-tertiary-foreground inline-block h-[0.09em] min-h-px w-[1.15em] rounded-full align-middle",
        "bg-[repeating-linear-gradient(90deg,currentColor_0_0.28em,transparent_0.28em_0.43em)]",
        className,
      )}
    />
  )
}

const EMPTY_STRINGS = new Set(["", "—", "–", "-"])

/** `value`, or the dashed placeholder when it is missing (null, "", a dash). */
export function orEmpty(value: React.ReactNode): React.ReactNode {
  if (value === null || value === undefined || value === false) {
    return <EmptyValue />
  }
  if (typeof value === "string" && EMPTY_STRINGS.has(value.trim())) {
    return <EmptyValue />
  }
  return value
}

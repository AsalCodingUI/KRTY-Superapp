import { cn } from "@/lib/utils"
import { STROKE } from "@/components/icons/custom"
import type * as React from "react"

/** Highest first, as the menus list them. */
export const TASK_PRIORITIES = [
  "urgent",
  "high",
  "medium",
  "low",
  "none",
] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const PRIORITY_LABEL = {
  urgent: "priorityUrgent",
  high: "priorityHigh",
  medium: "priorityMedium",
  low: "priorityLow",
  none: "priorityNone",
} as const satisfies Record<TaskPriority, string>

export function priorityOf(value: string | null | undefined): TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(value ?? "")
    ? (value as TaskPriority)
    : "none"
}

/** Our grid and stroke (24, STROKE, round caps and joins). */
function Glyph({
  className,
  children,
}: {
  className: string
  children: React.ReactNode
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  )
}

/** Three rising bars, 6.5 apart, centred on the grid. */
const BARS = [
  { x: 5.5, top: 14 },
  { x: 12, top: 9 },
  { x: 18.5, top: 4 },
]

/**
 * Linear-style priority glyphs: three bars lit up to the level, our
 * square with a "!" for urgent, three short dashes for none.
 */
export function TaskPriorityIcon({
  priority,
  className,
}: {
  priority: TaskPriority
  className?: string
}) {
  const base = cn("size-4 shrink-0", className)
  if (priority === "urgent")
    return (
      <Glyph className={cn(base, "text-warning")}>
        <path d="M6.25 3.25h11.5a3 3 0 0 1 3 3v11.5a3 3 0 0 1-3 3H6.25a3 3 0 0 1-3-3V6.25a3 3 0 0 1 3-3ZM12 7.75v5M11.75 16.25a.25.25 0 1 0 .5 0a.25.25 0 1 0-.5 0" />
      </Glyph>
    )
  if (priority === "none")
    return (
      <Glyph className={cn(base, "text-muted-foreground")}>
        <path d="M5 12h1M11.5 12h1M18 12h1" />
      </Glyph>
    )
  const level = priority === "high" ? 3 : priority === "medium" ? 2 : 1
  return (
    <Glyph className={cn(base, "text-muted-foreground")}>
      {BARS.map((bar, i) => (
        <path
          key={bar.x}
          d={`M${bar.x} ${bar.top}V20`}
          opacity={i < level ? 1 : 0.25}
        />
      ))}
    </Glyph>
  )
}

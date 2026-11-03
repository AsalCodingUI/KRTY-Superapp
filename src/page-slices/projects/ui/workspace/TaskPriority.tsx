import { cn } from "@/lib/utils"

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

/**
 * Linear-style priority glyphs: three bars filled up to the level, a
 * filled "!" box for urgent, dashes for none.
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
      <svg aria-hidden viewBox="0 0 16 16" className={cn(base, "text-warning")}>
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M4 1.5h8A2.5 2.5 0 0 1 14.5 4v8a2.5 2.5 0 0 1-2.5 2.5H4A2.5 2.5 0 0 1 1.5 12V4A2.5 2.5 0 0 1 4 1.5ZM7.1 4h1.8l-.25 5H7.35L7.1 4Zm.9 6.25a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
        />
      </svg>
    )
  if (priority === "none")
    return (
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className={cn(base, "text-muted-foreground")}
      >
        {[2.5, 6.75, 11].map((x) => (
          <rect
            key={x}
            x={x}
            y="7.25"
            width="2.5"
            height="1.5"
            rx="0.5"
            fill="currentColor"
          />
        ))}
      </svg>
    )
  const level = priority === "high" ? 3 : priority === "medium" ? 2 : 1
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={cn(base, "text-foreground/80")}
    >
      {[
        { x: 2, y: 9, h: 5 },
        { x: 6.75, y: 5.5, h: 8.5 },
        { x: 11.5, y: 2, h: 12 },
      ].map((bar, i) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width="2.5"
          height={bar.h}
          rx="0.75"
          fill="currentColor"
          opacity={i < level ? 1 : 0.25}
        />
      ))}
    </svg>
  )
}

"use client"

import { RollingValue } from "@/components/rolling-value"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type SplitItem = {
  key: string
  label: string
  value: number
  /** Fill of the segment and the legend dot. */
  tone: SplitTone
}

export type SplitTone = "good" | "warning" | "info" | "neutral"

// Validated as a set (CVD, contrast) for light and dark surfaces: the amber
// is a step darker than the UI's warning so it reads as a fill, and darker
// again on dark. "Not in yet" stays neutral: a share, not an alarm.
const TONE: Record<SplitTone, string> = {
  good: "bg-[#30a46c]",
  warning: "bg-[#e5a000] dark:bg-[#c08400]",
  info: "bg-[#0090ff]",
  neutral: "bg-foreground/12 dark:bg-white/14",
}

/**
 * Today's attendance as one bar split by status, then a legend that carries
 * the numbers (count and share), so colour is never the only cue. Segments
 * keep a 2px gap, round ends, grow in on mount, and say their value on hover.
 */
export function AttendanceSplit({
  items,
  total,
}: {
  items: SplitItem[]
  total: number
}) {
  const shown = items.filter((i) => i.value > 0)
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0)

  return (
    <div className="flex flex-col gap-4">
      <div
        role="img"
        aria-label={items
          .map((i) => `${i.label}: ${i.value} (${pct(i.value)}%)`)
          .join(", ")}
        className="flex h-2.5 w-full gap-0.5"
      >
        {shown.length === 0 ? (
          <div className="bg-foreground/8 h-full flex-1 rounded-full" />
        ) : (
          shown.map((item) => (
            <Tooltip key={item.key}>
              <TooltipTrigger
                render={
                  <div
                    // Width by share; grows in from nothing on first paint.
                    style={{ "--g": item.value } as React.CSSProperties}
                    className={cn(
                      "h-full min-w-1 grow-(--g) basis-0 rounded-full transition-[flex-grow] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hover:brightness-95 motion-reduce:transition-none starting:grow-0",
                      TONE[item.tone],
                    )}
                  />
                }
              />
              <TooltipContent>
                {item.label} · {item.value} ({pct(item.value)}%)
              </TooltipContent>
            </Tooltip>
          ))
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.key} className="flex min-w-0 flex-col gap-1">
            <dt className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-[13px]">
              <span
                aria-hidden
                className={cn("size-2 shrink-0 rounded-full", TONE[item.tone])}
              />
              <span className="truncate">{item.label}</span>
            </dt>
            <dd className="flex items-baseline gap-1.5 tabular-nums">
              <span className="text-foreground text-base">
                <RollingValue value={item.value}>{item.value}</RollingValue>
              </span>
              <span className="text-muted-foreground text-xs">
                {pct(item.value)}%
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

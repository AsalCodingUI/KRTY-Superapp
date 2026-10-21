import { cn } from "@/lib/utils"
import { ratingFor, type RatingTone } from "@/entities/performance/lib/kpi"

const TONES: Record<RatingTone, string> = {
  success: "bg-success/15 text-success",
  info: "bg-info/15 text-info",
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
}

/** Borderless tinted rating label; nothing when there's no score yet. */
export function RatingChip({
  score,
  className,
}: {
  score: number | null
  className?: string
}) {
  const rating = ratingFor(score)
  if (!rating) return null
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-sm px-1.5 text-xs font-medium whitespace-nowrap",
        TONES[rating.tone],
        className,
      )}
    >
      {rating.label}
    </span>
  )
}

/** Thin progress bar against a target marker. */
export function ScoreBar({
  value,
  target,
  className,
}: {
  value: number | null
  target?: number
  className?: string
}) {
  const width = value === null ? 0 : Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn(
        "bg-muted relative h-1.5 overflow-hidden rounded-full",
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          "h-full rounded-full",
          value !== null && target !== undefined && value < target
            ? "bg-warning"
            : "bg-primary",
        )}
        style={{ width: `${width}%` }}
      />
      {target !== undefined && (
        <div
          className="bg-foreground/40 absolute inset-y-0 w-px"
          style={{ left: `${target}%` }}
        />
      )}
    </div>
  )
}

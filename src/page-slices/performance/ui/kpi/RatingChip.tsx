import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ratingFor, type RatingTone } from "@/entities/performance/lib/kpi"

const VARIANTS: Record<
  RatingTone,
  "success" | "info" | "secondary" | "warning" | "destructive"
> = {
  success: "success",
  info: "info",
  neutral: "secondary",
  warning: "warning",
  destructive: "destructive",
}

/** Rating label as a status badge; nothing when there's no score yet. */
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
    <Badge variant={VARIANTS[rating.tone]} className={className}>
      {rating.label}
    </Badge>
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
          "bar-grow h-full rounded-full",
          value !== null && target !== undefined && value < target
            ? "bg-warning"
            : "bg-primary",
        )}
        style={{ "--bar": `${width}%` } as React.CSSProperties}
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

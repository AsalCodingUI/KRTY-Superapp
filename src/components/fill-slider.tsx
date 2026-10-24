"use client"

import { cn } from "@/lib/utils"
import { useRef } from "react"

/**
 * A pill slider (iOS control-center style): the label sits inside on the
 * left, the value on the right, the filled part lights up to the value and
 * a thin bar marks the edge. Drag anywhere on it, or use the arrow keys.
 */
export function FillSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = (v) => `${v}%`,
  radiusClassName = "rounded-xl",
  className,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  format?: (value: number) => string
  /** The pill's corners (e.g. rounded-nested inside a padded popover). */
  radiusClassName?: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const percent = ((value - min) / (max - min)) * 100
  const clamp = (v: number) => Math.min(max, Math.max(min, v))

  const pick = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box) return
    const ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width))
    onChange(clamp(Math.round((min + ratio * (max - min)) / step) * step))
  }

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={format(value)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        pick(e.clientX)
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e.clientX)
      }}
      onKeyDown={(e) => {
        const big = (max - min) / 10
        const next: Record<string, number> = {
          ArrowLeft: value - step,
          ArrowDown: value - step,
          ArrowRight: value + step,
          ArrowUp: value + step,
          PageDown: value - big,
          PageUp: value + big,
          Home: min,
          End: max,
        }
        if (!(e.key in next)) return
        e.preventDefault()
        onChange(clamp(next[e.key]))
      }}
      className={cn(
        "group/fill focus-visible:ring-ring bg-foreground/[0.05] relative flex h-10 cursor-ew-resize touch-none items-center overflow-hidden text-sm outline-none select-none focus-visible:ring-2 dark:bg-white/[0.06]",
        radiusClassName,
        className,
      )}
    >
      {/* Filled part, with the edge bar inside its right end. */}
      <div
        aria-hidden
        className="bg-foreground/[0.09] absolute inset-y-0 left-0 rounded-[inherit] dark:bg-white/[0.12]"
        style={{ width: `max(${percent}%, 1.25rem)` }}
      >
        <span className="bg-foreground/70 absolute top-1/2 right-2.5 h-5 w-[3px] -translate-y-1/2 rounded-full transition-[height] group-active/fill:h-6 dark:bg-white/90" />
      </div>
      <span className="text-foreground/80 relative pl-4">{label}</span>
      <span className="text-foreground/80 relative ml-auto pr-4 tabular-nums">
        {format(value)}
      </span>
    </div>
  )
}

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface CategoryBarProps extends React.HTMLAttributes<HTMLDivElement> {
  values: number[]
  colors?: string[]
  showLabels?: boolean
}

// Maps color keys to token-based Tailwind classes
const colorMap: Record<string, string> = {
  // Chart tokens (primary option)
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
  // Semantic tokens
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-destructive",
  destructive: "bg-destructive",
  muted: "bg-muted",
  // Legacy support (maps to chart tokens)
  blue: "bg-chart-1",
  emerald: "bg-chart-2",
  violet: "bg-chart-3",
  zinc: "bg-chart-4",
  orange: "bg-chart-5",
}

/**
 * CategoryBar — visualizes proportional data in a single bar.
 *
 * @example
 * ```tsx
 * <CategoryBar values={[40, 30, 20]} colors={["success", "warning", "danger"]} />
 * ```
 */
const CategoryBar = React.forwardRef<HTMLDivElement, CategoryBarProps>(
  (
    {
      values = [],
      colors = [],
      // Accepted for API compatibility (legacy never rendered labels)
      showLabels: _showLabels = true,
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const total = values.reduce((acc, value) => acc + value, 0)

    return (
      <div
        ref={forwardedRef}
        className={cn(
          "flex w-full items-center gap-x-0.5 overflow-hidden rounded-md",
          className,
        )}
        {...props}
      >
        {values.map((value, index) => {
          if (value === 0) return null

          const percentage = total > 0 ? Math.round((value / total) * 100) : 0
          const colorKey = colors.length ? colors[index % colors.length] : ""
          const bgColor = colorMap[colorKey] || "bg-muted-foreground/50"

          return (
            <div
              key={`item-${index}`}
              className={cn("h-2 w-(--width)", bgColor)}
              style={{ "--width": `${percentage}%` } as React.CSSProperties}
              title={`${value} (${percentage}%)`}
            />
          )
        })}
      </div>
    )
  },
)

CategoryBar.displayName = "CategoryBar"

export { CategoryBar, type CategoryBarProps }

// Tremor Raw DonutChart [v0.0.1] (Modified with Color Map)

"use client"

import { tv } from "@/shared/lib/utils/tv"
import React from "react"
import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import { cx } from "@/shared/lib/utils"

const donutChartVariants = tv({
  slots: {
    root: "w-full",
    container: "h-full w-full",
  },
})

interface DonutChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, any>[]
  category: string
  value: string
  colors?: string[]
  variant?: "donut" | "pie"
  valueFormatter?: (value: number) => string
  showLabel?: boolean
  showTooltip?: boolean
  onValueChange?: (value: Record<string, any> | null) => void
  label?: string
}

/**
 * DonutChart component for visualizing part-to-whole relationships.
 * Built on Recharts.
 *
 * @example
 * ```tsx
 * <DonutChart
 *   data={cities}
 *   category="sales"
 *   index="name"
 *   valueFormatter={valueFormatter}
 * />
 * ```
 */
const DonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>(
  (
    {
      data = [],
      category,
      value,
      colors = [
        "var(--chart-1)",
        "var(--chart-2)",
        "var(--chart-3)",
        "var(--chart-4)",
        "var(--chart-5)",
      ],
      variant = "donut",
      valueFormatter = (value: number) => `${value}`,
      showLabel = false,
      showTooltip = true,
      onValueChange,
      label,
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const [activeIndex, setActiveIndex] = React.useState<number | undefined>(
      undefined,
    )
    const isDonut = variant === "donut"

    return (
      <div
        ref={forwardedRef}
        className={cx(donutChartVariants().root(), className)}
        {...props}
      >
        <ResponsiveContainer className={donutChartVariants().container()}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius={isDonut ? "75%" : "0%"}
              outerRadius="100%"
              stroke=""
              strokeLinejoin="round"
              dataKey={value}
              nameKey={category}
              isAnimationActive={true}
              onClick={(data, index) => {
                setActiveIndex(index)
                onValueChange?.(data)
              }}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              {data.map((_, index) => {
                const fillColor = colors[index % colors.length]

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={fillColor}
                    className={cx(
                      "stroke-surface transition-opacity duration-300",
                      index === activeIndex ? "opacity-80" : "",
                    )}
                  />
                )
              })}
            </Pie>

            {/* Tooltip Configuration */}
            {showTooltip && (
              <Tooltip
                wrapperStyle={{ outline: "none" }}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload
                    return (
                      <div className="border-border-default bg-surface rounded-md px-2.5 py-1.5 shadow-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-foreground-tertiary text-xs font-medium">
                            {dataPoint[category]}
                          </span>
                          <span className="text-foreground-primary text-sm font-semibold">
                            {valueFormatter(dataPoint[value])}
                          </span>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
            )}
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    )
  },
)

DonutChart.displayName = "DonutChart"

export { DonutChart, type DonutChartProps }

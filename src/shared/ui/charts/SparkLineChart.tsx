// Tremor SparkLineChart [v0.0.1] - Simplified

"use client"

import { cx } from "@/shared/lib/utils"
import React from "react"
import {
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
} from "recharts"

interface SparkLineChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Array<Record<string, any>>
  categories: string[]
  index: string
  colors?: string[]
}

/**
 * SparkLineChart component for small, simple line charts.
 * Built on Recharts.
 *
 * @example
 * ```tsx
 * <SparkLineChart
 *   data={data}
 *   categories={['val']}
 *   index="date"
 *   colors={['primary']}
 * />
 * ```
 */
const SparkLineChart = React.forwardRef<HTMLDivElement, SparkLineChartProps>(
  (
    {
      data = [],
      categories = [],
      index,
      colors = ["primary"],
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const color = colors[0] || "primary"
    const strokeColor = `stroke-${color}`

    return (
      <div
        ref={forwardedRef}
        className={cx("h-10 w-full", className)}
        tremor-id="tremor-raw"
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data}>
            <Line
              type="monotone"
              dataKey={categories[0]}
              stroke="currentColor"
              className={strokeColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    )
  },
)

SparkLineChart.displayName = "SparkLineChart"

export { SparkLineChart, type SparkLineChartProps }

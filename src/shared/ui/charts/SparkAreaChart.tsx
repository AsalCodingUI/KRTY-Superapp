// Tremor SparkAreaChart [v0.0.1] - Simplified

"use client"

import { cx } from "@/shared/lib/utils"
import React from "react"
import {
  Area,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
} from "recharts"

interface SparkAreaChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Array<Record<string, any>>
  categories: string[]
  index: string
  colors?: string[]
  autoMinValue?: boolean
  minValue?: number
  maxValue?: number
}

/**
 * SparkAreaChart component for small, simple area charts.
 * Built on Recharts.
 *
 * @example
 * ```tsx
 * <SparkAreaChart
 *   data={data}
 *   categories={['val']}
 *   index="date"
 *   colors={['primary']}
 * />
 * ```
 */
const SparkAreaChart = React.forwardRef<HTMLDivElement, SparkAreaChartProps>(
  (
    {
      data = [],
      categories = [],
      index,
      colors = ["primary"],
      autoMinValue = true,
      minValue,
      maxValue,
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const color = colors[0] || "primary"
    const fillColor = `fill-${color}`

    return (
      <div
        ref={forwardedRef}
        className={cx("h-10 w-full", className)}
        tremor-id="tremor-raw"
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data}>
            <Area
              type="monotone"
              dataKey={categories[0]}
              stroke="none"
              fill="currentColor"
              className={fillColor}
              isAnimationActive={false}
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    )
  },
)

SparkAreaChart.displayName = "SparkAreaChart"

export { SparkAreaChart, type SparkAreaChartProps }

"use client"

import React from "react"
import {
  Area,
  CartesianGrid,
  Legend,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cx } from "@/shared/lib/utils"

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

interface AreaChartProps {
  data: Record<string, any>[]
  index: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  showLegend?: boolean
  showGridLines?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  stack?: boolean
  className?: string
}

/**
 * AreaChart component for visualizing trend data over time.
 * Built on Recharts.
 *
 * @example
 * ```tsx
 * <AreaChart
 *   data={chartData}
 *   index="date"
 *   categories={['Sales', 'Profit']}
 * />
 * ```
 */
const AreaChart = React.forwardRef<HTMLDivElement, AreaChartProps>(
  (
    {
      data,
      index,
      categories,
      colors = chartColors,
      valueFormatter = (value) => value.toString(),
      showLegend = true,
      showGridLines = true,
      showXAxis = true,
      showYAxis = true,
      stack = false,
      className,
    },
    forwardedRef,
  ) => {
    return (
      <div ref={forwardedRef} className={cx("h-80 w-full", className)}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data}>
            {showGridLines && (
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
                stroke="var(--border-default)"
              />
            )}
            {showXAxis && (
              <XAxis
                dataKey={index}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              />
            )}
            {showYAxis && (
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                tickFormatter={valueFormatter}
              />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null
                return (
                  <div className="bg-surface shadow-md-border border-border-default rounded-md border p-2">
                    <p className="text-foreground-primary text-sm font-medium">
                      {payload[0].payload[index]}
                    </p>
                    {payload.map((entry: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-sm bg-[var(--bg)]"
                            style={
                              { "--bg": entry.color } as React.CSSProperties
                            }
                          />
                          <span className="text-foreground-tertiary text-xs">
                            {entry.name}:
                          </span>
                        </div>
                        <span className="text-foreground-primary text-xs font-medium">
                          {valueFormatter(entry.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                content={({ payload }) => {
                  if (!payload) return null
                  return (
                    <div className="flex items-center justify-center gap-4 pt-4">
                      {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-sm bg-[var(--bg)]"
                            style={
                              { "--bg": entry.color } as React.CSSProperties
                            }
                          />
                          <span className="text-foreground-tertiary text-xs">
                            {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
            )}
            {categories.map((category, idx) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stroke={colors[idx % colors.length]}
                fill={colors[idx % colors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
                dot={false}
                stackId={stack ? "stack" : undefined}
              />
            ))}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    )
  },
)

AreaChart.displayName = "AreaChart"

export { AreaChart, type AreaChartProps }

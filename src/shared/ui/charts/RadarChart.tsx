// src/components/RadarChart.tsx
"use client"

import React from "react"
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import { cx } from "@/shared/lib/utils"

interface RadarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, any>[]
  index: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  showLegend?: boolean
  showTooltip?: boolean
}

// Using chart tokens for data visualization consistency
const colorMap: Record<string, string> = {
  // Chart tokens (primary option)
  "chart-1": "stroke-chart-1 fill-chart-1",
  "chart-2": "stroke-chart-2 fill-chart-2",
  "chart-3": "stroke-chart-3 fill-chart-3",
  "chart-4": "stroke-chart-4 fill-chart-4",
  "chart-5": "stroke-chart-5 fill-chart-5",
  // Semantic tokens
  primary: "stroke-primary fill-primary",
  success: "stroke-success fill-success",
  danger: "stroke-danger fill-danger",
  // Legacy support
  indigo: "stroke-chart-1 fill-chart-1",
  fuchsia: "stroke-chart-2 fill-chart-2",
  emerald: "stroke-chart-3 fill-chart-3",
}

/**
 * RadarChart component for comparing multiple quantitative variables.
 * Built on Recharts.
 *
 * @example
 * ```tsx
 * <RadarChart
 *   data={data}
 *   index="subject"
 *   categories={['A', 'B']}
 * />
 * ```
 */
const RadarChart = React.forwardRef<HTMLDivElement, RadarChartProps>(
  (
    {
      data = [],
      index,
      categories = [],
      colors = ["chart-1", "chart-2", "chart-3"],
      valueFormatter = (value: number) => `${value}`,
      showLegend = true,
      showTooltip = true,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} className={cx("h-80 w-full", className)} {...props}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid
              stroke="currentColor"
              className="text-border dark:text-border"
            />
            <PolarAngleAxis
              dataKey={index}
              tick={{ fill: "currentColor", fontSize: 12 }}
              className="text-content-subtle dark:text-content-placeholder font-medium"
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, "auto"]}
              tick={false}
              axisLine={false}
            />

            {categories.map((category, i) => {
              const colorKey = colors[i % colors.length]
              const colorClass =
                colorMap[colorKey] ||
                "stroke-content-subtle fill-content-subtle"

              return (
                <Radar
                  key={category}
                  name={category}
                  dataKey={category}
                  strokeWidth={2}
                  fillOpacity={0.2}
                  className={cx(colorClass)}
                />
              )
            })}

            {showTooltip && (
              <Tooltip
                wrapperStyle={{ outline: "none" }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="border-border bg-surface text-label-xs rounded-md p-2 shadow-sm">
                        <p className="text-content dark:text-content mb-2 font-medium">
                          {label}
                        </p>
                        {payload.map((item, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span
                              className="size-2 rounded-full bg-[var(--bg)]"
                              style={
                                { "--bg": item.color } as React.CSSProperties
                              }
                            />
                            <span className="text-content-subtle dark:text-content-placeholder">
                              {item.name}:
                            </span>
                            <span className="text-content dark:text-content font-medium">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
            )}

            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span className="text-content-subtle dark:text-content-placeholder text-body-sm ml-1">
                    {value}
                  </span>
                )}
              />
            )}
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
    )
  },
)

RadarChart.displayName = "RadarChart"

export { RadarChart }

"use client"

import * as React from "react"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
} from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

interface RadarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, any>[]
  index: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  showLegend?: boolean
  showTooltip?: boolean
}

// Color keys → CSS color values (semantic tokens only)
const colorMap: Record<string, string> = {
  "chart-1": "var(--chart-1)",
  "chart-2": "var(--chart-2)",
  "chart-3": "var(--chart-3)",
  "chart-4": "var(--chart-4)",
  "chart-5": "var(--chart-5)",
  primary: "var(--primary)",
  success: "var(--success)",
  warning: "var(--warning)",
  info: "var(--info)",
  danger: "var(--destructive)",
  destructive: "var(--destructive)",
  // Legacy support
  indigo: "var(--chart-1)",
  fuchsia: "var(--chart-2)",
  emerald: "var(--chart-3)",
}

const FALLBACK_COLOR = "var(--muted-foreground)"

/**
 * RadarChart — compares multiple quantitative variables.
 * Built on recharts v3 + shadcn `ChartContainer`.
 *
 * @example
 * ```tsx
 * <RadarChart data={data} index="subject" categories={["A", "B"]} />
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
    const resolveColor = React.useCallback(
      (i: number) =>
        colorMap[colors[i % colors.length] ?? ""] ?? FALLBACK_COLOR,
      [colors],
    )

    // Labels only — colors are applied directly so category names with
    // spaces don't need to be valid CSS custom-property names.
    const config = React.useMemo<ChartConfig>(
      () =>
        Object.fromEntries(
          categories.map((category) => [category, { label: category }]),
        ),
      [categories],
    )

    return (
      <ChartContainer
        ref={ref}
        config={config}
        className={cn("aspect-auto h-80 w-full", className)}
        {...props}
      >
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="78%" data={data}>
          <PolarGrid gridType="polygon" />
          <PolarAngleAxis
            dataKey={index}
            tick={{
              fill: "var(--muted-foreground)",
              fontSize: 12,
              fontWeight: 500,
            }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, "auto"]}
            tick={false}
            axisLine={false}
            tickLine={false}
          />

          {categories.map((category, i) => {
            const color = resolveColor(i)
            return (
              <Radar
                key={category}
                name={category}
                dataKey={category}
                stroke={color}
                fill={color}
                strokeWidth={2}
                fillOpacity={0.12}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )
          })}

          {showTooltip && (
            <ChartTooltip
              wrapperStyle={{ outline: "none" }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name, item) => (
                    <>
                      <div
                        className="size-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                        style={
                          {
                            "--color-bg": item.color ?? FALLBACK_COLOR,
                          } as React.CSSProperties
                        }
                      />
                      <div className="flex flex-1 items-center justify-between gap-2 leading-none">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-medium text-foreground tabular-nums">
                          {typeof value === "number"
                            ? valueFormatter(value)
                            : String(value)}
                        </span>
                      </div>
                    </>
                  )}
                />
              }
            />
          )}

          {showLegend && (
            <ChartLegend
              content={
                <ChartLegendContent className="pt-5 text-body-sm text-muted-foreground" />
              }
            />
          )}
        </RechartsRadarChart>
      </ChartContainer>
    )
  },
)

RadarChart.displayName = "RadarChart"

export { RadarChart, type RadarChartProps }

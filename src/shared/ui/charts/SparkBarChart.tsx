// Tremor SparkBarChart [v0.0.1] - Simplified

"use client"

import { cx } from '@/shared/lib/utils'
import React from "react"
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer } from "recharts"

interface SparkBarChartProps extends React.HTMLAttributes<HTMLDivElement> {
    data: Array<Record<string, any>>
    categories: string[]
    index: string
    colors?: string[]
}

/**
 * SparkBarChart component for small, simple bar charts.
 * Built on Recharts.
 * 
 * @example
 * ```tsx
 * <SparkBarChart
 *   data={data}
 *   categories={['val']}
 *   index="date"
 *   colors={['primary']}
 * />
 * ```
 */
const SparkBarChart = React.forwardRef<HTMLDivElement, SparkBarChartProps>(
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
        const fillColor = `fill-${color}`

        return (
            <div
                ref={forwardedRef}
                className={cx("h-10 w-full", className)}
                tremor-id="tremor-raw"
                {...props}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={data}>
                        <Bar
                            dataKey={categories[0]}
                            fill="currentColor"
                            className={fillColor}
                            isAnimationActive={false}
                        />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
        )
    },
)

SparkBarChart.displayName = "SparkBarChart"

export { SparkBarChart, type SparkBarChartProps }

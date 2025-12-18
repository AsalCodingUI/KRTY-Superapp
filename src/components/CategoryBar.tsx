// src/components/CategoryBar.tsx

"use client"

import React from "react"
import { tv, type VariantProps } from "tailwind-variants"

import { cx } from "@/lib/utils"

const categoryBarVariants = tv({
    base: "flex w-full items-center gap-x-0.5 overflow-hidden rounded-md",
})

interface CategoryBarProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof categoryBarVariants> {
    values: number[]
    colors?: string[]
    showLabels?: boolean
}

// Color map untuk mapping string warna ke class Tailwind
// Using chart tokens for data visualization consistency
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
    danger: "bg-danger",
    muted: "bg-muted",
    // Legacy support (maps to chart tokens)
    blue: "bg-chart-1",
    emerald: "bg-chart-2",
    violet: "bg-chart-3",
    zinc: "bg-chart-4",
    orange: "bg-chart-5",
}

const CategoryBar = React.forwardRef<HTMLDivElement, CategoryBarProps>(
    (
        {
            values = [],
            colors = [],
            showLabels = true,
            className,
            ...props
        }: CategoryBarProps,
        forwardedRef,
    ) => {
        const total = values.reduce((acc, value) => acc + value, 0)

        return (
            <div
                ref={forwardedRef}
                className={cx(categoryBarVariants(), className)}
                {...props}
            >
                {values.map((value, index) => {
                    const percentage = Math.round((value / total) * 100)
                    const colorKey = colors[index % colors.length]
                    const bgColor = colorMap[colorKey] || "bg-muted0"

                    if (value === 0) return null

                    return (
                        <div
                            key={`item-${index}`}
                            className={cx("h-2", bgColor)}
                            style={{ width: `${percentage}%` }}
                            title={`${value} (${percentage}%)`}
                        />
                    )
                })}
            </div>
        )
    },
)

CategoryBar.displayName = "CategoryBar"

export { CategoryBar }

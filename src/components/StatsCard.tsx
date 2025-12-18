"use client"

import { Card } from "@/components/Card"
import { cx } from "@/lib/utils"
import React from "react"

interface StatsCardProps {
    /** Title/label for the stat */
    title: string
    /** The main value to display */
    value: string | number
    /** Optional description or subtitle */
    description?: string
    /** Optional icon to display */
    icon?: React.ReactNode
    /** Optional trend indicator (positive, negative, neutral) */
    trend?: {
        value: string
        direction: "up" | "down" | "neutral"
    }
    /** Additional className */
    className?: string
    /** Optional footer content */
    footer?: React.ReactNode
}

/**
 * StatsCard - A generic card for displaying statistics
 * 
 * @example
 * <StatsCard
 *   title="Total Revenue"
 *   value="$12,345"
 *   trend={{ value: "+12%", direction: "up" }}
 *   icon={<RiMoneyDollarCircleLine />}
 * />
 */
export function StatsCard({
    title,
    value,
    description,
    icon,
    trend,
    className,
    footer
}: StatsCardProps) {
    return (
        <Card className={cx("p-4", className)}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-content-subtle dark:text-content-subtle">
                        {title}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold text-content dark:text-content">
                            {value}
                        </span>
                        {trend && (
                            <span className={cx(
                                "text-sm font-medium",
                                trend.direction === "up" && "text-success",
                                trend.direction === "down" && "text-danger",
                                trend.direction === "neutral" && "text-content-subtle"
                            )}>
                                {trend.direction === "up" && "↑"}
                                {trend.direction === "down" && "↓"}
                                {trend.value}
                            </span>
                        )}
                    </div>
                    {description && (
                        <p className="mt-1 text-xs text-content-subtle dark:text-content-placeholder">
                            {description}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted dark:bg-hover text-content-subtle dark:text-content-placeholder">
                        {icon}
                    </div>
                )}
            </div>
            {footer && (
                <div className="mt-4 border-t border-border pt-3">
                    {footer}
                </div>
            )}
        </Card>
    )
}

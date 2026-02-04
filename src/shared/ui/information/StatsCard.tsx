"use client"

import { cx } from "@/shared/lib/utils"
import { Card } from "@/shared/ui"
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
// 1. Import motion and animation
import { microInteractions } from "@/shared/lib/animation"
import { motion } from "framer-motion"

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  footer,
}: StatsCardProps) {
  // 2. We use motion.div as a wrapper to apply the hover effect
  // Alternatively, we could make Card accepting motion props, but a wrapper is cleaner here
  // since Card might be used for static things.
  // However, StatsCard implies interactivity/dashboard widget which usually has this effect.
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover={microInteractions.cardHover}
      viewport={{ once: true }}
      className="h-full" // Ensure it takes height if needed
    >
      <Card className={cx("h-full p-4", className)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-foreground-tertiary text-sm font-medium">
              {title}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-foreground-primary text-2xl font-semibold">
                {value}
              </span>
              {trend && (
                <span
                  className={cx(
                    "text-sm font-medium",
                    trend.direction === "up" && "text-foreground-success",
                    trend.direction === "down" && "text-foreground-danger",
                    trend.direction === "neutral" && "text-foreground-tertiary",
                  )}
                >
                  {trend.direction === "up" && "↑"}
                  {trend.direction === "down" && "↓"}
                  {trend.value}
                </span>
              )}
            </div>
            {description && (
              <p className="text-foreground-tertiary mt-1 text-xs">
                {description}
              </p>
            )}
          </div>
          {icon && (
            <div className="bg-surface-neutral-secondary text-foreground-tertiary flex h-10 w-10 items-center justify-center rounded-lg">
              {icon}
            </div>
          )}
        </div>
        {footer && (
          <div className="border-border mt-4 border-t pt-3">{footer}</div>
        )}
      </Card>
    </motion.div>
  )
}

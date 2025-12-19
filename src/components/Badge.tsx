// Tremor Raw Badge [v0.2.0] - Unified Component with Size Variants

import React from "react"
import { tv, type VariantProps } from "tailwind-variants"

import { cx } from "@/lib/utils"

const badgeVariants = tv({
  base: cx(
    "inline-flex items-center gap-x-1 whitespace-nowrap rounded-full border transition-colors duration-150",
  ),
  variants: {
    variant: {
      // Status variants (using borders for visibility)
      default: [
        "border-primary/20 bg-muted text-primary",
      ],
      zinc: [
        "border-border bg-muted text-content-subtle",
      ],
      success: [
        "border-success/20 bg-muted text-success",
      ],
      error: [
        "border-danger/20 bg-muted text-danger",
      ],
      warning: [
        "border-warning/20 bg-muted text-warning",
      ],
      info: [
        "border-primary/20 bg-muted text-primary",
      ],

      // Feedback variants (stronger borders for emphasis)
      continue: [
        "border-success bg-muted text-success"
      ],
      start: [
        "border-primary bg-muted text-primary"
      ],
      stop: [
        "border-danger bg-muted text-danger"
      ],

      // Project status variants
      active: [
        "border-success/20 bg-muted text-success"
      ],
      inactive: [
        "border-border bg-muted text-content-subtle",
      ],
    },
    size: {
      sm: "px-1.5 py-0.5 text-xs font-medium",
      md: "px-2 py-1 text-xs font-medium",
      lg: "px-2.5 py-1.5 text-sm font-medium",
    },
  },
  compoundVariants: [
    // Feedback variants should be semibold
    { variant: "continue", className: "font-semibold" },
    { variant: "start", className: "font-semibold" },
    { variant: "stop", className: "font-semibold" },
  ],
  defaultVariants: {
    variant: "default",
    size: "sm",
  },
})

interface BadgeProps
  extends React.ComponentPropsWithoutRef<"span">,
  VariantProps<typeof badgeVariants> { }

/**
 * Unified Badge component for status indicators, labels, and feedback.
 * 
 * @example
 * ```tsx
 * // Status badges (default size="sm")
 * <Badge variant="success">Active</Badge>
 * <Badge variant="info">2025-Q1</Badge>
 * 
 * // Feedback badges (use size="md" for emphasis)
 * <Badge variant="continue" size="md">CONTINUE</Badge>
 * <Badge variant="start" size="md">START</Badge>
 * <Badge variant="stop" size="md">STOP</Badge>
 * 
 * // Size variants
 * <Badge size="sm">Small</Badge>
 * <Badge size="md">Medium</Badge>
 * <Badge size="lg">Large</Badge>
 * ```
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }: BadgeProps, forwardedRef) => {
    return (
      <span
        ref={forwardedRef}
        className={cx(badgeVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)

Badge.displayName = "Badge"

export { Badge, badgeVariants, type BadgeProps }

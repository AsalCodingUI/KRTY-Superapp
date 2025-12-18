// Tremor Raw Badge [v0.2.0] - Unified Component with Size Variants

import React from "react"
import { tv, type VariantProps } from "tailwind-variants"

import { cx } from "@/lib/utils"

const badgeVariants = tv({
  base: cx(
    "inline-flex items-center gap-x-1 whitespace-nowrap rounded-full transition-colors duration-150",
  ),
  variants: {
    variant: {
      // Status variants (semantic tokens - auto dark mode)
      default: [
        "bg-primary/10 text-primary",
      ],
      zinc: [
        "bg-muted text-content-subtle",
      ],
      success: [
        "bg-success/10 text-success",
      ],
      error: [
        "bg-danger/10 text-danger",
      ],
      warning: [
        "bg-warning/10 text-warning",
      ],
      info: [
        "bg-primary/10 text-primary",
      ],

      // Feedback variants (using chart colors for visual distinction)
      continue: [
        "bg-success/15 text-success"
      ],
      start: [
        "bg-primary/15 text-primary"
      ],
      stop: [
        "bg-danger/15 text-danger"
      ],

      // Project status variants
      active: [
        "bg-success/10 text-success"
      ],
      inactive: [
        "bg-muted text-content-subtle",
        "dark:bg-muted/50 dark:text-content-subtle"
      ],
    },
    size: {
      sm: "px-1.5 py-0.5 text-xs font-semibold",
      md: "px-2 py-1 text-xs font-semibold",
      lg: "px-2.5 py-1.5 text-sm font-medium",
    },
  },
  compoundVariants: [
    // Feedback variants should be bold
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

// Tremor Raw Badge [v0.2.0] - Unified Component with Size Variants

import { tv } from "@/shared/lib/utils/tv"
import React from "react"
import type { VariantProps } from "tailwind-variants"

import { cx } from "@/shared/lib/utils"

const badgeVariants = tv({
  base: cx(
    "inline-flex items-center gap-x-1 rounded-full border whitespace-nowrap transition-colors duration-150",
  ),
  variants: {
    variant: {
      // Status variants (Solid light background, dark text - No Opacity)
      default: [
        "bg-surface-brand-light text-foreground-brand-dark border-transparent",
      ],
      zinc: [
        "bg-surface-neutral-secondary text-foreground-secondary border-transparent",
      ],
      success: [
        "bg-surface-success-light text-foreground-success-dark border-transparent",
      ],
      error: [
        "bg-surface-danger-light text-foreground-danger-dark border-transparent",
      ],
      warning: [
        "bg-surface-warning-light text-foreground-warning-dark border-transparent",
      ],
      info: [
        "bg-surface-brand-light text-foreground-brand-dark border-transparent",
      ],

      // Feedback variants (Solid strong background, white text)
      continue: [
        "bg-surface-success text-foreground-on-color hover:bg-surface-success-hov border-transparent",
      ],
      start: [
        "bg-surface-brand text-foreground-on-color hover:bg-surface-brand-hov border-transparent",
      ],
      stop: [
        "bg-surface-danger text-foreground-on-color hover:bg-surface-danger-hov border-transparent",
      ],

      // Project status variants
      active: [
        "bg-surface-success-light text-foreground-success-dark border-transparent",
      ],
      inactive: [
        "bg-surface-neutral-secondary text-foreground-secondary border-transparent",
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

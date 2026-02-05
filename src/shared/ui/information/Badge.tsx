// Tremor Raw Badge [v0.2.0] - Unified Component with Size Variants

import { cx } from "@/shared/lib/utils"
import { tv } from "@/shared/lib/utils/tv"
import { RiHeartFill, RiVerifiedBadgeFill } from "@/shared/ui/lucide-icons"
import React from "react"
import type { VariantProps } from "tailwind-variants"

const badgeVariants = tv({
  base: cx(
    "inline-flex items-center justify-center gap-xs rounded-sm whitespace-nowrap transition-colors duration-150",
  ),
  variants: {
    variant: {
      // Subtle variants (Figma)
      default: ["bg-surface-neutral-secondary text-foreground-secondary"],
      info: ["bg-surface-brand-light text-foreground-brand-dark"],
      success: ["bg-surface-success-light text-foreground-success-dark"],
      warning: ["bg-surface-warning-light text-foreground-warning-on-color"],
      error: ["bg-surface-danger-light text-foreground-danger-dark"],

      // Compat aliases
      zinc: ["bg-surface-neutral-secondary text-foreground-secondary"],
      active: ["bg-surface-success-light text-foreground-success-dark"],
      inactive: ["bg-surface-neutral-secondary text-foreground-secondary"],

      // Feedback variants (Solid strong background, white text)
      continue: [
        "bg-surface-success text-foreground-on-color hover:bg-surface-success-hov",
      ],
      start: [
        "bg-surface-brand text-foreground-on-color hover:bg-surface-brand-hov",
      ],
      stop: [
        "bg-surface-danger text-foreground-on-color hover:bg-surface-danger-hov",
      ],
    },
    size: {
      sm: "text-label-xs px-sm py-xs",
      md: "text-label-sm px-md py-sm",
      lg: "text-label-md px-lg py-md",
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
  extends
    React.ComponentPropsWithoutRef<"span">,
    VariantProps<typeof badgeVariants> {
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  showLeadingIcon?: boolean
  showTrailingIcon?: boolean
  useDefaultIcons?: boolean
}

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
  (
    {
      className,
      variant,
      size,
      leadingIcon,
      trailingIcon,
      showLeadingIcon = true,
      showTrailingIcon = true,
      useDefaultIcons = false,
      children,
      ...props
    }: BadgeProps,
    forwardedRef,
  ) => {
    const renderIcon = (icon: React.ReactNode) => {
      if (!icon) return null
      if (React.isValidElement(icon)) {
        return React.cloneElement(icon as React.ReactElement, {
          className: cx("size-3.5 shrink-0 text-current", icon.props.className),
          "aria-hidden": true,
        })
      }
      return icon
    }

    const resolvedLeadingIcon =
      showLeadingIcon &&
      (leadingIcon ||
        (useDefaultIcons ? <RiVerifiedBadgeFill /> : null))
    const resolvedTrailingIcon =
      showTrailingIcon &&
      (trailingIcon ||
        (useDefaultIcons ? <RiHeartFill /> : null))

    return (
      <span
        ref={forwardedRef}
        className={cx(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {resolvedLeadingIcon && (
          <span className="flex shrink-0 items-center justify-center">
            {renderIcon(resolvedLeadingIcon)}
          </span>
        )}
        {children !== undefined && children !== null && (
          <span className="inline-flex items-center gap-xs px-xs">
            {children}
          </span>
        )}
        {resolvedTrailingIcon && (
          <span className="flex shrink-0 items-center justify-center">
            {renderIcon(resolvedTrailingIcon)}
          </span>
        )}
      </span>
    )
  },
)

Badge.displayName = "Badge"

export { Badge, badgeVariants, type BadgeProps }

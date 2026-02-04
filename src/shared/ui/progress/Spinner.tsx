// Spinner [v0.0.1]

import { tv } from "@/shared/lib/utils/tv"
import React from "react"
import type { VariantProps } from "tailwind-variants"

import { cx } from "@/shared/lib/utils"

const spinnerVariants = tv({
  base: "border-border-default animate-spin rounded-full border-2",
  variants: {
    size: {
      sm: "h-4 w-4",
      md: "h-8 w-8",
      lg: "h-12 w-12",
    },
    variant: {
      default: "border-t-border-brand",
      primary: "border-t-border-brand",
      neutral: "border-t-border-secondary",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
})

interface SpinnerProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

/**
 * Spinner component for loading states.
 *
 * @param size - sm | md | lg
 * @param variant - default | primary | neutral
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" variant="neutral" />
 * ```
 */
const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, variant, ...props }, forwardedRef) => {
    return (
      <div
        ref={forwardedRef}
        className={cx(spinnerVariants({ size, variant }), className)}
        role="status"
        aria-label="Loading"
        {...props}
      />
    )
  },
)

Spinner.displayName = "Spinner"

export { Spinner, spinnerVariants, type SpinnerProps }

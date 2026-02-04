// Tremor Callout [v0.0.1]

import { tv } from "@/shared/lib/utils/tv"
import React from "react"
import type { VariantProps } from "tailwind-variants"

import { cx } from "@/shared/lib/utils"

const calloutVariants = tv({
  base: "text-body-sm flex flex-col overflow-hidden rounded-md border p-4",
  variants: {
    variant: {
      default: [
        // Use semantic brand tokens for informational callouts
        "bg-surface-brand-light border-border-brand-light text-foreground-brand-dark",
      ],
      success: [
        // Use semantic success tokens
        "bg-surface-success-light border-border-success-subtle text-foreground-success-dark",
      ],
      error: [
        // Use semantic danger tokens
        "bg-surface-danger-light border-border-danger-subtle text-foreground-danger-dark",
      ],
      warning: [
        // Use semantic warning tokens
        "bg-surface-warning-light border-border-warning-subtle text-foreground-warning-dark",
      ],
      neutral: [
        // Use semantic neutral tokens
        "bg-surface-neutral-secondary border-border-secondary text-foreground-secondary",
      ],
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

/**
 * Callout component for displaying highlighted information.
 *
 * @example
 * ```tsx
 * <Callout title="Success" variant="success" icon={RiCheckLine}>
 *   Operation completed successfully.
 * </Callout>
 * ```
 */
interface CalloutProps
  extends
    React.ComponentPropsWithoutRef<"div">,
    VariantProps<typeof calloutVariants> {
  title: string
  icon?: React.ElementType | React.ReactElement
}

const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  (
    { title, icon: Icon, className, variant, children, ...props }: CalloutProps,
    forwardedRef,
  ) => {
    return (
      <div
        ref={forwardedRef}
        className={cx(calloutVariants({ variant }), className)}
        tremor-id="tremor-raw"
        {...props}
      >
        <div className={cx("flex items-start")}>
          {Icon && typeof Icon === "function" ? (
            <Icon
              className={cx("mr-1.5 h-5 w-5 shrink-0")}
              aria-hidden="true"
            />
          ) : (
            Icon
          )}
          <span className={cx("font-semibold")}>{title}</span>
        </div>
        <div className={cx("overflow-y-auto", children ? "mt-2" : "")}>
          {children}
        </div>
      </div>
    )
  },
)

Callout.displayName = "Callout"

export { Callout, calloutVariants, type CalloutProps }

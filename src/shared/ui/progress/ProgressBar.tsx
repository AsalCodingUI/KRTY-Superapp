// Tremor Raw ProgressBar [v0.0.1]

import { tv } from "@/shared/lib/utils/tv"
import React from "react"
import type { VariantProps } from "tailwind-variants"

import { cx } from "@/shared/lib/utils"

const progressBarVariants = tv({
  slots: {
    background: "",
    bar: "",
  },
  variants: {
    size: {
      md: {
        background: "h-2",
        bar: "h-full",
      },
      sm: {
        background: "h-[6px]",
        bar: "h-full",
      },
    },
    variant: {
      default: {
        background: "bg-surface-neutral-secondary",
        bar: "bg-surface-brand",
      },
      brand: {
        background: "bg-[var(--border-brand-light)]",
        bar: "bg-[var(--border-brand)]",
      },
      neutral: {
        background: "bg-surface-neutral-secondary",
        bar: "bg-surface-neutral-tertiary",
      },
      warning: {
        background: "bg-surface-neutral-secondary",
        bar: "bg-surface-warning",
      },
      error: {
        background: "bg-surface-neutral-secondary",
        bar: "bg-surface-danger",
      },
      success: {
        background: "bg-surface-neutral-secondary",
        bar: "bg-surface-success",
      },
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

interface ProgressBarProps
  extends
    React.HTMLProps<HTMLDivElement>,
    VariantProps<typeof progressBarVariants> {
  value?: number
  max?: number
  showAnimation?: boolean
  label?: string
  labelTone?: "primary" | "secondary"
  labelSize?: "md" | "sm"
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value = 0,
      max = 100,
      label,
      showAnimation = false,
      variant,
      size,
      labelTone = "primary",
      labelSize = "md",
      className,
      ...props
    }: ProgressBarProps,
    forwardedRef,
  ) => {
    const safeValue = Math.min(max, Math.max(value, 0))
    const { background, bar } = progressBarVariants({ variant, size })
    return (
      <div
        ref={forwardedRef}
        className={cx("flex w-full items-center", className)}
        {...props}
      >
        <div
          className={cx(
            "relative flex w-full items-center rounded-full",
            background(),
          )}
          aria-label="progress bar"
          aria-valuenow={value}
          aria-valuemax={max}
        >
          <div
            className={cx(
              "h-full w-[var(--width)] flex-col rounded-full",
              bar(),
              showAnimation &&
                "transform-gpu transition-all duration-300 ease-in-out",
            )}
            style={
              {
                "--width": max
                  ? `${(safeValue / max) * 100}%`
                  : `${safeValue}%`,
              } as React.CSSProperties
            }
          />
        </div>
        {label ? (
          <span
            className={cx(
              // base
              labelSize === "sm" ? "text-label-sm" : "text-label-md",
              "ml-2 whitespace-nowrap",
              // text color
              labelTone === "secondary"
                ? "text-foreground-secondary"
                : "text-foreground-primary",
            )}
          >
            {label}
          </span>
        ) : null}
      </div>
    )
  },
)

ProgressBar.displayName = "ProgressBar"

export { ProgressBar, progressBarVariants, type ProgressBarProps }

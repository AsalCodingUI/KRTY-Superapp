// Tremor Raw ProgressCircle [v0.0.1]

import { tv } from "@/shared/lib/utils/tv"
import React from "react"
import type { VariantProps } from "tailwind-variants"

import { cx } from "@/shared/lib/utils"

const progressCircleVariants = tv({
  slots: {
    background: "",
    circle: "",
  },
  variants: {
    variant: {
      default: {
        background: "stroke-border-default",
        circle: "stroke-border-brand",
      },
      neutral: {
        background: "stroke-border-default",
        circle: "stroke-border-secondary",
      },
      warning: {
        background: "stroke-border-default",
        circle: "stroke-border-warning",
      },
      error: {
        background: "stroke-border-default",
        circle: "stroke-border-danger",
      },
      success: {
        background: "stroke-border-default",
        circle: "stroke-border-success",
      },
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface ProgressCircleProps
  extends
    Omit<React.SVGProps<SVGSVGElement>, "value">,
    VariantProps<typeof progressCircleVariants> {
  value?: number
  max?: number
  showAnimation?: boolean
  radius?: number
  strokeWidth?: number
  children?: React.ReactNode
}

const ProgressCircle = React.forwardRef<SVGSVGElement, ProgressCircleProps>(
  (
    {
      value = 0,
      max = 100,
      radius = 32,
      strokeWidth = 6,
      showAnimation = true,
      variant,
      className,
      children,
      ...props
    }: ProgressCircleProps,
    forwardedRef,
  ) => {
    const safeValue = Math.min(max, Math.max(value, 0))
    const normalizedRadius = radius - strokeWidth / 2
    const circumference = normalizedRadius * 2 * Math.PI
    const offset = circumference - (safeValue / max) * circumference

    const { background, circle } = progressCircleVariants({ variant })
    return (
      <>
        <div className={cx("relative")}>
          <svg
            ref={forwardedRef}
            width={radius * 2}
            height={radius * 2}
            viewBox={`0 0 ${radius * 2} ${radius * 2}`}
            className={cx("-rotate-90 transform", className)}
            role="progress circle"
            aria-label="progress bar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            data-max={max}
            data-value={safeValue ?? null}
            {...props}
          >
            <circle
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              strokeWidth={strokeWidth}
              fill="transparent"
              stroke=""
              strokeLinecap="round"
              className={cx("transition-colors ease-linear", background())}
            />
            {safeValue >= 0 ? (
              <circle
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={offset}
                fill="transparent"
                stroke=""
                strokeLinecap="round"
                className={cx(
                  "transition-colors ease-linear",
                  circle(),
                  showAnimation &&
                    "transform-gpu transition-all duration-300 ease-in-out",
                )}
              />
            ) : null}
          </svg>
          <div
            className={cx("absolute inset-0 flex items-center justify-center")}
          >
            {children}
          </div>
        </div>
      </>
    )
  },
)

ProgressCircle.displayName = "ProgressCircle"

export { ProgressCircle, type ProgressCircleProps }

// Tremor BarList [v0.0.2] - Simplified

"use client"

import { cx } from "@/shared/lib/utils"
import React from "react"

interface BarListProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Array<{
    name: string
    value: number
    href?: string
    icon?: React.ComponentType<{ className?: string }>
  }>
  valueFormatter?: (value: number) => string
  color?: string
  showAnimation?: boolean
  onValueChange?: (payload: { name: string; value: number }) => void
}

/**
 * BarList component for displaying a list of values as bars.
 *
 * @example
 * ```tsx
 * <BarList
 *   data={[{ name: 'Twitter', value: 123 }]}
 *   valueFormatter={(val) => `${val} followers`}
 * />
 * ```
 */
const BarList = React.forwardRef<HTMLDivElement, BarListProps>(
  (
    {
      data = [],
      valueFormatter = (value) => value.toString(),
      color = "primary",
      showAnimation = false,
      onValueChange,
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const maxValue = React.useMemo(
      () => Math.max(...data.map((item) => item.value), 0),
      [data],
    )

    const barColor = `bg-${color}`

    return (
      <div
        ref={forwardedRef}
        className={cx("flex justify-between space-y-1.5", className)}
        aria-label="bar list"
        tremor-id="tremor-raw"
        {...props}
      >
        <div className="relative w-full space-y-1.5">
          {data.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={item.name ?? index}
                onClick={() => {
                  onValueChange?.({ name: item.name, value: item.value })
                }}
                className={cx(
                  "group flex items-center rounded-md transition",
                  onValueChange && "cursor-pointer",
                )}
              >
                <div className="flex flex-1 items-center space-x-2.5">
                  {Icon && (
                    <Icon
                      className="text-foreground-tertiary size-5 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex w-full justify-between space-x-4">
                    <p className="text-foreground-secondary truncate text-sm whitespace-nowrap">
                      {item.name}
                    </p>
                    <p className="text-foreground-primary text-sm font-medium whitespace-nowrap tabular-nums">
                      {valueFormatter(item.value)}
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex w-full max-w-sm items-center">
                  <div className="bg-surface-neutral-secondary relative flex h-2 w-full items-center rounded-full">
                    <div
                      className={cx(
                        "h-full w-[var(--width)] rounded-full",
                        barColor,
                        showAnimation && "transition-all duration-300",
                      )}
                      style={
                        {
                          "--width": maxValue
                            ? `${(item.value / maxValue) * 100}%`
                            : "0%",
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)

BarList.displayName = "BarList"

export { BarList, type BarListProps }

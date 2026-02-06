"use client"

import { cx, focusRing } from "@/shared/lib/utils"
import { motion } from "framer-motion"
import { useId } from "react"

export interface SegmentedControlItem<T extends string> {
  value: T
  label: React.ReactNode
  icon?: React.ElementType
  leadingIcon?: React.ElementType
  trailingIcon?: React.ElementType
  showLeadingIcon?: boolean
  showTrailingIcon?: boolean
  disabled?: boolean
}

interface SegmentedControlProps<T extends string> {
  items: SegmentedControlItem<T>[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  className?: string
  fitContent?: boolean
  size?: "sm" | "md"
}

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  disabled,
  className,
  fitContent = false,
  size = "md",
}: SegmentedControlProps<T>) {
  const id = useId()
  const activeIndex = items.findIndex((item) => item.value === value)
  const isSmall = size === "sm"
  const containerRadius = isSmall ? "rounded-md" : "rounded-lg"
  const itemPadding = isSmall ? "px-md py-xs" : "px-lg py-sm"
  const itemRadius = isSmall ? "rounded-sm" : "rounded-md"
  const activeRadius = isSmall ? "rounded-sm" : "rounded-md"

  return (
    <div
      className={cx(
        "bg-surface-neutral-secondary p-xs",
        containerRadius,
        fitContent ? "inline-flex w-auto" : "flex w-full",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {items.map((item, index) => {
        const isActive = item.value === value
        const isDisabled = Boolean(disabled || item.disabled)
        const LeadingIcon = item.leadingIcon ?? item.icon
        const TrailingIcon = item.trailingIcon
        const showLeadingIcon = item.showLeadingIcon ?? true
        const showTrailingIcon = item.showTrailingIcon ?? true
        const showDivider =
          activeIndex === -1
            ? index < items.length - 1
            : index < items.length - 1 &&
              activeIndex !== index &&
              activeIndex !== index + 1

        return (
          <div key={item.value} className="flex items-stretch">
            <button
              type="button"
              onClick={() => onChange(item.value)}
              disabled={isDisabled}
              className={cx(
                "text-label-sm relative flex items-center justify-center gap-xs overflow-hidden transition-colors duration-200 focus:outline-none whitespace-nowrap",
                fitContent ? "flex-none" : "flex-1",
                itemPadding,
                itemRadius,
                isDisabled
                  ? "text-foreground-disable cursor-not-allowed"
                  : isActive
                    ? "bg-surface-neutral-primary shadow-neutral text-foreground-primary"
                    : "text-foreground-tertiary hover:bg-surface-state-neutral-light-hover hover:text-foreground-secondary",
                focusRing,
              )}
            >
              {isActive && !isDisabled && (
                <motion.div
                  layoutId={`segment-active-${id}`}
                  className={cx(
                    "bg-surface-neutral-primary shadow-neutral absolute inset-0",
                    activeRadius,
                  )}
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-xs">
                {showLeadingIcon && LeadingIcon && (
                  <LeadingIcon
                    className="size-3.5 shrink-0 text-current"
                    aria-hidden="true"
                  />
                )}
                <span className="text-current">{item.label}</span>
                {showTrailingIcon && TrailingIcon && (
                  <TrailingIcon
                    className="size-3.5 shrink-0 text-current"
                    aria-hidden="true"
                  />
                )}
              </span>
            </button>
            {index < items.length - 1 && (
              <div
                className={cx(
                  "flex items-center self-stretch py-md",
                  showDivider ? "opacity-100" : "opacity-0",
                )}
              >
                <span className="h-full w-px bg-border-neutral-secondary" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

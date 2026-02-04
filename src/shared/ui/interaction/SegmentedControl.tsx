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
}

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  disabled,
  className,
  fitContent = false,
}: SegmentedControlProps<T>) {
  const id = useId()

  return (
    <div
      className={cx(
        "bg-surface-neutral-secondary rounded-[10px] p-xs",
        fitContent ? "inline-flex w-auto" : "flex w-full",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.value === value
        const isDisabled = Boolean(disabled || item.disabled)
        const LeadingIcon = item.leadingIcon ?? item.icon
        const TrailingIcon = item.trailingIcon
        const showLeadingIcon = item.showLeadingIcon ?? true
        const showTrailingIcon = item.showTrailingIcon ?? true

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            disabled={isDisabled}
            className={cx(
              "text-label-sm relative flex items-center justify-center gap-xs overflow-hidden rounded-md px-lg py-sm transition-colors duration-200 focus:outline-none whitespace-nowrap",
              fitContent ? "flex-none" : "flex-1",
              isActive
                ? "bg-surface-neutral-primary text-foreground-primary"
                : "text-foreground-tertiary hover:bg-surface-state-neutral-light-hover hover:text-foreground-secondary",
              isDisabled &&
                "bg-surface-state-neutral-light-disable text-foreground-disable cursor-not-allowed",
              focusRing,
            )}
          >
            {isActive && !isDisabled && (
              <motion.div
                layoutId={`segment-active-${id}`}
                className="bg-surface-neutral-primary absolute inset-0 rounded-md"
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
        )
      })}
    </div>
  )
}

// Tremor DateRangePicker [v0.0.1] - Simplified

"use client"

import { cx } from "@/shared/lib/utils"
import { RiCalendar2Fill } from "@/shared/ui/lucide-icons"
import { Calendar } from "@/shared/ui/input/Calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/overlay/Popover"
import { format } from "date-fns"
import React from "react"
import { type DateRange } from "react-day-picker"

const inputSizeStyles = {
  sm: "h-[24px] px-[8px] py-[2px] text-body-sm",
  default: "h-[28px] px-[8px] py-[4px] text-body-sm",
} as const

type InputSize = keyof typeof inputSizeStyles

interface DateRangePickerProps {
  value?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  inputSize?: InputSize
  className?: string
}

/**
 * DateRangePicker component for selecting a range of dates.
 *
 * @example
 * ```tsx
 * <DateRangePicker value={range} onValueChange={setRange} />
 * ```
 */
const DateRangePicker = React.forwardRef<
  HTMLButtonElement,
  DateRangePickerProps
>(
  (
    {
      value,
      onValueChange,
      placeholder = "Select date range",
      disabled = false,
      inputSize = "default",
      className,
    },
    ref,
  ) => {
    const isDisabled = disabled

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            className={cx(
              "group/date-range-picker flex w-full items-center gap-sm rounded-md border-none shadow-input hover:shadow-input transition-shadow",
              "bg-surface-neutral-primary text-foreground-primary",
              "hover:bg-surface-state-neutral-light-hover",
              "focus:shadow-input-focus focus:outline-none",
              "disabled:bg-surface-neutral-primary disabled:text-foreground-disable disabled:shadow-input disabled:cursor-not-allowed",
              inputSizeStyles[inputSize],
              !value?.from && !disabled && "text-foreground-tertiary",
              className,
            )}
            disabled={disabled}
          >
            <RiCalendar2Fill
              className={cx(
                "size-4 shrink-0",
                isDisabled
                  ? "text-foreground-disable"
                  : "text-foreground-secondary group-focus-within/date-range-picker:text-foreground-primary",
              )}
            />
            <span className="truncate text-left">
              {value?.from ? (
                value.to ? (
                  <>
                    {format(value.from, "LLL dd, y")} -{" "}
                    {format(value.to, "LLL dd, y")}
                  </>
                ) : (
                  format(value.from, "LLL dd, y")
                )
              ) : (
                <span>{placeholder}</span>
              )}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden rounded-xl border border-neutral-secondary bg-surface-neutral-primary p-0 shadow-regular-md"
          align="start"
        >
          <Calendar
            mode="range"
            selected={value}
            onSelect={onValueChange}
            numberOfMonths={2}
            initialFocus
            className="border-0 shadow-none rounded-none bg-transparent"
            classNames={{
              months: "flex flex-row gap-0",
            }}
          />
        </PopoverContent>
      </Popover>
    )
  },
)

DateRangePicker.displayName = "DateRangePicker"

export { DateRangePicker, type DateRangePickerProps }

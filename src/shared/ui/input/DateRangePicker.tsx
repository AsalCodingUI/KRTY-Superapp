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

interface DateRangePickerProps {
  value?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
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
      className,
    },
    ref,
  ) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            className={cx(
              "flex w-full items-center gap-md rounded-md px-lg py-md text-body-sm shadow-input transition-shadow hover:bg-surface-neutral-secondary selection:bg-surface-brand-light selection:text-foreground-primary",
              "bg-surface-neutral-primary text-foreground-primary",
              "focus:shadow-input-focus focus:outline-none",
              !value?.from && "text-foreground-tertiary",
              disabled &&
                "cursor-not-allowed text-foreground-disable shadow-input",
              className,
            )}
            disabled={disabled}
          >
            <RiCalendar2Fill
              className={cx(
                "size-5 shrink-0",
                disabled ? "text-foreground-disable" : "text-foreground-secondary",
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
          className="w-auto border-none bg-transparent p-0 shadow-none"
          align="start"
        >
          <Calendar
            mode="range"
            selected={value}
            onSelect={onValueChange}
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  },
)

DateRangePicker.displayName = "DateRangePicker"

export { DateRangePicker, type DateRangePickerProps }

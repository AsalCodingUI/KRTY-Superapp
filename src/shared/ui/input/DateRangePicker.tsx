// Tremor DateRangePicker [v0.0.1] - Simplified

"use client"

import { cx } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/action/Button"
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
      placeholder = "Pick a date range",
      disabled = false,
      className,
    },
    ref,
  ) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="secondary"
            className={cx(
              "w-full justify-start text-left font-normal",
              !value?.from && "text-content-placeholder",
              className,
            )}
            disabled={disabled}
          >
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
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
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

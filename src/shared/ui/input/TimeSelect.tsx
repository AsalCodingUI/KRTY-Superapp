import React from "react"

import { cx } from "@/shared/lib/utils"
import { SegmentedControl } from "@/shared/ui/interaction/SegmentedControl"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/input/Select"

type TimeOption = { value: string; label: string }

const timeOptionsCache = new Map<number, TimeOption[]>()

const getTimeOptions = (step: number) => {
  const normalizedStep = Math.max(1, Math.min(60, step))
  const cached = timeOptionsCache.get(normalizedStep)
  if (cached) return cached

  const options: TimeOption[] = []
  for (let hour = 1; hour <= 12; hour += 1) {
    for (let minute = 0; minute < 60; minute += normalizedStep) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      const label = value
      options.push({ value, label })
    }
  }

  timeOptionsCache.set(normalizedStep, options)
  return options
}

interface TimeSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  step?: number
  placeholder?: string
  disabled?: boolean
  size?: "default" | "sm"
  className?: string
}

function parse24HourValue(value?: string) {
  if (!value) return null

  const [hourRaw, minuteRaw] = value.split(":")
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null
  }

  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12

  return {
    clockValue: `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    period,
  } as const
}

function to24HourValue(clockValue: string, period: "AM" | "PM") {
  const [hourRaw, minuteRaw] = clockValue.split(":")
  const hour12 = Number(hourRaw)
  const minute = Number(minuteRaw)

  if (
    Number.isNaN(hour12) ||
    Number.isNaN(minute) ||
    hour12 < 1 ||
    hour12 > 12 ||
    minute < 0 ||
    minute > 59
  ) {
    return clockValue
  }

  const normalizedHour =
    period === "AM"
      ? hour12 === 12
        ? 0
        : hour12
      : hour12 === 12
        ? 12
        : hour12 + 12

  return `${String(normalizedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

const TimeSelect = ({
  value,
  onValueChange,
  step = 15,
  placeholder = "Select time",
  disabled = false,
  size = "default",
  className,
}: TimeSelectProps) => {
  const options = React.useMemo(() => getTimeOptions(step), [step])
  const parsedValue = React.useMemo(() => parse24HourValue(value), [value])
  const selectedClockValue = parsedValue?.clockValue
  const selectedPeriod = parsedValue?.period

  return (
    <div className={cx("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2", className)}>
      <Select
        value={selectedClockValue}
        onValueChange={(nextClockValue) => {
          const nextValue = to24HourValue(
            nextClockValue,
            selectedPeriod || "AM",
          )
          onValueChange?.(nextValue)
        }}
        disabled={disabled}
      >
        <SelectTrigger size={size} className="flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[240px]">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <SegmentedControl
        fitContent
        size="sm"
        value={selectedPeriod || "AM"}
        disabled={disabled || !selectedClockValue}
        onChange={(period) => {
          if (!selectedClockValue) return
          onValueChange?.(to24HourValue(selectedClockValue, period))
        }}
        items={[
          { value: "AM", label: "AM" },
          { value: "PM", label: "PM" },
        ]}
      />
    </div>
  )
}

TimeSelect.displayName = "TimeSelect"

export { TimeSelect }

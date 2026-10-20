"use client"

import * as React from "react"

import { SegmentedControl } from "@/components/segmented-control"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type TimeOption = { value: string; label: string }
type Period = "AM" | "PM"

const timeOptionsCache = new Map<number, TimeOption[]>()

const getTimeOptions = (step: number) => {
  const normalizedStep = Math.max(1, Math.min(60, step))
  const cached = timeOptionsCache.get(normalizedStep)
  if (cached) return cached

  const options: TimeOption[] = []
  for (let hour = 1; hour <= 12; hour += 1) {
    for (let minute = 0; minute < 60; minute += normalizedStep) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      options.push({ value, label: value })
    }
  }

  timeOptionsCache.set(normalizedStep, options)
  return options
}

export interface TimeSelectProps {
  /** 24-hour value, e.g. "13:30" */
  value?: string
  /** Receives a 24-hour value, e.g. "13:30" */
  onValueChange?: (value: string) => void
  step?: number
  placeholder?: string
  disabled?: boolean
  /** Accepted for API compatibility; both sizes render at 28px like the legacy kit. */
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

  const period: Period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12

  return {
    clockValue: `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    period,
  }
}

function to24HourValue(clockValue: string, period: Period) {
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

function TimeSelect({
  value,
  onValueChange,
  step = 15,
  placeholder = "Select time",
  disabled = false,
  className,
}: TimeSelectProps) {
  const options = React.useMemo(() => getTimeOptions(step), [step])
  const parsedValue = React.useMemo(() => parse24HourValue(value), [value])
  const selectedClockValue = parsedValue?.clockValue
  const selectedPeriod = parsedValue?.period

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2",
        className,
      )}
    >
      <Select
        value={selectedClockValue}
        onValueChange={(nextClockValue) => {
          if (nextClockValue === null) return
          onValueChange?.(to24HourValue(nextClockValue, selectedPeriod || "AM"))
        }}
        disabled={disabled}
      >
        <SelectTrigger size="sm" className="w-full flex-1">
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

      <SegmentedControl<Period>
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

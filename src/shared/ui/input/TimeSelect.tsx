import { format } from "date-fns"
import React from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/input/Select"

type TimeOption = { value: string; label: string }

const timeOptionsCache = new Map<number, TimeOption[]>()

const getTimeOptions = (step: number) => {
  const normalizedStep = Math.max(1, Math.min(60, step))
  const cached = timeOptionsCache.get(normalizedStep)
  if (cached) return cached

  const options: TimeOption[] = []
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += normalizedStep) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      const label = format(new Date(2000, 0, 1, hour, minute), "hh:mm a")
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

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger size={size} className={className}>
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
  )
}

TimeSelect.displayName = "TimeSelect"

export { TimeSelect }

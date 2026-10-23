"use client"

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"

const optionsCache = new Map<number, string[]>()

/** 24-hour "HH:mm" values from 00:00, every `step` minutes. */
function getTimeOptions(step: number) {
  const normalizedStep = Math.max(1, Math.min(60, step))
  const cached = optionsCache.get(normalizedStep)
  if (cached) return cached

  const options: string[] = []
  for (let minutes = 0; minutes < 24 * 60; minutes += normalizedStep) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    options.push(
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    )
  }
  optionsCache.set(normalizedStep, options)
  return options
}

function normalize(value?: string) {
  if (!value) return undefined
  const [h, m] = value.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59)
    return undefined
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export interface TimeSelectProps {
  /** 24-hour value, e.g. "13:30" */
  value?: string
  /** Receives a 24-hour value, e.g. "13:30" */
  onValueChange?: (value: string) => void
  step?: number
  placeholder?: string
  disabled?: boolean
  /** Accepted for API compatibility. */
  size?: "default" | "sm"
  className?: string
}

function TimeSelect({
  value,
  onValueChange,
  step = 15,
  placeholder,
  disabled = false,
  className,
}: TimeSelectProps) {
  const t = useT("shell")
  const selected = normalize(value)
  const options = React.useMemo(() => {
    const base = getTimeOptions(step)
    // Keep an off-step saved value (e.g. 10:10) selectable and visible.
    return selected && !base.includes(selected)
      ? [...base, selected].sort()
      : base
  }, [step, selected])

  return (
    <Select
      value={selected ?? null}
      onValueChange={(next) => {
        if (next) onValueChange?.(next)
      }}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-full tabular-nums", className)}>
        <SelectValue placeholder={placeholder ?? t("timeSelectPlaceholder")} />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {options.map((option) => (
          <SelectItem key={option} value={option} className="tabular-nums">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

TimeSelect.displayName = "TimeSelect"

export { TimeSelect }

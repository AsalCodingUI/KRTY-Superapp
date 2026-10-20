"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RecurrencePattern } from "../types"

interface RecurrenceSelectorProps {
  value?: RecurrencePattern | null
  onChange: (pattern: RecurrencePattern | null) => void
  eventStart?: Date
}

export function RecurrenceSelector({
  value,
  onChange,
  eventStart,
}: RecurrenceSelectorProps) {
  const today = eventStart || new Date()
  const dayName = today.toLocaleDateString("id-ID", { weekday: "long" })
  const dayOfMonth = today.getDate()

  const handleChange = (val: string) => {
    if (val === "none") {
      onChange(null)
      return
    }

    const patterns: Record<string, RecurrencePattern> = {
      daily: {
        frequency: "DAILY",
        interval: 1,
      },
      weekly: {
        frequency: "WEEKLY",
        interval: 1,
        byWeekDay: [today.getDay()],
      },
      monthly: {
        frequency: "MONTHLY",
        interval: 1,
        byMonthDay: dayOfMonth,
      },
      yearly: {
        frequency: "YEARLY",
        interval: 1,
      },
    }

    onChange(patterns[val])
  }

  const getCurrentValue = () => {
    if (!value) return "none"

    if (value.frequency === "DAILY" && value.interval === 1) return "daily"
    if (value.frequency === "WEEKLY" && value.interval === 1) return "weekly"
    if (value.frequency === "MONTHLY" && value.interval === 1) return "monthly"
    if (value.frequency === "YEARLY" && value.interval === 1) return "yearly"

    return "custom"
  }

  return (
    <Select
      value={getCurrentValue()}
      onValueChange={(v) => v !== null && handleChange(v)}
    >
      <SelectTrigger size="sm" className="w-full">
        <SelectValue placeholder="Tidak berulang" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Tidak berulang</SelectItem>
        <SelectItem value="daily">Harian</SelectItem>
        <SelectItem value="weekly">Mingguan pada {dayName}</SelectItem>
        <SelectItem value="monthly">
          Bulanan pada tanggal {dayOfMonth}
        </SelectItem>
        <SelectItem value="yearly">Tahunan</SelectItem>
        {value && getCurrentValue() === "custom" && (
          <SelectItem value="custom">Kustom</SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}

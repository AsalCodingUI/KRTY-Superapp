"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format } from "date-fns"
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
  const t = useT("calendar")
  const dateLocale = useDateLocale()
  const today = eventStart || new Date()
  const dayName = format(today, "EEEE", { locale: dateLocale })
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
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("recurrenceNone")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{t("recurrenceNone")}</SelectItem>
        <SelectItem value="daily">{t("recurrenceDaily")}</SelectItem>
        <SelectItem value="weekly">
          {t("recurrenceWeekly", { day: dayName })}
        </SelectItem>
        <SelectItem value="monthly">
          {t("recurrenceMonthly", { day: dayOfMonth })}
        </SelectItem>
        <SelectItem value="yearly">{t("recurrenceYearly")}</SelectItem>
        {value && getCurrentValue() === "custom" && (
          <SelectItem value="custom">{t("recurrenceCustom")}</SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}

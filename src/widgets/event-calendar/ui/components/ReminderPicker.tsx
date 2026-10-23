"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useT } from "@/shared/i18n/client"
import { RiAddLine, RiCloseLine } from "@/shared/ui/lucide-icons"
import { useState } from "react"
import type { Reminder } from "../types"

interface ReminderPickerProps {
  value: Reminder[]
  onChange: (reminders: Reminder[]) => void
  disabled?: boolean
}

/** Preset offsets in minutes; labels are built per unit at render. */
const PRESET_REMINDERS = [5, 10, 15, 30, 60, 120, 1440, 2880].map(
  (minutes) => ({ minutes }),
)

export function ReminderPicker({
  value,
  onChange,
  disabled,
}: ReminderPickerProps) {
  const t = useT("calendar")
  const tc = useT("common")
  const [selectedMinutes, setSelectedMinutes] = useState<string>("10")

  const minutesLabel = (count: number) =>
    t(count === 1 ? "reminderMinutesOne" : "reminderMinutesOther", { count })

  /** Presets read in their natural unit ("1 hour before"). */
  const presetLabel = (minutes: number) => {
    if (minutes % 1440 === 0) {
      const count = minutes / 1440
      return t(count === 1 ? "reminderDaysOne" : "reminderDaysOther", {
        count,
      })
    }
    if (minutes % 60 === 0) {
      const count = minutes / 60
      return t(count === 1 ? "reminderHoursOne" : "reminderHoursOther", {
        count,
      })
    }
    return minutesLabel(minutes)
  }

  const handleAdd = () => {
    const minutes = parseInt(selectedMinutes)
    if (!value.some((r) => r.minutes === minutes)) {
      onChange([...value, { minutes }])
    }
  }

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const getReminderLabel = (minutes: number) => {
    const preset = PRESET_REMINDERS.find((p) => p.minutes === minutes)
    return preset ? presetLabel(preset.minutes) : minutesLabel(minutes)
  }

  return (
    <div className="space-y-3">
      {/* Existing reminders */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((reminder, index) => (
            <div
              key={index}
              className="bg-muted/50 bg-foreground/[0.03] flex items-center justify-between rounded-md p-2"
            >
              <span className="text-foreground text-sm">
                🔔 {getReminderLabel(reminder.minutes)}
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="h-6 w-6 p-0"
              >
                <RiCloseLine className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add reminder */}
      <div className="flex gap-2">
        <Select
          value={selectedMinutes}
          onValueChange={(v) => v !== null && setSelectedMinutes(v)}
          disabled={disabled}
        >
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESET_REMINDERS.map((preset) => (
              <SelectItem
                key={preset.minutes}
                value={preset.minutes.toString()}
              >
                {presetLabel(preset.minutes)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={disabled}
        >
          <RiAddLine className="mr-1 h-4 w-4" />
          {tc("add")}
        </Button>
      </div>

      {value.length === 0 && (
        <p className="text-tertiary-foreground text-xs">{t("reminderEmpty")}</p>
      )}
    </div>
  )
}

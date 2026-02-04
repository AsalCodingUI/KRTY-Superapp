"use client"

import { Button } from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"
import { RiAddLine, RiCloseLine } from "@remixicon/react"
import { useState } from "react"
import type { Reminder } from "../types"

interface ReminderPickerProps {
  value: Reminder[]
  onChange: (reminders: Reminder[]) => void
  disabled?: boolean
}

const PRESET_REMINDERS = [
  { label: "5 minutes before", minutes: 5 },
  { label: "10 minutes before", minutes: 10 },
  { label: "15 minutes before", minutes: 15 },
  { label: "30 minutes before", minutes: 30 },
  { label: "1 hour before", minutes: 60 },
  { label: "2 hours before", minutes: 120 },
  { label: "1 day before", minutes: 1440 },
  { label: "2 days before", minutes: 2880 },
]

export function ReminderPicker({
  value,
  onChange,
  disabled,
}: ReminderPickerProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<string>("10")

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
    return preset?.label || `${minutes} minutes before`
  }

  return (
    <div className="space-y-3">
      {/* Existing reminders */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((reminder, index) => (
            <div
              key={index}
              className="bg-muted/50 border-border-border flex items-center justify-between rounded-md border p-2"
            >
              <span className="text-body-sm text-content">
                🔔 {getReminderLabel(reminder.minutes)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
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
          onValueChange={setSelectedMinutes}
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
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
        >
          <RiAddLine className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      {value.length === 0 && (
        <p className="text-body-xs text-content-muted">No reminders set</p>
      )}
    </div>
  )
}

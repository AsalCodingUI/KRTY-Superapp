"use client"

import { DatePicker } from "@/components/date-picker"
import { useT } from "@/shared/i18n/client"
import { format, parseISO } from "date-fns"

/**
 * The app's date picker for forms that keep dates as "yyyy-MM-dd" strings —
 * a drop-in for <input type="date"> (never the browser's own calendar).
 */
export function DateField({
  value,
  onChange,
  id,
  placeholder,
  disabled,
  required,
  min,
  max,
  className,
  ...aria
}: {
  value: string | null | undefined
  onChange: (value: string) => void
  id?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  /** "yyyy-MM-dd" bounds, like the native input's min / max. */
  min?: string
  max?: string
  className?: string
  "aria-label"?: string
  "aria-invalid"?: boolean
}) {
  const tc = useT("common")
  return (
    <DatePicker
      id={id}
      className={className}
      disabled={disabled}
      required={required}
      placeholder={placeholder ?? tc("pickDate")}
      value={value ? parseISO(value) : undefined}
      onChange={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
      fromDate={min ? parseISO(min) : undefined}
      toDate={max ? parseISO(max) : undefined}
      aria-label={aria["aria-label"]}
      aria-invalid={aria["aria-invalid"]}
    />
  )
}

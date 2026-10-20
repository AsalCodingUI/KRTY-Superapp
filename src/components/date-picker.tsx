"use client"

import * as React from "react"
import { format, type Locale } from "date-fns"
import { enUS } from "date-fns/locale"
import { MinusIcon } from "lucide-react"
import { CalendarDays as CalendarIcon } from "@/components/icons"
import type { Matcher } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// ============================================================================
// Types
// ============================================================================

type InputSize = "sm" | "default"

type DateRange = {
  from: Date | undefined
  to?: Date | undefined
}

interface Preset {
  label: string
}

interface DatePreset extends Preset {
  date: Date
}

interface DateRangePreset extends Preset {
  dateRange: DateRange
}

type CalendarBoundsProps = {
  fromYear?: number
  toYear?: number
  fromMonth?: Date
  toMonth?: Date
  fromDay?: Date
  toDay?: Date
  fromDate?: Date
  toDate?: Date
  locale?: Locale
}

type Translations = {
  cancel?: string
  apply?: string
  start?: string
  end?: string
  range?: string
}

interface PickerProps extends CalendarBoundsProps {
  className?: string
  disabled?: boolean
  disabledDays?: Matcher | Matcher[] | undefined
  required?: boolean
  showTimePicker?: boolean
  placeholder?: string
  /** Both sizes render at 28px (legacy density). */
  inputSize?: InputSize
  enableYearNavigation?: boolean
  disableNavigation?: boolean
  hasError?: boolean
  id?: string
  translations?: Translations
  align?: "center" | "end" | "start"
  "aria-invalid"?: boolean
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-required"?: boolean
}

type CalendarLocale = React.ComponentProps<typeof Calendar>["locale"]

// ============================================================================
// Helpers
// ============================================================================

const isBrowserLocaleClockType24h = () => {
  const language =
    typeof window !== "undefined" ? window.navigator.language : "en-US"
  const hr = new Intl.DateTimeFormat(language, { hour: "numeric" }).format()
  return Number.isInteger(Number(hr))
}

const formatDate = (date: Date, locale: Locale, includeTime?: boolean) => {
  if (!includeTime) return format(date, "dd MMM, yyyy", { locale })
  return isBrowserLocaleClockType24h()
    ? format(date, "dd MMM, yyyy HH:mm", { locale })
    : format(date, "dd MMM, yyyy h:mm a", { locale })
}

const toTimeString = (date: Date | undefined) =>
  date
    ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    : "00:00"

const applyTime = (date: Date, time: string) => {
  const [h, m] = time.split(":").map(Number)
  const next = new Date(date.getTime())
  next.setHours(Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m, 0, 0)
  return next
}

const isSameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear()

/**
 * Maps the legacy (react-day-picker v8) bound props onto v10's
 * `startMonth` / `endMonth` + `disabled` matchers.
 */
function useCalendarBounds(
  {
    fromYear,
    toYear,
    fromMonth,
    toMonth,
    fromDay,
    toDay,
    fromDate,
    toDate,
  }: CalendarBoundsProps,
  disabledDays: Matcher | Matcher[] | undefined,
) {
  return React.useMemo(() => {
    const minDay = fromDate ?? fromDay
    const maxDay = toDate ?? toDay

    const startMonth =
      fromMonth ??
      minDay ??
      (fromYear !== undefined ? new Date(fromYear, 0, 1) : undefined)
    const endMonth =
      toMonth ??
      maxDay ??
      (toYear !== undefined ? new Date(toYear, 11, 31) : undefined)

    const matchers: Matcher[] = []
    if (disabledDays !== undefined) {
      if (Array.isArray(disabledDays)) matchers.push(...disabledDays)
      else matchers.push(disabledDays)
    }
    if (minDay) matchers.push({ before: minDay })
    if (maxDay) matchers.push({ after: maxDay })

    return {
      startMonth,
      endMonth,
      disabled: matchers.length ? matchers : undefined,
    }
  }, [
    fromYear,
    toYear,
    fromMonth,
    toMonth,
    fromDay,
    toDay,
    fromDate,
    toDate,
    disabledDays,
  ])
}

// ============================================================================
// Trigger
// ============================================================================

interface TriggerProps extends React.ComponentProps<typeof Button> {
  placeholder?: string
  hasError?: boolean
}

const Trigger = ({
  className,
  children,
  placeholder,
  hasError,
  disabled,
  ...props
}: TriggerProps) => (
  <PopoverTrigger
    render={
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        aria-invalid={hasError || props["aria-invalid"] || undefined}
        className={cn(
          "group/date-picker text-body-sm w-full justify-start gap-1.5 px-2 text-left font-normal",
          className,
        )}
        {...props}
      />
    }
  >
    <CalendarIcon
      data-icon="inline-start"
      className={cn(
        "size-4 shrink-0",
        hasError ? "text-destructive" : "text-muted-foreground",
      )}
      aria-hidden="true"
    />
    <span className="flex-1 truncate">
      {children ?? (
        <span className="text-muted-foreground/70">{placeholder}</span>
      )}
    </span>
  </PopoverTrigger>
)

const contentClassName =
  "w-auto max-h-[85vh] max-w-[95vw] gap-0 overflow-y-auto overscroll-y-contain rounded-xl p-0 text-body-sm"

// ============================================================================
// Presets
// ============================================================================

type PresetContainerProps<TPreset extends Preset, TValue> = {
  presets: TPreset[]
  onSelect: (value: TValue) => void
  currentValue?: TValue
}

const PresetContainer = <TPreset extends Preset, TValue>({
  presets,
  onSelect,
  currentValue,
}: PresetContainerProps<TPreset, TValue>) => {
  const isRangePreset = (p: TPreset): p is TPreset & DateRangePreset =>
    "dateRange" in p
  const isDatePreset = (p: TPreset): p is TPreset & DatePreset => "date" in p

  const matchesCurrent = (preset: TPreset) => {
    if (isRangePreset(preset)) {
      const value = currentValue as DateRange | undefined
      return Boolean(
        value?.from &&
        value.to &&
        preset.dateRange.from &&
        preset.dateRange.to &&
        isSameDay(value.from, preset.dateRange.from) &&
        isSameDay(value.to, preset.dateRange.to),
      )
    }
    if (isDatePreset(preset)) {
      const value = currentValue as Date | undefined
      return Boolean(value && isSameDay(value, preset.date))
    }
    return false
  }

  return (
    <ul className="flex items-start gap-x-2 sm:flex-col">
      {presets.map((preset, index) => (
        <li key={index} className="sm:w-full sm:py-px">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title={preset.label}
            data-active={matchesCurrent(preset) || undefined}
            aria-label={`Select ${preset.label}`}
            className="border-border text-body-sm text-muted-foreground data-active:bg-muted data-active:text-foreground w-full justify-start truncate border font-normal sm:border-none"
            onClick={() => {
              if (isRangePreset(preset)) onSelect(preset.dateRange as TValue)
              else if (isDatePreset(preset)) onSelect(preset.date as TValue)
            }}
          >
            {preset.label}
          </Button>
        </li>
      ))}
    </ul>
  )
}

function PresetPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border relative flex h-14 w-full items-center overflow-auto border-b sm:h-auto sm:w-40 sm:items-start sm:self-stretch sm:border-r sm:border-b-0">
      <div className="px-2 sm:w-full sm:py-2">{children}</div>
    </div>
  )
}

function TimeField({
  value,
  onChange,
  disabled,
  required,
  "aria-label": ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  "aria-label": string
}) {
  return (
    <Input
      type="time"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      required={required}
      aria-label={ariaLabel}
      className="text-body-sm h-7 tabular-nums"
    />
  )
}

// ============================================================================
// Single Date Picker
// ============================================================================

interface SingleDatePickerProps extends Omit<PickerProps, "translations"> {
  presets?: DatePreset[]
  defaultValue?: Date
  value?: Date
  onChange?: (date: Date | undefined) => void
  translations?: Omit<Translations, "range">
}

/**
 * Single date picker with optional presets and time input.
 * Changes are committed with "Apply"; "Cancel"/closing reverts.
 *
 * @example
 * <DatePicker value={date} onChange={setDate} />
 */
const SingleDatePicker = ({
  defaultValue,
  value,
  onChange,
  presets,
  disabled,
  disabledDays,
  disableNavigation,
  className,
  showTimePicker,
  placeholder = "Select date",
  hasError,
  translations,
  enableYearNavigation = false,
  locale = enUS,
  align = "center",
  required,
  id,
  inputSize: _inputSize,
  ...rest
}: SingleDatePickerProps) => {
  const {
    fromYear,
    toYear,
    fromMonth,
    toMonth,
    fromDay,
    toDay,
    fromDate,
    toDate,
    ...aria
  } = rest
  const bounds = useCalendarBounds(
    { fromYear, toYear, fromMonth, toMonth, fromDay, toDay, fromDate, toDate },
    disabledDays,
  )

  const committed = value ?? defaultValue
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(committed)
  const [month, setMonth] = React.useState<Date | undefined>(committed)
  const [time, setTime] = React.useState<string>(toTimeString(committed))

  // Sync draft with the controlled/default value (by timestamp, so call
  // sites that create a new Date every render don't reset the draft)
  const committedKey = committed?.getTime()
  React.useEffect(() => {
    const next = committedKey !== undefined ? new Date(committedKey) : undefined
    setDate(next)
    setTime(toTimeString(next))
    if (next) setMonth(next)
  }, [committedKey])

  const reset = () => {
    setDate(committed)
    setTime(toTimeString(committed))
    setMonth(committed)
  }

  const onOpenChange = (next: boolean) => {
    if (!next) reset()
    setOpen(next)
  }

  const onDateChange = (next: Date | undefined) => {
    setDate(next && showTimePicker ? applyTime(next, time) : next)
  }

  const onTimeChange = (next: string) => {
    setTime(next)
    if (date) setDate(applyTime(date, next || "00:00"))
  }

  const formattedDate = React.useMemo(
    () => (committed ? formatDate(committed, locale, showTimePicker) : null),
    [committed, locale, showTimePicker],
  )

  const onApply = () => {
    setOpen(false)
    onChange?.(date)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Trigger
        id={id}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        hasError={hasError}
        aria-required={required || aria["aria-required"]}
        aria-invalid={aria["aria-invalid"]}
        aria-label={aria["aria-label"]}
        aria-labelledby={aria["aria-labelledby"]}
      >
        {formattedDate}
      </Trigger>
      <PopoverContent
        align={align}
        sideOffset={10}
        initialFocus={false}
        className={contentClassName}
      >
        <div className="flex flex-col sm:flex-row sm:items-start">
          {presets && presets.length > 0 && (
            <PresetPanel>
              <PresetContainer
                currentValue={date}
                presets={presets}
                onSelect={onDateChange}
              />
            </PresetPanel>
          )}
          <div>
            <Calendar
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={date}
              onSelect={onDateChange}
              required={false}
              locale={locale as CalendarLocale}
              captionLayout={enableYearNavigation ? "dropdown" : "label"}
              disableNavigation={disableNavigation}
              startMonth={bounds.startMonth}
              endMonth={bounds.endMonth}
              disabled={bounds.disabled}
              autoFocus
              className="bg-transparent"
            />
            {showTimePicker && (
              <div className="border-border border-t p-3">
                <TimeField
                  aria-label="Time"
                  value={time}
                  onChange={onTimeChange}
                  disabled={!date}
                  required={required}
                />
              </div>
            )}
            <div className="border-border flex items-center gap-x-2 border-t p-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                {translations?.cancel ?? "Cancel"}
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={onApply}
              >
                {translations?.apply ?? "Apply"}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

SingleDatePicker.displayName = "SingleDatePicker"

// ============================================================================
// Range Date Picker
// ============================================================================

interface DateRangePickerProps extends PickerProps {
  presets?: DateRangePreset[]
  defaultValue?: DateRange
  value?: DateRange
  /** Called with the range when "Apply" is pressed. */
  onChange?: (dateRange: DateRange | undefined) => void
  /**
   * Called on every calendar selection. When used without `onChange`
   * the picker works in "instant" mode (no Apply/Cancel footer), matching the
   * legacy `input/DateRangePicker` component.
   */
  onValueChange?: (dateRange: DateRange | undefined) => void
}

const RangeDatePicker = ({
  defaultValue,
  value,
  onChange,
  onValueChange,
  presets,
  disabled,
  disableNavigation,
  disabledDays,
  enableYearNavigation = false,
  locale = enUS,
  showTimePicker,
  placeholder = "Select date range",
  hasError,
  translations,
  align = "center",
  className,
  required,
  id,
  inputSize: _inputSize,
  ...rest
}: DateRangePickerProps) => {
  const {
    fromYear,
    toYear,
    fromMonth,
    toMonth,
    fromDay,
    toDay,
    fromDate,
    toDate,
    ...aria
  } = rest
  const bounds = useCalendarBounds(
    { fromYear, toYear, fromMonth, toMonth, fromDay, toDay, fromDate, toDate },
    disabledDays,
  )

  const instant = Boolean(onValueChange) && !onChange && !showTimePicker

  const committed = value ?? defaultValue
  const committedFrom = committed?.from
  const committedTo = committed?.to

  const [open, setOpen] = React.useState(false)
  const [range, setRange] = React.useState<DateRange | undefined>(committed)
  const [month, setMonth] = React.useState<Date | undefined>(committedFrom)
  const [startTime, setStartTime] = React.useState(toTimeString(committedFrom))
  const [endTime, setEndTime] = React.useState(toTimeString(committedTo))

  // Sync draft with the controlled/default value (by date identity, so that
  // inline object literals like `value={{ from, to }}` don't reset the draft)
  const fromKey = committedFrom?.getTime()
  const toKey = committedTo?.getTime()
  React.useEffect(() => {
    const from = fromKey !== undefined ? new Date(fromKey) : undefined
    const to = toKey !== undefined ? new Date(toKey) : undefined
    setRange(from || to ? { from, to } : undefined)
    setStartTime(toTimeString(from))
    setEndTime(toTimeString(to))
    if (from) setMonth(from)
  }, [fromKey, toKey])

  const reset = () => {
    setRange(committed)
    setStartTime(toTimeString(committedFrom))
    setEndTime(toTimeString(committedTo))
    setMonth(committedFrom)
  }

  const onOpenChange = (next: boolean) => {
    if (!next && !instant) reset()
    setOpen(next)
  }

  const onRangeChange = (next: DateRange | undefined) => {
    let nextRange = next
    if (nextRange && showTimePicker) {
      nextRange = {
        from: nextRange.from ? applyTime(nextRange.from, startTime) : undefined,
        to: nextRange.to ? applyTime(nextRange.to, endTime) : undefined,
      }
    }
    setRange(nextRange)
    if (instant) onValueChange?.(nextRange)
  }

  const onTimeChange = (time: string, pos: "start" | "end") => {
    const normalized = time || "00:00"
    if (pos === "start") {
      setStartTime(time)
      if (range?.from)
        setRange({ ...range, from: applyTime(range.from, normalized) })
    } else {
      setEndTime(time)
      if (range?.to) setRange({ ...range, to: applyTime(range.to, normalized) })
    }
  }

  const formatRange = (r: DateRange | undefined) => {
    if (!r?.from && !r?.to) return null
    if (instant) {
      if (!r.from) return null
      return r.to
        ? `${format(r.from, "LLL dd, y")} - ${format(r.to, "LLL dd, y")}`
        : format(r.from, "LLL dd, y")
    }
    return `${r.from ? formatDate(r.from, locale, showTimePicker) : ""} - ${
      r.to ? formatDate(r.to, locale, showTimePicker) : ""
    }`
  }

  const triggerLabel = formatRange(instant ? range : committed)
  const draftLabel = formatRange(range)

  const onApply = () => {
    setOpen(false)
    onChange?.(range)
    onValueChange?.(range)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Trigger
        id={id}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        hasError={hasError}
        aria-required={required || aria["aria-required"]}
        aria-invalid={aria["aria-invalid"]}
        aria-label={aria["aria-label"]}
        aria-labelledby={aria["aria-labelledby"]}
      >
        {triggerLabel}
      </Trigger>
      <PopoverContent
        align={align}
        sideOffset={instant ? 8 : 10}
        initialFocus={false}
        className={contentClassName}
      >
        <div className="flex flex-col overflow-x-auto sm:flex-row sm:items-start">
          {presets && presets.length > 0 && (
            <PresetPanel>
              <PresetContainer
                currentValue={range}
                presets={presets}
                onSelect={onRangeChange}
              />
            </PresetPanel>
          )}
          <div className="overflow-x-auto">
            <Calendar
              mode="range"
              selected={range}
              onSelect={onRangeChange}
              required={false}
              month={month}
              onMonthChange={setMonth}
              numberOfMonths={2}
              locale={locale as CalendarLocale}
              captionLayout={enableYearNavigation ? "dropdown" : "label"}
              disableNavigation={disableNavigation}
              startMonth={bounds.startMonth}
              endMonth={bounds.endMonth}
              disabled={bounds.disabled}
              autoFocus
              className="bg-transparent"
              classNames={{ months: "relative flex flex-row gap-4" }}
            />
            {showTimePicker && (
              <div className="border-border flex items-center justify-evenly gap-x-3 border-t p-3">
                <div className="flex flex-1 items-center gap-x-2">
                  <span className="text-muted-foreground">
                    {translations?.start ?? "Start"}:
                  </span>
                  <TimeField
                    aria-label="Start date time"
                    value={startTime}
                    onChange={(v) => onTimeChange(v, "start")}
                    disabled={!range?.from}
                    required={required}
                  />
                </div>
                <MinusIcon className="text-muted-foreground/70 size-4 shrink-0" />
                <div className="flex flex-1 items-center gap-x-2">
                  <span className="text-muted-foreground">
                    {translations?.end ?? "End"}:
                  </span>
                  <TimeField
                    aria-label="End date time"
                    value={endTime}
                    onChange={(v) => onTimeChange(v, "end")}
                    disabled={!range?.to}
                    required={required}
                  />
                </div>
              </div>
            )}
            {!instant && (
              <div className="border-border border-t p-3 sm:flex sm:items-center sm:justify-between">
                <p className="text-foreground tabular-nums">
                  <span className="text-muted-foreground">
                    {translations?.range ?? "Range"}:
                  </span>{" "}
                  <span className="font-medium">{draftLabel}</span>
                </p>
                <div className="mt-2 flex items-center gap-x-2 sm:mt-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => onOpenChange(false)}
                  >
                    {translations?.cancel ?? "Cancel"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={onApply}
                  >
                    {translations?.apply ?? "Apply"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// Preset validation (same rules as the legacy picker)
// ============================================================================

const validatePresets = (
  presets: DateRangePreset[] | DatePreset[],
  rules: PickerProps,
) => {
  const { toYear, fromYear, fromMonth, toMonth, fromDay, toDay } = rules
  if (!presets || presets.length === 0) return

  presets.forEach((preset) => {
    if ("date" in preset) {
      const presetYear = preset.date.getFullYear()
      if (fromYear && presetYear < fromYear)
        throw new Error(
          `Preset ${preset.label} is before fromYear ${fromYear}.`,
        )
      if (toYear && presetYear > toYear)
        throw new Error(`Preset ${preset.label} is after toYear ${toYear}.`)
      if (fromMonth && preset.date.getMonth() < fromMonth.getMonth())
        throw new Error(
          `Preset ${preset.label} is before fromMonth ${fromMonth}.`,
        )
      if (toMonth && preset.date.getMonth() > toMonth.getMonth())
        throw new Error(`Preset ${preset.label} is after toMonth ${toMonth}.`)
      if (fromDay && preset.date.getDate() < fromDay.getDate())
        throw new Error(`Preset ${preset.label} is before fromDay ${fromDay}.`)
      if (toDay && preset.date.getDate() > toDay.getDate())
        throw new Error(
          `Preset ${preset.label} is after toDay ${format(toDay, "MMM dd, yyyy")}.`,
        )
    }

    if ("dateRange" in preset) {
      const presetFromYear = preset.dateRange.from?.getFullYear()
      const presetToYear = preset.dateRange.to?.getFullYear()
      if (presetFromYear && fromYear && presetFromYear < fromYear)
        throw new Error(
          `Preset ${preset.label}'s 'from' is before fromYear ${fromYear}.`,
        )
      if (presetToYear && toYear && presetToYear > toYear)
        throw new Error(
          `Preset ${preset.label}'s 'to' is after toYear ${toYear}.`,
        )
      if (fromMonth) {
        const m = preset.dateRange.from?.getMonth()
        if (m && m < fromMonth.getMonth())
          throw new Error(
            `Preset ${preset.label}'s 'from' is before fromMonth ${format(fromMonth, "MMM, yyyy")}.`,
          )
      }
      if (toMonth) {
        const m = preset.dateRange.to?.getMonth()
        if (m && m > toMonth.getMonth())
          throw new Error(
            `Preset ${preset.label}'s 'to' is after toMonth ${format(toMonth, "MMM, yyyy")}.`,
          )
      }
      if (fromDay) {
        const d = preset.dateRange.from?.getDate()
        if (d && d < fromDay.getDate())
          throw new Error(
            `Preset ${preset.dateRange.from}'s 'from' is before fromDay ${format(fromDay, "MMM dd, yyyy")}.`,
          )
      }
      if (toDay) {
        const d = preset.dateRange.to?.getDate()
        if (d && d > toDay.getDate())
          throw new Error(
            `Preset ${preset.label}'s 'to' is after toDay ${format(toDay, "MMM dd, yyyy")}.`,
          )
      }
    }
  })
}

// ============================================================================
// Public components
// ============================================================================

type DatePickerProps = {
  presets?: DatePreset[]
  defaultValue?: Date
  value?: Date
  onChange?: (date: Date | undefined) => void
} & PickerProps

const DatePicker = ({ presets, ...props }: DatePickerProps) => {
  if (presets) validatePresets(presets, props)
  return (
    <SingleDatePicker presets={presets} {...(props as SingleDatePickerProps)} />
  )
}

DatePicker.displayName = "DatePicker"

const DateRangePicker = ({ presets, ...props }: DateRangePickerProps) => {
  if (presets) validatePresets(presets, props)
  return <RangeDatePicker presets={presets} {...props} />
}

DateRangePicker.displayName = "DateRangePicker"

export {
  DatePicker,
  DateRangePicker,
  SingleDatePicker,
  type DatePickerProps,
  type DatePreset,
  type DateRange,
  type DateRangePickerProps,
  type DateRangePreset,
}

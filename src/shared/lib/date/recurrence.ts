import type {
  RecurrenceFrequency,
  RecurrencePattern,
} from "@/widgets/event-calendar"
import { Frequency, RRule, type Options } from "rrule"

/**
 * Convert RecurrencePattern to RRULE string
 */
export function patternToRRule(pattern: RecurrencePattern): string {
  const frequencyMap: Record<RecurrenceFrequency, Frequency> = {
    DAILY: RRule.DAILY,
    WEEKLY: RRule.WEEKLY,
    MONTHLY: RRule.MONTHLY,
    YEARLY: RRule.YEARLY,
  }

  const options: Partial<Options> = {
    freq: frequencyMap[pattern.frequency],
    interval: pattern.interval,
  }

  if (pattern.byWeekDay) {
    options.byweekday = pattern.byWeekDay
  }

  if (pattern.byMonthDay) {
    options.bymonthday = pattern.byMonthDay
  }

  if (pattern.count) {
    options.count = pattern.count
  }

  if (pattern.until) {
    options.until = pattern.until
  }

  const rule = new RRule(options)
  return rule.toString()
}

/**
 * Parse RRULE string to RecurrencePattern
 */
export function rruleToPattern(rruleString: string): RecurrencePattern | null {
  try {
    const rule = RRule.fromString(rruleString)
    const options = rule.options

    const frequencyMap: Partial<Record<Frequency, RecurrenceFrequency>> = {
      [RRule.DAILY]: "DAILY",
      [RRule.WEEKLY]: "WEEKLY",
      [RRule.MONTHLY]: "MONTHLY",
      [RRule.YEARLY]: "YEARLY",
    }

    const freq = frequencyMap[options.freq]
    if (!freq) return null

    return {
      frequency: freq,
      interval: options.interval,
      byWeekDay: Array.isArray(options.byweekday)
        ? (options.byweekday as number[])
        : undefined,
      byMonthDay: Array.isArray(options.bymonthday)
        ? (options.bymonthday as number[])[0]
        : (options.bymonthday as number | undefined),
      count: options.count || undefined,
      until: options.until || undefined,
    }
  } catch (error) {
    console.error("Failed to parse RRULE:", error)
    return null
  }
}

/**
 * Generate occurrences for a recurring event within a date range
 */
export function generateOccurrences<
  T extends {
    id: string
    recurrenceRule: string
    start: Date
    end: Date
  },
>(event: T, rangeStart: Date, rangeEnd: Date): Array<T> {
  try {
    const rule = RRule.fromString(event.recurrenceRule)
    const duration = event.end.getTime() - event.start.getTime()

    const occurrences = rule.between(rangeStart, rangeEnd, true)

    return occurrences.map((occurrenceStart) => {
      const occurrenceEnd = new Date(occurrenceStart.getTime() + duration)

      return {
        ...event,
        id: `${event.id}-${occurrenceStart.toISOString()}`,
        start: occurrenceStart,
        end: occurrenceEnd,
        recurrenceId: occurrenceStart.toISOString(),
        parentEventId: event.id,
      }
    })
  } catch (error) {
    console.error("Failed to generate occurrences:", error)
    return []
  }
}

/**
 * Get human-readable description of recurrence pattern
 */
export function getRecurrenceDescription(rruleString: string): string {
  try {
    const rule = RRule.fromString(rruleString)
    return rule.toText()
  } catch (error) {
    return "Custom recurrence"
  }
}

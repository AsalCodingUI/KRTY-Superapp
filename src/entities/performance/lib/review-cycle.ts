/**
 * A 360 review cycle's state, from the dates the admin set (WIB): one
 * helper for the server (who may submit) and every screen (what to show).
 *
 *   scheduled  active, not started yet
 *   running    active, today is inside the window
 *   ended      active, past the closing date
 *   closed     closed by an admin (is_active = false)
 */

export type CycleStatus = "scheduled" | "running" | "ended" | "closed"

type CycleDates = {
  is_active: boolean | null
  start_date: string
  end_date: string
}

export function cycleStatus(
  cycle: CycleDates,
  now: Date = new Date(),
): CycleStatus {
  if (cycle.is_active !== true) return "closed"
  const t = now.getTime()
  if (t < new Date(cycle.start_date).getTime()) return "scheduled"
  if (t > new Date(cycle.end_date).getTime()) return "ended"
  return "running"
}

const DAY_MS = 86_400_000

/** Whole days until the closing date (0 on the last day), WIB calendar. */
export function daysLeft(endDate: string, now: Date = new Date()) {
  const wib = (d: Date) => Math.floor((d.getTime() + 7 * 3_600_000) / DAY_MS)
  return Math.max(0, wib(new Date(endDate)) - wib(now))
}

/** First and last day ("yyyy-MM-dd") of a calendar quarter like "2026-Q4". */
export function quarterBounds(quarter: string) {
  const [year, q] = quarter.split("-Q").map(Number)
  const pad = (n: number) => String(n).padStart(2, "0")
  const lastDay = new Date(Date.UTC(year, q * 3, 0)).getUTCDate()
  return {
    start: `${year}-${pad((q - 1) * 3 + 1)}-01`,
    end: `${year}-${pad(q * 3)}-${pad(lastDay)}`,
  }
}

/**
 * Days a cycle may run past its quarter: reopened for whoever hasn't
 * reviewed yet, e.g. a Q4 cycle reopened in early January.
 */
export const REOPEN_GRACE_DAYS = 31

/** The latest closing day ("yyyy-MM-dd") a quarter's cycle may have. */
export function latestCloseDay(quarter: string) {
  const end = new Date(`${quarterBounds(quarter).end}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() + REOPEN_GRACE_DAYS)
  return end.toISOString().slice(0, 10)
}

/** A day ("yyyy-MM-dd") as the cycle's opening / closing moment in WIB. */
export const cycleStart = (day: string) => `${day}T00:00:00+07:00`
export const cycleEnd = (day: string) => `${day}T23:59:59+07:00`

/** The WIB calendar day ("yyyy-MM-dd") of a timestamp. */
export function wibDay(iso: string | Date) {
  const d = new Date(new Date(iso).getTime() + 7 * 3_600_000)
  return d.toISOString().slice(0, 10)
}

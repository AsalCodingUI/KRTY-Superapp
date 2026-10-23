import type { MessageKey } from "@/shared/i18n/messages"

export const ATTENDANCE_NOTE_TAGS = {
  deleteRequested: "DELETE_REQUESTED",
  staleSessionResolved: "STALE_SESSION_RESOLVED",
  adminClosedSession: "ADMIN_CLOSED_SESSION",
  adminEditedSession: "ADMIN_EDITED_SESSION",
  /** Closed by the auto clock-out job (migrations/add_auto_clock_out.sql). */
  autoClockOut: "AUTO_CLOCK_OUT",
} as const

export function getAttendanceNoteTags(
  notes: string | null | undefined,
): string[] {
  if (!notes) return []

  return notes
    .split("|")
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function hasAttendanceNote(
  notes: string | null | undefined,
  tag: string,
): boolean {
  return getAttendanceNoteTags(notes).includes(tag)
}

export function mergeAttendanceNote(
  notes: string | null | undefined,
  tag: string,
): string {
  const tags = new Set(getAttendanceNoteTags(notes))
  tags.add(tag)
  return Array.from(tags).join("|")
}

export function removeAttendanceNote(
  notes: string | null | undefined,
  tag: string,
): string | null {
  const tags = getAttendanceNoteTags(notes).filter((t) => t !== tag)
  return tags.length ? tags.join("|") : null
}

/** Stored attendance statuses → "leave" message keys (translate at render). */
export const ATTENDANCE_STATUS_LABEL_KEYS: Record<
  string,
  MessageKey<"leave">
> = {
  Present: "statusPresent",
  Lembur: "statusOvertime",
  "Cuti Masuk": "statusLeaveCheckIn",
}

/** Translated label for a stored attendance status (unknown ones pass through). */
export function attendanceStatusLabel(
  status: string,
  t: (key: MessageKey<"leave">) => string,
) {
  const key = ATTENDANCE_STATUS_LABEL_KEYS[status]
  return key ? t(key) : status
}

type WorkedLog = {
  clock_in: string
  clock_out: string | null
  break_total: number | null
  is_break?: boolean | null
  break_start?: string | null
}

/** Worked time of a session in ms: clock-in to clock-out (or now), minus breaks. */
export function workedMs(log: WorkedLog, now: Date = new Date()): number {
  const end = log.clock_out ? new Date(log.clock_out) : now
  let ms = end.getTime() - new Date(log.clock_in).getTime()
  ms -= (log.break_total || 0) * 60_000
  if (log.is_break && log.break_start && !log.clock_out) {
    ms -= now.getTime() - new Date(log.break_start).getTime()
  }
  return Math.max(0, ms)
}

/** Sessions longer than this are most likely a missed clock-out. */
export const LONG_SESSION_MS = 12 * 60 * 60_000

/** "7j 45m" (pass t("hourShort") as `hourUnit` for the UI language). */
export function formatWorked(ms: number, hourUnit = "j"): string {
  const totalMinutes = Math.floor(ms / 60_000)
  return `${Math.floor(totalMinutes / 60)}${hourUnit} ${totalMinutes % 60}m`
}

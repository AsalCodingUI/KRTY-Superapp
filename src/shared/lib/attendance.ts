export const ATTENDANCE_NOTE_TAGS = {
  deleteRequested: "DELETE_REQUESTED",
  staleSessionResolved: "STALE_SESSION_RESOLVED",
  adminClosedSession: "ADMIN_CLOSED_SESSION",
  adminEditedSession: "ADMIN_EDITED_SESSION",
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

/** Display labels for stored attendance statuses. */
export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  Present: "Hadir",
  Lembur: "Lembur",
  "Cuti Masuk": "Cuti Masuk",
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

/** "7j 45m" */
export function formatWorked(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000)
  return `${Math.floor(totalMinutes / 60)}j ${totalMinutes % 60}m`
}

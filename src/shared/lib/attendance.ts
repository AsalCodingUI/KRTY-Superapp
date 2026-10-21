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

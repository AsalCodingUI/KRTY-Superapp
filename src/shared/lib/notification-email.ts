/**
 * Which notifications can also go out by email, grouped the way Settings →
 * Notifikasi shows them. A person mutes whole groups
 * (notification_email_prefs.muted); a type not listed here is never mailed.
 */
export const EMAIL_GROUPS = {
  mentions: ["mention"],
  comments: ["task_comment"],
  work: [
    "task_assigned",
    "task_due",
    "task_status",
    "project_assignment",
    "project_lead",
  ],
  leave: [
    "leave_request",
    "leave_status",
    "attendance_decision",
    "attendance_reminder",
  ],
  finance: ["invoice_due", "invoice_paid"],
  calendar: ["calendar_event", "one_on_one"],
  santuy: ["santuy_presenter", "santuy_today", "santuy_change"],
  performance: ["review_cycle", "review_summary", "kpi_scored"],
  announcements: ["announcement_urgent"],
  // Email only: Monday's summary of the week (lib/jobs/weekly-digest.ts).
  digest: ["weekly_digest"],
} as const

export type EmailGroup = keyof typeof EMAIL_GROUPS

export const EMAIL_GROUP_KEYS = Object.keys(EMAIL_GROUPS) as EmailGroup[]

export function emailGroupOf(type: string): EmailGroup | null {
  for (const key of EMAIL_GROUP_KEYS)
    if ((EMAIL_GROUPS[key] as readonly string[]).includes(type)) return key
  return null
}

/** Whether a person's prefs (none saved = on, nothing muted) let it through. */
export function wantsEmail(
  type: string,
  prefs: { enabled: boolean; muted: string[] } | null | undefined,
) {
  const group = emailGroupOf(type)
  if (!group) return false
  if (!prefs) return true
  return prefs.enabled && !prefs.muted.includes(group)
}

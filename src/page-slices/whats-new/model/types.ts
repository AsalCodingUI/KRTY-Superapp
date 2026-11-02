/**
 * "Yang baru": what changed in the app and the client pages, each with a
 * step-by-step guide. Rows of `whats_new_entries` (migrations/
 * whats_new_entries.sql), written by stakeholders in the app.
 */

/**
 * Baru / Diperbarui / Perbaikan, and Panduan: a standing guide to a core
 * feature (not a change), listed apart from the updates and left out of the
 * sidebar's "Ada yang baru".
 */
export const WHATS_NEW_TAGS = ["new", "improved", "fixed", "guide"] as const
export type WhatsNewTag = (typeof WHATS_NEW_TAGS)[number]

/** Guides vs updates (the list's first filter, ?kind=). */
export const WHATS_NEW_KINDS = ["updates", "guides"] as const
export type WhatsNewKind = (typeof WHATS_NEW_KINDS)[number]

export const isGuide = (entry: { tags: readonly string[] }) =>
  entry.tags.includes("guide")

export const WHATS_NEW_AREAS = [
  "general",
  "projects",
  "tasks",
  "editor",
  "ai",
  "reports",
  "calendar",
  "santuy",
  "leave",
  "profile",
  "desktop",
  "clients",
  "processes",
  "finance",
  "performance",
  "team",
  "policies",
] as const
export type WhatsNewArea = (typeof WHATS_NEW_AREAS)[number]

/**
 * Who it's for: "pm" is PMs and stakeholders (they run projects),
 * "stakeholder" is stakeholders only. Matches shared/config/access.ts.
 */
export const WHATS_NEW_AUDIENCES = ["everyone", "pm", "stakeholder"] as const
export type WhatsNewAudience = (typeof WHATS_NEW_AUDIENCES)[number]

/** The app (web + Kretya Flow), the Mac app only, or the client pages. */
export const WHATS_NEW_SURFACES = ["app", "mac", "client"] as const
export type WhatsNewSurface = (typeof WHATS_NEW_SURFACES)[number]

export type WhatsNewEntry = {
  /** Slug: the URL (/whats-new/<id>) and the "seen" marker; fixed. */
  id: string
  /** Release day, "YYYY-MM-DD". */
  date: string
  title: string
  summary: string
  tags: WhatsNewTag[]
  area: WhatsNewArea
  audience: WhatsNewAudience
  surface: WhatsNewSurface
  /** 2:1 picture for the cards and the top of the guide. */
  thumbnailUrl: string | null
  /** Markdown; its top headings are the guide's sections. */
  body: string
  /** Drafts are seen by stakeholders only. */
  published: boolean
  /** Order within a day (lower first). */
  sort: number
  updatedAt: string
}

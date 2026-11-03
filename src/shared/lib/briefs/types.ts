/**
 * A brief (Dokumen): the questionnaire a client fills before a project.
 * Its questions are a copy (`sections`), so each brief can be edited on
 * its own; answers are keyed by question id.
 */

/** Question sets a brief can ask; "common" is always there. */
export const BRIEF_SETS = ["design", "branding", "development"] as const
export type BriefSet = (typeof BRIEF_SETS)[number]
export type SectionSet = BriefSet | "common"

/** Blocks that ask something, in menu order. */
export const QUESTION_TYPES = [
  "text",
  "textarea",
  "single",
  "multi",
  "dropdown",
  "yesno",
  "email",
  "phone",
  "url",
  "number",
  "date",
  "scale",
  "rating",
  "files",
] as const
/** Blocks that only lay the form out (nothing to answer). */
export const LAYOUT_TYPES = ["statement", "divider"] as const
export type QuestionType =
  | (typeof QUESTION_TYPES)[number]
  | (typeof LAYOUT_TYPES)[number]

export const isLayout = (type: QuestionType) =>
  (LAYOUT_TYPES as readonly string[]).includes(type)
/** Picked from a list of `options`. */
export const hasOptions = (type: QuestionType) =>
  type === "single" || type === "multi" || type === "dropdown"

export type BriefQuestion = {
  id: string
  type: QuestionType
  label: string
  /** Under the label: what we mean, in a line. */
  help?: string
  /** A sample answer, shown as the placeholder / under the field. */
  example?: string
  /** single / multi. */
  options?: string[]
  /** single / multi: an "Other" choice with its own text. */
  other?: boolean
  optional?: boolean
  /** scale: 1…max (5 or 10); rating: stars (3–10). */
  max?: number
  /** scale: what the ends mean ("Not likely" … "Very likely"). */
  minLabel?: string
  maxLabel?: string
  /** Only asked when an earlier choice question's answer is one of `is`
   *  (any of them, for a multi). */
  showIf?: { question: string; is: string[] }
}

export type BriefSection = {
  id: string
  set: SectionSet
  title: string
  description?: string
  /** The team fills it before sending (the client can still correct it). */
  team?: boolean
  questions: BriefQuestion[]
}

/** multi: string[]; every other question a string (scale / rating: the
 *  number as text, yes/no: "Yes" / "No"); "Other" text under
 *  `${id}__other`. Files live in brief_files. Layout blocks: nothing. */
export type BriefAnswers = Record<string, string | string[]>

export const BRIEF_STATUSES = [
  "draft",
  "sent",
  "in_progress",
  "submitted",
] as const
export type BriefStatus = (typeof BRIEF_STATUSES)[number]

/** Upload limits: files are kept exactly as sent (never recompressed). */
export const BRIEF_FILE_MAX = 200 * 1024 * 1024
export const BRIEF_TOTAL_MAX = 1024 * 1024 * 1024

/** A client can have at most this many briefs (one per context). */
export const BRIEFS_PER_CLIENT = 2

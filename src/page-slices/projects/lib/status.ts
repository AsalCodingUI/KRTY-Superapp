import type { Database } from "@/shared/types/database.types"

export type ProjectStatus = Database["public"]["Enums"]["project_status_enum"]

/** The board, left to right; Archived sits outside it. */
export const BOARD_STATUSES = [
  "Planned",
  "Active",
  "Review",
  "Paused",
  "Completed",
] as const

/** Every status in workflow order ("Pindahkan ke", list groups, filters). */
export const ALL_STATUSES = [
  ...BOARD_STATUSES,
  "Archived",
] as const satisfies readonly ProjectStatus[]

/** Not finished yet (a paused project still has work left). */
export const OPEN_STATUSES: ProjectStatus[] = [
  "Planned",
  "Active",
  "Review",
  "Paused",
]

export const STATUS_LABEL_KEYS = {
  Planned: "statusPlanned",
  Active: "statusActive",
  Review: "statusReview",
  Paused: "statusPaused",
  Completed: "statusCompleted",
  Archived: "statusArchived",
} as const satisfies Record<ProjectStatus, string>

/** What the team is working on right now (shown by the project's name). */
export const PROJECT_STAGES = ["branding", "design", "development"] as const

export type ProjectStage = (typeof PROJECT_STAGES)[number]

export const STAGE_LABEL_KEYS = {
  branding: "stageBranding",
  design: "stageDesign",
  development: "stageDevelopment",
} as const satisfies Record<ProjectStage, string>

export function asStage(value: string | null | undefined): ProjectStage | null {
  return (PROJECT_STAGES as readonly string[]).includes(value ?? "")
    ? (value as ProjectStage)
    : null
}

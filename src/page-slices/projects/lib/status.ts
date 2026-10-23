import type { Database } from "@/shared/types/database.types"

export type ProjectStatus = Database["public"]["Enums"]["project_status_enum"]

/** The board, left to right; Archived sits outside it. */
export const BOARD_STATUSES = [
  "Planned",
  "Active",
  "Review",
  "Completed",
] as const

/** Not finished yet (counts as a running project). */
export const OPEN_STATUSES: ProjectStatus[] = ["Planned", "Active", "Review"]

export const STATUS_LABEL_KEYS = {
  Planned: "statusPlanned",
  Active: "statusActive",
  Review: "statusReview",
  Completed: "statusCompleted",
  Archived: "statusArchived",
} as const satisfies Record<ProjectStatus, string>

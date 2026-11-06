import { cn } from "@/lib/utils"
import { SPARKLE_D, STROKE, VIEWBOX } from "@/components/icons/custom"
import type { ProjectStage } from "../lib/status"

/**
 * One tint per stage, so a glance at the sidebar tells them apart
 * (important: menu buttons grey their icons).
 */
export const STAGE_TONE: Record<ProjectStage, string> = {
  // Palette step 9 (the solid tone; works in light and dark). The `!`
  // stays: menu buttons grey their icons and these must keep the tint.
  branding: "text-pink-9!",
  design: "text-orange-9!",
  development: "text-green-9!",
}

/** Outline glyphs on our grid (24, STROKE, round caps and joins), like
 *  the status icons beside them. */
const PATHS: Record<ProjectStage, string> = {
  // Our sparkle (the Stars family's four-point shape).
  branding: SPARKLE_D,
  // Pen nib: corners r 1.5, the slit running into a r 2 hole.
  design:
    "M10.873 4.032A1.5 1.5 0 0 1 13.127 4.032L18.676 10.347A1.5 1.5 0 0 1 18.969 11.822L16.097 20.235A1.5 1.5 0 0 1 14.677 21.25L9.323 21.25A1.5 1.5 0 0 1 7.903 20.235L5.031 11.822A1.5 1.5 0 0 1 5.324 10.347ZM12 4.25V10M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  // Terminal: our square with a prompt and a cursor.
  development:
    "M3.25 6.338a3.088 3.088 0 0 1 3.088 -3.088h11.324a3.088 3.088 0 0 1 3.088 3.088v11.324a3.088 3.088 0 0 1 -3.088 3.088h-11.324a3.088 3.088 0 0 1 -3.088 -3.088ZM7.882 9.426l2.574 2.574L7.882 14.574M13.029 14.574h3.603",
}

export function ProjectStageIcon({
  stage,
  className,
}: {
  stage: ProjectStage
  className?: string
}) {
  return (
    <svg
      aria-hidden
      viewBox={VIEWBOX}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4 shrink-0", STAGE_TONE[stage], className)}
    >
      <path d={PATHS[stage]} />
    </svg>
  )
}

import { cn } from "@/lib/utils"
import type { ProjectStage } from "../lib/status"

/**
 * One tint per stage, so a glance at the sidebar tells them apart
 * (important: menu buttons grey their icons).
 */
export const STAGE_TONE: Record<ProjectStage, string> = {
  branding: "text-fuchsia-500!",
  design: "text-orange-500!",
  development: "text-emerald-500!",
}

/** Filled 16px glyphs (cut-outs via evenodd, so they sit on any surface). */
const PATHS: Record<ProjectStage, string> = {
  // Sparkle.
  branding:
    "M8 1c.55 3.6 3.4 6.45 7 7-3.6.55-6.45 3.4-7 7-.55-3.6-3.4-6.45-7-7 3.6-.55 6.45-3.4 7-7Z",
  // Pen nib, with its hole.
  design:
    "M8 1.25 13 7.4 10.2 14H5.8L3 7.4 8 1.25Zm0 5.5a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7Z",
  // Terminal: a prompt and a cursor cut out of a window.
  development:
    "M4 2.25h8A2.75 2.75 0 0 1 14.75 5v6A2.75 2.75 0 0 1 12 13.75H4A2.75 2.75 0 0 1 1.25 11V5A2.75 2.75 0 0 1 4 2.25Zm.9 3.4 1.95 1.85L4.9 9.35l.95 1 2.95-2.85L5.85 4.65l-.95 1Zm4.1 3.6v1.3h3v-1.3H9Z",
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
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4 shrink-0", STAGE_TONE[stage], className)}
    >
      <path fillRule="evenodd" clipRule="evenodd" d={PATHS[stage]} />
    </svg>
  )
}

import { cn } from "@/lib/utils"
import { Archive, CircleDashed } from "@/components/icons"
import { STROKE } from "@/components/icons/custom"
import type { ProjectStatus } from "../lib/status"

/** Our circle (r 9.25 at 12,12) and the inner disc it holds: inset so a
 *  1.5 clear ring stays between them (9.25 − 1 − 1.5). */
const RING = 9.25
const DISC = RING - STROKE / 2 - 1.5

/**
 * Linear-style step icons on our grid (24, STROKE, round caps): dashed
 * ring (not started), ring + half disc (in progress), open ¾ arc (in
 * review), ring with bars (paused), filled disc with a check (done).
 */
export function ProjectStatusIcon({
  status,
  className,
}: {
  status: ProjectStatus
  className?: string
}) {
  const base = cn("size-4 shrink-0 text-muted-foreground", className)
  if (status === "Archived") return <Archive aria-hidden className={base} />
  if (status === "Planned") return <CircleDashed aria-hidden className={base} />
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={base}
    >
      {status === "Active" && (
        <>
          <circle cx="12" cy="12" r={RING} />
          <path
            d={`M12 ${12 - DISC}a${DISC} ${DISC} 0 0 0 0 ${2 * DISC}Z`}
            fill="currentColor"
            stroke="none"
          />
        </>
      )}
      {status === "Review" && <path d="M12 2.75a9.25 9.25 0 1 1-9.25 9.25" />}
      {status === "Paused" && (
        <>
          <circle cx="12" cy="12" r={RING} />
          <path d="M10 8.5v7M14 8.5v7" />
        </>
      )}
      {status === "Completed" && (
        <>
          {/* The ring's outer edge, filled; our check cut in the page tone. */}
          <circle
            cx="12"
            cy="12"
            r={RING + STROKE / 2}
            fill="currentColor"
            stroke="none"
          />
          <path
            d="M7.919 12.272l2.721 2.721 5.713-5.713"
            stroke="var(--background)"
          />
        </>
      )}
    </svg>
  )
}

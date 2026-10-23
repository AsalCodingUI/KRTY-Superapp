import { cn } from "@/lib/utils"
import { Archive } from "lucide-react"
import type { ProjectStatus } from "../lib/status"

/**
 * Linear-style step icons: dashed ring (not started), half-filled ring (in
 * progress), open ring (in review), filled check (done).
 */
export function ProjectStatusIcon({
  status,
  className,
}: {
  status: ProjectStatus
  className?: string
}) {
  const base = cn("size-4 shrink-0", className)
  if (status === "Archived")
    return <Archive aria-hidden className={cn(base, "text-muted-foreground")} />
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      className={cn(
        base,
        status === "Completed" ? "text-foreground/80" : "text-muted-foreground",
      )}
    >
      {status === "Planned" && (
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2.4 2.2"
        />
      )}
      {status === "Active" && (
        <>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4a4 4 0 0 0 0 8z" fill="currentColor" />
        </>
      )}
      {status === "Review" && (
        <path
          d="M8 2a6 6 0 1 1-5.2 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
      {status === "Completed" && (
        <>
          <circle cx="8" cy="8" r="6.75" fill="currentColor" />
          <path
            d="m5.4 8.2 1.8 1.8 3.4-3.6"
            stroke="var(--background)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  )
}

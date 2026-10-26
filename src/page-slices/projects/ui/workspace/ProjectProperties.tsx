"use client"

import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { ArrowRight, CalendarDays, Flag, ListChecks } from "lucide-react"
import type { PhaseRow, StepRow } from "./data"

/** Dot colour per project status. */
const STATUS_DOT: Record<string, string> = {
  Planned: "bg-muted-foreground",
  Active: "bg-primary",
  Review: "bg-warning",
  Completed: "bg-success",
  Archived: "bg-muted-foreground",
}

/** A small pie for a share done (Linear's progress glyph). */
function ProgressRing({ value }: { value: number }) {
  // The wedge is drawn out to the middle of the ring's stroke, so the two
  // overlap and no seam shows between them.
  const share = Math.min(Math.max(value, 0), 100) / 100
  const r = 6.25
  const angle = share * 2 * Math.PI
  const x = 7 + r * Math.sin(angle)
  const y = 7 - r * Math.cos(angle)
  return (
    <svg viewBox="0 0 14 14" className="text-primary size-3.5" aria-hidden>
      <circle
        cx="7"
        cy="7"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {share >= 1 ? (
        <circle cx="7" cy="7" r={r} fill="currentColor" />
      ) : (
        share > 0 && (
          <path
            fill="currentColor"
            d={`M7 7 L7 ${7 - r} A${r} ${r} 0 ${share > 0.5 ? 1 : 0} 1 ${x} ${y} Z`}
          />
        )
      )}
    </svg>
  )
}

/**
 * The project's properties in one quiet line under the title (Linear's
 * project overview): status, overall progress, the running phase and the
 * dates (and, for the team, open tasks). Used on the team's dashboard and
 * the client portal. Progress per phase is the rail below.
 */
export function ProjectProperties({
  phases,
  steps,
  status,
  statusTone,
  start,
  end,
  openTasks,
}: {
  phases: PhaseRow[]
  steps: StepRow[]
  status: string | null
  statusTone: string | null
  start: string | null
  end: string | null
  /** Inside only: open (top-level) tasks. */
  openTasks?: number
}) {
  const t = useT("projects")
  // Each phase counts the same: done 1, the running one by its steps.
  const fillOf = (phase: PhaseRow) => {
    if (phase.status === "done") return 1
    if (phase.status !== "active") return 0
    const own = steps.filter((s) => s.phase_id === phase.id)
    return own.length
      ? own.filter((s) => s.status === "done").length / own.length
      : 0
  }
  const percent = phases.length
    ? Math.round(
        (phases.reduce((sum, p) => sum + fillOf(p), 0) / phases.length) * 100,
      )
    : null
  const active = phases.find((p) => p.status === "active") ?? null

  const item =
    "flex min-w-0 items-center gap-2 text-foreground [&_svg]:shrink-0"
  const icon = "text-muted-foreground size-4"

  return (
    <div className="bleed gutter-x border-border flex flex-wrap items-center gap-x-6 gap-y-3 border-b pb-6 text-sm">
      {status && (
        <span className={item}>
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              STATUS_DOT[statusTone ?? ""] ?? "bg-muted-foreground",
            )}
          />
          {status}
        </span>
      )}
      {percent !== null && (
        <span className={item}>
          <ProgressRing value={percent} />
          <span className="tabular-nums">{percent}%</span>
        </span>
      )}
      {active && (
        <span className={item} title={active.name}>
          <Flag className={icon} />
          <span className="truncate">{active.name}</span>
          <span className="text-muted-foreground shrink-0 tabular-nums">
            {t("phaseProgress", {
              n: phases.indexOf(active) + 1,
              total: phases.length,
            })}
          </span>
        </span>
      )}
      {(start || end) && (
        <span className={item}>
          <CalendarDays className={icon} />
          <span className="tabular-nums">
            {start ?? "—"}
            <ArrowRight className="text-muted-foreground mx-1.5 inline size-3.5 align-[-2px]" />
            {end ?? "—"}
          </span>
        </span>
      )}
      {openTasks !== undefined && (
        <span className={item}>
          <ListChecks className={icon} />
          <span className="tabular-nums">
            {t("openTasksValue", { n: openTasks })}
          </span>
        </span>
      )}
    </div>
  )
}

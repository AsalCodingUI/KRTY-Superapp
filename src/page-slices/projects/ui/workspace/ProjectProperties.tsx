"use client"

import { cn } from "@/lib/utils"
import type * as React from "react"
import { useT } from "@/shared/i18n/client"
import {
  ArrowRight,
  CalendarDays,
  Flag,
  Infinity as InfinityIcon,
  ListChecks,
} from "@/components/icons"
import { STROKE, VIEWBOX } from "@/components/icons/custom"
import type { PhaseRow, StepRow } from "./data"

/** Dot colour per project status. */
const STATUS_DOT: Record<string, string> = {
  Planned: "bg-muted-foreground",
  Active: "bg-primary",
  Review: "bg-warning",
  Paused: "bg-muted-foreground",
  Completed: "bg-success",
  Archived: "bg-muted-foreground",
}

/** A small pie for a share done (Linear's progress glyph): our circle
 *  (r 9.25, STROKE) and, inside it, a wedge of the inner disc, inset so a
 *  1.5 clear ring stays between them (as the status icons). */
function ProgressRing({ value }: { value: number }) {
  const share = Math.min(Math.max(value, 0), 100) / 100
  const r = 9.25 - STROKE / 2 - 1.5
  const angle = share * 2 * Math.PI
  const x = 12 + r * Math.sin(angle)
  const y = 12 - r * Math.cos(angle)
  return (
    <svg viewBox={VIEWBOX} className="text-primary size-3.5" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="9.25"
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
      />
      {share >= 1 ? (
        <circle cx="12" cy="12" r={r} fill="currentColor" />
      ) : (
        share > 0 && (
          <path
            fill="currentColor"
            d={`M12 12 L12 ${12 - r} A${r} ${r} 0 ${share > 0.5 ? 1 : 0} 1 ${x} ${y} Z`}
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
 * the client portal. Progress per phase is the rail below; a project
 * without phases reads "Berjalan terus" instead.
 */
export function ProjectProperties({
  phases,
  steps,
  status,
  statusTone,
  start,
  end,
  openTasks,
  extra,
}: {
  phases: PhaseRow[]
  steps: StepRow[]
  status: string | null
  statusTone: string | null
  start: string | null
  end: string | null
  /** Inside only: open (top-level) tasks. */
  openTasks?: number
  /** More items at the end, given the line's item class. */
  extra?: (itemClassName: string) => React.ReactNode
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
      {/* No phases: an ongoing project (side work, a retainer), not 0%. */}
      {percent === null &&
        statusTone !== "Completed" &&
        statusTone !== "Archived" && (
          <span className={item}>
            <InfinityIcon className={icon} />
            {t("phasesOffLabel")}
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
      {extra?.(item)}
    </div>
  )
}

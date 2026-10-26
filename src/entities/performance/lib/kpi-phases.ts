/**
 * Milestones from project phases, and which quarter each score lands in.
 *
 * - A phase with a due date is a milestone. Its result comes from the day it
 *   was completed (Jakarta time): ≥ FASTER_DAYS early → Faster, by the due
 *   date → On Time, later → Delay. Not done once the due date has passed is
 *   a Delay too (automatic), shown as overdue until it's finished.
 * - A milestone counts in the quarter it was due, or earlier if it was
 *   delivered earlier. A project running Q2 → Q4 scores in each quarter it
 *   delivers; moving the project's end date doesn't move earned scores.
 * - A lead/stakeholder override (with a reason) replaces one member's result.
 * - Projects without phase due dates keep the old manual milestones, counted
 *   in the project's quarter.
 * - Work quality counts in the quarter the project was handed over.
 */

import {
  SLA_RESULT_PERCENT,
  type SLAResult,
} from "@/entities/performance/lib/kpi"

/** Days early that turn On Time into Faster. */
export const FASTER_DAYS = 2

export type PhaseRow = {
  id: string
  name: string
  position: number
  status: string
  due_date: string | null
  completed_at: string | null
  sla_weight: number | null
}

export type SlaScoreRow = {
  phase_id: string | null
  milestone_name: string
  weight_percentage: number | null
  score_achieved: number | null
  actual_result: string | null
  override_reason: string | null
}

export type MilestoneState =
  /** Scored: has a result and a quarter. */
  | "scored"
  /** Due later and not done yet. */
  | "pending"
  /** A phase without a due date (and no override): can't be judged. */
  | "noDue"
  /** Done before this member joined the project. */
  | "beforeJoin"

export type Milestone = {
  phaseId: string | null
  name: string
  /** Share of the project's SLA (phases sum to 100). */
  weight: number
  due: string | null
  /** Day completed (yyyy-mm-dd, Jakarta), if done. */
  done: string | null
  result: SLAResult | null
  /** Automatic from dates, a manual override, or old manual scoring. */
  source: "auto" | "override" | "manual"
  reason: string | null
  /** The quarter this milestone counts in ("2026-Q3"). */
  quarter: string | null
  state: MilestoneState
  /** Past the due date and still open (auto Delay). */
  overdueDays: number
}

/** yyyy-mm-dd of a timestamp in Jakarta (UTC+7, no DST). */
export function jakartaDay(ts: string | Date) {
  const time = typeof ts === "string" ? Date.parse(ts) : ts.getTime()
  return new Date(time + 7 * 3600_000).toISOString().slice(0, 10)
}

export function todayJakarta() {
  return jakartaDay(new Date())
}

/** "2026-05-14" → "2026-Q2". */
export function quarterOf(day: string) {
  const [y, m] = day.split("-").map(Number)
  return `${y}-Q${Math.floor((m - 1) / 3) + 1}`
}

/** First and last day of a "2026-Q2" quarter. */
export function quarterRange(quarter: string) {
  const [y, q] = quarter.split("-Q").map(Number)
  const start = `${y}-${String((q - 1) * 3 + 1).padStart(2, "0")}-01`
  const endMonth = q * 3
  const last = new Date(Date.UTC(y, endMonth, 0)).getUTCDate()
  return { start, end: `${y}-${String(endMonth).padStart(2, "0")}-${last}` }
}

/** Whole days from a to b (yyyy-mm-dd). */
export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

/** Does a quarter fall in a scope ("2026-Q3", "2026-All" or "All")? */
export function inScope(quarter: string | null, scope: string) {
  if (!quarter) return false
  if (!scope || scope === "All") return true
  const [year, part] = scope.split("-")
  return part === "All" ? quarter.startsWith(`${year}-`) : quarter === scope
}

/** The automatic result of a phase, or null while it can't be judged yet. */
export function phaseResult(
  due: string | null,
  done: string | null,
  today: string,
): SLAResult | null {
  if (!due) return null
  if (done) {
    const early = daysBetween(done, due)
    if (early >= FASTER_DAYS) return "Faster"
    return early >= 0 ? "On Time" : "Delay"
  }
  return today > due ? "Delay" : null
}

/**
 * Weights for the phases: set ones as given, the rest share what's left
 * equally; scaled to 100 if the set ones overshoot.
 */
export function phaseWeights(phases: PhaseRow[]) {
  const set = phases.filter((p) => p.sla_weight !== null)
  const setTotal = set.reduce((s, p) => s + Number(p.sla_weight), 0)
  const free = phases.length - set.length
  const rest = Math.max(0, 100 - setTotal)
  const weights = new Map<string, number>()
  for (const p of phases) {
    weights.set(
      p.id,
      p.sla_weight !== null ? Number(p.sla_weight) : free ? rest / free : 0,
    )
  }
  const total = [...weights.values()].reduce((s, w) => s + w, 0)
  if (total > 0 && Math.abs(total - 100) > 0.01)
    for (const [id, w] of weights) weights.set(id, (w / total) * 100)
  return weights
}

/** Uses phases (due dates or overrides) rather than old manual milestones. */
export function usesPhases(phases: PhaseRow[], scores: SlaScoreRow[]) {
  return (
    phases.some((p) => p.due_date) || scores.some((s) => s.phase_id !== null)
  )
}

/** One member's milestones on one project. */
export function memberMilestones({
  phases,
  scores,
  projectQuarter,
  joinedOn,
  today = todayJakarta(),
}: {
  phases: PhaseRow[]
  scores: SlaScoreRow[]
  projectQuarter: string | null
  /** Day the member was added; earlier deliveries aren't theirs. */
  joinedOn: string | null
  today?: string
}): { mode: "phases" | "manual"; milestones: Milestone[] } {
  if (!usesPhases(phases, scores)) {
    return {
      mode: "manual",
      milestones: scores
        .filter((s) => s.phase_id === null)
        .map((s) => ({
          phaseId: null,
          name: s.milestone_name,
          weight: Number(s.weight_percentage) || 0,
          due: null,
          done: null,
          result:
            s.actual_result && s.actual_result in SLA_RESULT_PERCENT
              ? (s.actual_result as SLAResult)
              : null,
          source: "manual" as const,
          reason: null,
          quarter: projectQuarter,
          state: "scored" as const,
          overdueDays: 0,
        })),
    }
  }

  const ordered = [...phases].sort((a, b) => a.position - b.position)
  const weights = phaseWeights(ordered)
  const overrides = new Map(
    scores.filter((s) => s.phase_id).map((s) => [s.phase_id!, s]),
  )

  const milestones = ordered.map((p): Milestone => {
    const done = p.completed_at ? jakartaDay(p.completed_at) : null
    const override = overrides.get(p.id)
    const auto = phaseResult(p.due_date, done, today)
    const result =
      override?.actual_result && override.actual_result in SLA_RESULT_PERCENT
        ? (override.actual_result as SLAResult)
        : auto
    // Counts when due, or when delivered if that was earlier.
    const day = done && (!p.due_date || done <= p.due_date) ? done : p.due_date
    const overdueDays =
      !done && p.due_date && today > p.due_date
        ? daysBetween(p.due_date, today)
        : 0
    let state: MilestoneState = result ? "scored" : "pending"
    if (!p.due_date && !override) state = "noDue"
    // An override without any date counts in the project's quarter.
    const quarter = day ? quarterOf(day) : override ? projectQuarter : null
    if (joinedOn && day && day < joinedOn) state = "beforeJoin"
    return {
      phaseId: p.id,
      name: p.name,
      weight: weights.get(p.id) ?? 0,
      due: p.due_date,
      done,
      result: state === "scored" ? result : null,
      source: override ? "override" : "auto",
      reason: override?.override_reason ?? null,
      quarter: state === "scored" ? quarter : null,
      state,
      overdueDays,
    }
  })
  return { mode: "phases", milestones }
}

/** Rows in the shape slaPercent() takes. */
export function slaRows(milestones: Milestone[]) {
  return milestones
    .filter((m) => m.state === "scored" && m.result)
    .map((m) => ({ weight_percentage: m.weight, actual_result: m.result }))
}

/**
 * The quarter work quality counts in: the hand-over (last phase done, or the
 * project marked Completed). Old projects use their own quarter.
 */
export function qualityQuarter({
  mode,
  phases,
  project,
}: {
  mode: "phases" | "manual"
  phases: PhaseRow[]
  project: { status: string; quarter_id: string | null; end_date: string }
}) {
  if (mode === "manual") return project.quarter_id
  const allDone = phases.length > 0 && phases.every((p) => p.completed_at)
  if (allDone) {
    const last = phases
      .map((p) => jakartaDay(p.completed_at!))
      .sort()
      .at(-1)!
    return quarterOf(last)
  }
  if (project.status === "Completed") return quarterOf(project.end_date)
  return null
}

"use server"

import {
  finalScore,
  qualityPercent,
  slaPercent,
  type FinalScore,
  type KpiParts,
} from "@/entities/performance/lib/kpi"
import {
  daysBetween,
  inScope,
  jakartaDay,
  memberMilestones,
  qualityQuarter,
  quarterOf,
  quarterRange,
  slaRows,
  todayJakarta,
  type Milestone,
  type PhaseRow,
  type SlaScoreRow,
} from "@/entities/performance/lib/kpi-phases"
import { createClient } from "@/shared/api/supabase/server"
import { getT } from "@/shared/i18n/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import { revalidatePath } from "next/cache"

/** "2026-Q3" (one quarter), "2026-All" (that year) or "All". */
export type KpiScope = string

export type ScopedMilestone = Milestone & { inScope: boolean }

export type KpiProject = {
  assignmentId: string
  projectId: string
  name: string
  client: string | null
  status: string
  /** The project's own (planned end) quarter. */
  quarter: string | null
  role: string
  isLead: boolean
  /** SLA / quality counted in the scope (null: nothing counts here). */
  sla: number | null
  quality: number | null
  start: string
  end: string
  startQuarter: string
  endQuarter: string
  /** Still being worked on (not Completed / Archived). */
  running: boolean
  /** Running past its end date. */
  overdueDays: number
  /** Archived: shown, never counted. */
  excluded: boolean
  /** Scored from phase dates, or the old manual milestones. */
  mode: "phases" | "manual"
  milestones: ScopedMilestone[]
  /**
   * counted: quality counts in this scope · pending: not handed over yet ·
   * elsewhere: counts in another quarter · unscored: handed over here but
   * no competency checked yet.
   */
  qualityState: "counted" | "pending" | "elsewhere" | "unscored"
  qualityQuarter: string | null
  /** Competencies checked (to pool quality by count across projects). */
  qualityChecked: number
}

export type KpiPerson = {
  id: string
  full_name: string | null
  avatar_url: string | null
  job_title: string | null
}

export type KpiCoverage = {
  /** Projects that add SLA or quality to the scope. */
  projects: number
  milestones: number
  reviews: number
}

export type KpiAttention =
  | {
      kind: "overdueMilestone"
      projectId: string
      project: string
      phase: string
      days: number
    }
  | { kind: "noDueDate"; projectId: string; project: string; phases: number }
  | { kind: "qualityUnscored"; projectId: string; project: string }
  | { kind: "projectOverdue"; projectId: string; project: string; days: number }

export type KpiTrendPoint = {
  quarter: string
  final: number | null
  parts: KpiParts
}

export type KpiLock = {
  lockedAt: string
  /** Live numbers differ from the snapshot (edited after the lock). */
  changed: boolean
  liveFinal: number | null
}

export type EmployeeKpi = {
  employee: KpiPerson
  parts: KpiParts
  final: FinalScore
  coverage: KpiCoverage
  projects: KpiProject[]
  attention: KpiAttention[]
  /** Last four quarters up to the scope's (or the current) quarter. */
  trend: KpiTrendPoint[]
  lock: KpiLock | null
}

type Result<T> = { success: true; data: T } | { success: false; error: string }

type ProjectRow = {
  id: string
  name: string
  status: string
  quarter_id: string | null
  start_date: string
  end_date: string
  client_name: string | null
  project_phases: PhaseRow[]
}

type AssignmentRow = {
  id: string
  user_id: string
  role_in_project: string
  is_lead: boolean | null
  created_at: string | null
  projects: ProjectRow | null
  project_sla_scores: SlaScoreRow[]
  project_work_quality_scores: { is_achieved: boolean | null }[]
}

const ASSIGNMENT_SELECT = `
  id, user_id, role_in_project, is_lead, created_at,
  projects!inner (
    id, name, status, quarter_id, start_date, end_date, client_name,
    project_phases ( id, name, position, status, due_date, completed_at, sla_weight )
  ),
  project_sla_scores (
    phase_id, milestone_name, weight_percentage, score_achieved,
    actual_result, override_reason
  ),
  project_work_quality_scores ( is_achieved )
`

type Supabase = Awaited<ReturnType<typeof createClient>>

/** Who is asking: the effective (impersonated) user and their role. */
async function viewer() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const effectiveId = await resolveEffectiveUserId(
    supabase,
    user.id,
    user.email,
  )
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", effectiveId)
    .maybeSingle()
  if (!profile) return null
  return {
    supabase,
    id: profile.id as string,
    isStakeholder: canManageByRole(profile.role),
  }
}

// --- scoring ----------------------------------------------------------------

/** A project's working span as days, for "does it run in this scope?". */
function spanOf(p: ProjectRow, today: string) {
  const done = p.status === "Completed" || p.status === "Archived"
  return {
    from: p.start_date,
    to: done ? p.end_date : maxDay(p.end_date, today),
  }
}

function maxDay(a: string, b: string) {
  return a > b ? a : b
}

/** First/last day covered by a scope; null for "All". */
function scopeRange(scope: KpiScope) {
  if (!scope || scope === "All") return null
  const [year, part] = scope.split("-")
  if (part === "All") return { start: `${year}-01-01`, end: `${year}-12-31` }
  return quarterRange(scope)
}

/** One assignment seen through a scope; null when it has nothing there. */
function scopeProject(
  a: AssignmentRow,
  scope: KpiScope,
  today: string,
): KpiProject | null {
  const p = a.projects
  if (!p) return null
  const phases = p.project_phases ?? []
  const { mode, milestones } = memberMilestones({
    phases,
    scores: a.project_sla_scores ?? [],
    projectQuarter: p.quarter_id,
    joinedOn: a.created_at ? jakartaDay(a.created_at) : null,
    today,
  })
  const scoped = milestones.map((m) => ({
    ...m,
    inScope: inScope(m.quarter, scope),
  }))
  const counted = scoped.filter((m) => m.inScope)
  const qQuarter = qualityQuarter({ mode, phases, project: p })
  const qualityRows = a.project_work_quality_scores ?? []
  const qualityHere = inScope(qQuarter, scope)

  const range = scopeRange(scope)
  const span = spanOf(p, today)
  const overlaps = !range || (span.from <= range.end && span.to >= range.start)
  if (!counted.length && !qualityHere && !overlaps) return null

  const excluded = p.status === "Archived"
  const running = p.status !== "Completed" && !excluded
  return {
    assignmentId: a.id,
    projectId: p.id,
    name: p.name,
    client: p.client_name,
    status: p.status,
    quarter: p.quarter_id,
    role: a.role_in_project,
    isLead: a.is_lead === true,
    sla: excluded ? null : slaPercent(slaRows(counted)),
    quality: excluded || !qualityHere ? null : qualityPercent(qualityRows),
    start: p.start_date,
    end: p.end_date,
    startQuarter: quarterOf(p.start_date),
    endQuarter: quarterOf(p.end_date),
    running,
    overdueDays:
      running && today > p.end_date ? daysBetween(p.end_date, today) : 0,
    excluded,
    mode,
    milestones: scoped,
    qualityState: qualityHere
      ? qualityRows.length
        ? "counted"
        : "unscored"
      : qQuarter
        ? "elsewhere"
        : "pending",
    qualityQuarter: qQuarter,
    qualityChecked: qualityRows.length,
  }
}

function partsFrom(projects: KpiProject[], reviewScores: number[]): KpiParts {
  const live = projects.filter((p) => !p.excluded)
  // Pooled by milestone weight across the scope's projects.
  const sla = slaPercent(
    live.flatMap((p) => slaRows(p.milestones.filter((m) => m.inScope))),
  )
  // Pooled competencies of the projects handed over in scope.
  let achieved = 0
  let checked = 0
  for (const p of live) {
    if (p.qualityState !== "counted" || p.quality === null) continue
    const n = p.qualityChecked
    achieved += (p.quality / 100) * n
    checked += n
  }
  return {
    sla,
    review: reviewScores.length
      ? reviewScores.reduce((s, v) => s + v, 0) / reviewScores.length
      : null,
    quality: checked ? (achieved / checked) * 100 : null,
  }
}

function score(
  rows: AssignmentRow[],
  reviews: ReviewRow[],
  scope: KpiScope,
  today: string,
) {
  const projects = rows
    .map((a) => scopeProject(a, scope, today))
    .filter((p): p is KpiProject => p !== null)
  const reviewScores = reviews
    .filter((r) => inScope(r.quarter, scope))
    .map((r) => r.score)
  const parts = partsFrom(projects, reviewScores)
  const live = projects.filter((p) => !p.excluded)
  return {
    projects,
    parts,
    final: finalScore(parts),
    coverage: {
      projects: live.filter((p) => p.sla !== null || p.quality !== null).length,
      milestones: live.reduce(
        (n, p) => n + p.milestones.filter((m) => m.inScope && m.result).length,
        0,
      ),
      reviews: reviewScores.length,
    },
  }
}

function attentionFor(projects: KpiProject[]): KpiAttention[] {
  const out: KpiAttention[] = []
  for (const p of projects) {
    if (p.excluded) continue
    for (const m of p.milestones)
      if (m.overdueDays > 0 && m.source !== "override")
        out.push({
          kind: "overdueMilestone",
          projectId: p.projectId,
          project: p.name,
          phase: m.name,
          days: m.overdueDays,
        })
    const noDue = p.milestones.filter((m) => m.state === "noDue").length
    if (p.running && p.mode === "phases" && noDue)
      out.push({
        kind: "noDueDate",
        projectId: p.projectId,
        project: p.name,
        phases: noDue,
      })
    if (p.running && p.mode === "manual" && p.milestones.length === 0)
      out.push({
        kind: "noDueDate",
        projectId: p.projectId,
        project: p.name,
        phases: 0,
      })
    if (p.qualityState === "unscored")
      out.push({
        kind: "qualityUnscored",
        projectId: p.projectId,
        project: p.name,
      })
    if (p.overdueDays > 0)
      out.push({
        kind: "projectOverdue",
        projectId: p.projectId,
        project: p.name,
        days: p.overdueDays,
      })
  }
  return out
}

/** The four quarters ending at `quarter`. */
function lastQuarters(quarter: string, n = 4) {
  let [y, q] = quarter.split("-Q").map(Number)
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    out.unshift(`${y}-Q${q}`)
    q -= 1
    if (q === 0) {
      q = 4
      y -= 1
    }
  }
  return out
}

function trendFor(
  rows: AssignmentRow[],
  reviews: ReviewRow[],
  scope: KpiScope,
  today: string,
): KpiTrendPoint[] {
  const anchor = /^\d{4}-Q[1-4]$/.test(scope)
    ? scope
    : scope.endsWith("-All") && scope.slice(0, 4) < today.slice(0, 4)
      ? `${scope.slice(0, 4)}-Q4`
      : quarterOf(today)
  return lastQuarters(anchor).map((quarter) => {
    const s = score(rows, reviews, quarter, today)
    return { quarter, final: s.final.score, parts: s.parts }
  })
}

// --- data -------------------------------------------------------------------

type ReviewRow = { userId: string; quarter: string; score: number }

/** Every 360 result for these people, with its cycle's quarter. */
async function reviewsFor(supabase: Supabase, userIds: string[]) {
  if (userIds.length === 0) return [] as ReviewRow[]
  const { data } = await supabase
    .from("performance_summaries")
    .select("reviewee_id, overall_percentage, review_cycles!inner(quarter)")
    .not("review_cycles.quarter", "is", null)
    .in("reviewee_id", userIds)
  type Row = {
    reviewee_id: string
    overall_percentage: number | null
    review_cycles: { quarter: string }
  }
  return ((data ?? []) as unknown as Row[])
    .filter((s) => s.overall_percentage !== null)
    .map((s) => ({
      userId: s.reviewee_id,
      quarter: s.review_cycles.quarter,
      score: Number(s.overall_percentage),
    }))
}

async function assignmentsFor(supabase: Supabase, userIds: string[]) {
  if (userIds.length === 0) return { rows: [] as AssignmentRow[], error: null }
  const { data, error } = await supabase
    .from("project_assignments")
    .select(ASSIGNMENT_SELECT)
    .in("user_id", userIds)
  return { rows: (data ?? []) as unknown as AssignmentRow[], error }
}

type Snapshot = { parts: KpiParts; final: FinalScore }

async function lockFor(supabase: Supabase, scope: KpiScope) {
  if (!/^\d{4}-Q[1-4]$/.test(scope)) return null
  const { data } = await supabase
    .from("kpi_period_locks")
    .select("period, locked_at")
    .eq("period", scope)
    .maybeSingle()
  return data
}

async function snapshotsFor(
  supabase: Supabase,
  period: string,
  userIds: string[],
) {
  const { data } = await supabase
    .from("kpi_snapshots")
    .select("user_id, parts, final")
    .eq("period", period)
    .in("user_id", userIds)
  type Row = { user_id: string; parts: KpiParts; final: FinalScore }
  return new Map<string, Snapshot>(
    ((data ?? []) as unknown as Row[]).map((s) => [
      s.user_id,
      { parts: s.parts, final: s.final },
    ]),
  )
}

function sameScore(a: number | null, b: number | null) {
  if (a === null || b === null) return a === b
  return Math.round(a) === Math.round(b)
}

// --- actions ----------------------------------------------------------------

/** One person's KPI: themselves, or anyone for stakeholders. */
export async function getEmployeeKpi(
  userId: string,
  scope: KpiScope,
): Promise<Result<EmployeeKpi>> {
  const [me, t] = await Promise.all([viewer(), getT("performance")])
  if (!me) return { success: false, error: t("errLoginFirst") }
  if (userId !== me.id && !me.isStakeholder) {
    return { success: false, error: t("errNoKpiAccess") }
  }
  const { supabase } = me
  const today = todayJakarta()

  const [{ data: employee }, { rows, error }, reviews, lock] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title")
        .eq("id", userId)
        .maybeSingle(),
      assignmentsFor(supabase, [userId]),
      reviewsFor(supabase, [userId]),
      lockFor(supabase, scope),
    ])
  if (!employee) return { success: false, error: t("errMemberNotFound") }
  if (error) return { success: false, error: t("kpiLoadFailed") }

  const live = score(rows, reviews, scope, today)
  let parts = live.parts
  let final = live.final
  let lockInfo: KpiLock | null = null
  if (lock) {
    const snap = (await snapshotsFor(supabase, scope, [userId])).get(userId)
    if (snap) {
      parts = snap.parts
      final = snap.final
    }
    lockInfo = {
      lockedAt: lock.locked_at,
      changed: !sameScore(final.score, live.final.score),
      liveFinal: live.final.score,
    }
  }

  return {
    success: true,
    data: {
      employee,
      parts,
      final,
      coverage: live.coverage,
      projects: live.projects.sort(
        (a, b) =>
          Number(a.excluded) - Number(b.excluded) ||
          Number(b.running) - Number(a.running) ||
          b.end.localeCompare(a.end),
      ),
      attention: me.isStakeholder ? attentionFor(live.projects) : [],
      trend: trendFor(rows, reviews, scope, today),
      lock: lockInfo,
    },
  }
}

export type TeamKpiRow = KpiPerson & {
  parts: KpiParts
  final: FinalScore
  projectCount: number
}

async function teamRows(
  supabase: Supabase,
  scope: KpiScope,
): Promise<{ rows: TeamKpiRow[]; error: boolean }> {
  const { data: people, error: peopleError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, job_title")
    .eq("role", "employee")
    .order("full_name")
  if (peopleError) return { rows: [], error: true }
  const ids = (people ?? []).map((p: KpiPerson) => p.id)
  const today = todayJakarta()
  const [{ rows }, reviews] = await Promise.all([
    assignmentsFor(supabase, ids),
    reviewsFor(supabase, ids),
  ])
  const byUser = new Map<string, AssignmentRow[]>()
  for (const a of rows)
    byUser.set(a.user_id, [...(byUser.get(a.user_id) ?? []), a])

  return {
    error: false,
    rows: (people ?? []).map((p: KpiPerson) => {
      const s = score(
        byUser.get(p.id) ?? [],
        reviews.filter((r) => r.userId === p.id),
        scope,
        today,
      )
      return {
        ...p,
        parts: s.parts,
        final: s.final,
        // Projects running or counted in the period (not only scored ones).
        projectCount: s.projects.filter((x) => !x.excluded).length,
      }
    }),
  }
}

/** Everyone's KPI for a scope (stakeholders only); a locked quarter shows its snapshot. */
export async function getTeamKpi(
  scope: KpiScope,
): Promise<Result<TeamKpiRow[]>> {
  const [me, t] = await Promise.all([viewer(), getT("performance")])
  if (!me) return { success: false, error: t("errLoginFirst") }
  if (!me.isStakeholder) {
    return { success: false, error: t("errTeamKpiAdminOnly") }
  }
  const { supabase } = me
  const [{ rows, error }, lock] = await Promise.all([
    teamRows(supabase, scope),
    lockFor(supabase, scope),
  ])
  if (error) return { success: false, error: t("errMembersLoadFailed") }
  if (!lock) return { success: true, data: rows }

  const snaps = await snapshotsFor(
    supabase,
    scope,
    rows.map((r) => r.id),
  )
  return {
    success: true,
    data: rows.map((r) => {
      const snap = snaps.get(r.id)
      return snap ? { ...r, parts: snap.parts, final: snap.final } : r
    }),
  }
}

/** Whether a quarter is locked, and when. */
export async function getPeriodLock(
  period: string,
): Promise<{ locked: boolean; lockedAt: string | null }> {
  const me = await viewer()
  if (!me) return { locked: false, lockedAt: null }
  const lock = await lockFor(me.supabase, period)
  return { locked: Boolean(lock), lockedAt: lock?.locked_at ?? null }
}

/**
 * Closes a quarter: saves everyone's numbers as they are now. Later edits
 * still show live, flagged as changed after the lock.
 */
export async function lockPeriod(
  period: string,
): Promise<{ success: boolean; error?: string }> {
  const [me, t] = await Promise.all([viewer(), getT("performance")])
  if (!me?.isStakeholder)
    return { success: false, error: t("errTeamKpiAdminOnly") }
  if (!/^\d{4}-Q[1-4]$/.test(period))
    return { success: false, error: t("kpiLoadFailed") }
  const { supabase } = me
  const { rows, error } = await teamRows(supabase, period)
  if (error) return { success: false, error: t("errMembersLoadFailed") }

  const { error: lockError } = await supabase
    .from("kpi_period_locks")
    .insert({ period, locked_by: me.id })
  if (lockError) return { success: false, error: t("periodLockFailed") }
  const { error: snapError } = await supabase.from("kpi_snapshots").insert(
    rows.map((r) => ({
      period,
      user_id: r.id,
      parts: r.parts,
      final: r.final,
    })),
  )
  if (snapError) {
    await supabase.from("kpi_period_locks").delete().eq("period", period)
    return { success: false, error: t("periodLockFailed") }
  }
  revalidatePath("/performance", "layout")
  return { success: true }
}

/** Reopens a quarter (drops its snapshot). */
export async function unlockPeriod(
  period: string,
): Promise<{ success: boolean; error?: string }> {
  const [me, t] = await Promise.all([viewer(), getT("performance")])
  if (!me?.isStakeholder)
    return { success: false, error: t("errTeamKpiAdminOnly") }
  const { error } = await me.supabase
    .from("kpi_period_locks")
    .delete()
    .eq("period", period)
  if (error) return { success: false, error: t("periodLockFailed") }
  revalidatePath("/performance", "layout")
  return { success: true }
}

export type TeamProject = {
  projectId: string
  name: string
  status: string
  quarter: string | null
  members: (KpiPerson & {
    assignmentId: string
    role: string
    sla: number | null
    quality: number | null
  })[]
}

/** Each project's members (other than `excludeId`) with their scores. */
async function teamOf(
  supabase: Supabase,
  projectIds: string[],
  scope: KpiScope,
  excludeId: string,
): Promise<TeamProject[] | null> {
  const today = todayJakarta()
  const { data: rows, error } = await supabase
    .from("project_assignments")
    .select(
      `${ASSIGNMENT_SELECT}, profiles!project_assignments_user_id_fkey ( id, full_name, avatar_url, job_title )`,
    )
    .in("project_id", projectIds)
    .neq("user_id", excludeId)
  if (error) return null

  const byProject = new Map<string, TeamProject>()
  for (const row of (rows ?? []) as unknown as (AssignmentRow & {
    profiles: KpiPerson | null
  })[]) {
    if (!row.projects || !row.profiles) continue
    const p = scopeProject(row, scope, today)
    if (!p) continue
    const project = byProject.get(row.projects.id) ?? {
      projectId: row.projects.id,
      name: row.projects.name,
      status: row.projects.status,
      quarter: row.projects.quarter_id,
      members: [],
    }
    project.members.push({
      ...row.profiles,
      assignmentId: row.id,
      role: row.role_in_project,
      sla: p.sla,
      quality: p.quality,
    })
    byProject.set(project.projectId, project)
  }
  return [...byProject.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * One project's "Penilaian": its members and their scores in the project's
 * own quarter. For the project's lead and stakeholders.
 */
export async function getProjectAssessment(
  projectId: string,
): Promise<Result<TeamProject | null>> {
  const [me, t] = await Promise.all([viewer(), getT("performance")])
  if (!me) return { success: false, error: t("errLoginFirst") }
  const { supabase } = me

  const [{ data: project }, { data: mine }] = await Promise.all([
    supabase
      .from("projects")
      .select("quarter_id")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("project_assignments")
      .select("is_lead")
      .eq("project_id", projectId)
      .eq("user_id", me.id)
      .maybeSingle(),
  ])
  if (!project) return { success: false, error: t("teamLoadFailed") }
  if (!me.isStakeholder && !mine?.is_lead) {
    return { success: false, error: t("errAdminOnly") }
  }

  const scope = project.quarter_id ?? quarterOf(todayJakarta())
  const data = await teamOf(supabase, [projectId], scope, me.id)
  if (!data) return { success: false, error: t("teamLoadFailed") }
  return { success: true, data: data[0] ?? null }
}

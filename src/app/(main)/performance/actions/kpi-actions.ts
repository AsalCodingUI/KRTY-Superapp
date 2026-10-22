"use server"

import {
  finalScore,
  qualityPercent,
  slaPercent,
  type FinalScore,
  type KpiParts,
} from "@/entities/performance/lib/kpi"
import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"

/** "2026-Q3" (one quarter), "2026-All" (that year) or "All". */
export type KpiScope = string

export type KpiProject = {
  assignmentId: string
  projectId: string
  name: string
  status: string
  quarter: string | null
  role: string
  isLead: boolean
  sla: number | null
  quality: number | null
}

export type KpiPerson = {
  id: string
  full_name: string | null
  avatar_url: string | null
  job_title: string | null
}

export type EmployeeKpi = {
  employee: KpiPerson
  parts: KpiParts
  final: FinalScore
  projects: KpiProject[]
}

type Result<T> = { success: true; data: T } | { success: false; error: string }

type AssignmentRow = {
  id: string
  user_id: string
  role_in_project: string
  is_lead: boolean | null
  projects: {
    id: string
    name: string
    status: string
    quarter_id: string | null
  } | null
  project_sla_scores: {
    weight_percentage: number | null
    score_achieved: number | null
    actual_result: string | null
  }[]
  project_work_quality_scores: { is_achieved: boolean | null }[]
}

const ASSIGNMENT_SELECT = `
  id, user_id, role_in_project, is_lead,
  projects!inner ( id, name, status, quarter_id ),
  project_sla_scores ( weight_percentage, score_achieved, actual_result ),
  project_work_quality_scores ( is_achieved )
`

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

function applyScope<T extends { eq: Function; like: Function }>(
  query: T,
  column: string,
  scope: KpiScope,
): T {
  if (!scope || scope === "All") return query
  const [year, part] = scope.split("-")
  if (part === "All") return query.like(column, `${year}-%`)
  return query.eq(column, scope)
}

function toProject(a: AssignmentRow): KpiProject {
  return {
    assignmentId: a.id,
    projectId: a.projects!.id,
    name: a.projects!.name,
    status: a.projects!.status,
    quarter: a.projects!.quarter_id,
    role: a.role_in_project,
    isLead: a.is_lead === true,
    sla: slaPercent(a.project_sla_scores ?? []),
    quality: qualityPercent(a.project_work_quality_scores ?? []),
  }
}

function partsFrom(
  assignments: AssignmentRow[],
  reviewScores: number[],
): KpiParts {
  return {
    // Pooled by milestone weight across the scope's projects.
    sla: slaPercent(assignments.flatMap((a) => a.project_sla_scores ?? [])),
    review: reviewScores.length
      ? reviewScores.reduce((s, v) => s + v, 0) / reviewScores.length
      : null,
    quality: qualityPercent(
      assignments.flatMap((a) => a.project_work_quality_scores ?? []),
    ),
  }
}

/** 360 results per person for the cycles in scope. */
async function reviewScoresByUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  scope: KpiScope,
  userIds: string[],
) {
  const map = new Map<string, number[]>()
  if (userIds.length === 0) return map
  // One query: summaries joined to their cycle, scoped by the cycle quarter.
  const { data: summaries } = await applyScope(
    supabase
      .from("performance_summaries")
      .select("reviewee_id, overall_percentage, review_cycles!inner(quarter)")
      .not("review_cycles.quarter", "is", null)
      .in("reviewee_id", userIds),
    "review_cycles.quarter",
    scope,
  )
  for (const s of summaries ?? []) {
    if (s.overall_percentage === null) continue
    map.set(s.reviewee_id, [
      ...(map.get(s.reviewee_id) ?? []),
      Number(s.overall_percentage),
    ])
  }
  return map
}

/** One person's KPI: themselves, or anyone for stakeholders. */
export async function getEmployeeKpi(
  userId: string,
  scope: KpiScope,
): Promise<Result<EmployeeKpi>> {
  const me = await viewer()
  if (!me) return { success: false, error: "Silakan login dulu." }
  if (userId !== me.id && !me.isStakeholder) {
    return { success: false, error: "Kamu tidak punya akses ke KPI ini." }
  }
  const { supabase } = me

  const [{ data: employee }, { data: assignments, error }, reviews] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title")
        .eq("id", userId)
        .maybeSingle(),
      applyScope(
        supabase
          .from("project_assignments")
          .select(ASSIGNMENT_SELECT)
          .eq("user_id", userId),
        "projects.quarter_id",
        scope,
      ),
      reviewScoresByUser(supabase, scope, [userId]),
    ])
  if (!employee) return { success: false, error: "Anggota tidak ditemukan." }
  if (error) return { success: false, error: "Gagal memuat KPI." }

  const rows = (assignments ?? []) as unknown as AssignmentRow[]
  const parts = partsFrom(rows, reviews.get(userId) ?? [])

  return {
    success: true,
    data: {
      employee,
      parts,
      final: finalScore(parts),
      projects: rows
        .filter((a) => a.projects)
        .map(toProject)
        .sort((a, b) => a.name.localeCompare(b.name)),
    },
  }
}

export type TeamKpiRow = KpiPerson & {
  parts: KpiParts
  final: FinalScore
  projectCount: number
}

/** Everyone's KPI for a scope (stakeholders only). */
export async function getTeamKpi(
  scope: KpiScope,
): Promise<Result<TeamKpiRow[]>> {
  const me = await viewer()
  if (!me) return { success: false, error: "Silakan login dulu." }
  if (!me.isStakeholder) {
    return { success: false, error: "Hanya admin yang bisa melihat KPI tim." }
  }
  const { supabase } = me

  const { data: people, error: peopleError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, job_title")
    .eq("role", "employee")
    .order("full_name")
  if (peopleError) return { success: false, error: "Gagal memuat anggota." }
  const ids = (people ?? []).map((p: KpiPerson) => p.id)

  const [{ data: assignments }, reviews] = await Promise.all([
    applyScope(
      supabase
        .from("project_assignments")
        .select(ASSIGNMENT_SELECT)
        .in("user_id", ids),
      "projects.quarter_id",
      scope,
    ),
    reviewScoresByUser(supabase, scope, ids),
  ])

  const byUser = new Map<string, AssignmentRow[]>()
  for (const a of (assignments ?? []) as unknown as AssignmentRow[]) {
    byUser.set(a.user_id, [...(byUser.get(a.user_id) ?? []), a])
  }

  return {
    success: true,
    data: (people ?? []).map((p: KpiPerson) => {
      const rows = byUser.get(p.id) ?? []
      const parts = partsFrom(rows, reviews.get(p.id) ?? [])
      return {
        ...p,
        parts,
        final: finalScore(parts),
        projectCount: rows.length,
      }
    }),
  }
}

export type LeadTeamProject = {
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

/** Projects the viewer leads in scope, with each other member's scores. */
export async function getLeadTeam(
  scope: KpiScope,
): Promise<Result<LeadTeamProject[]>> {
  const me = await viewer()
  if (!me) return { success: false, error: "Silakan login dulu." }
  const { supabase } = me

  const { data: led } = await applyScope(
    supabase
      .from("project_assignments")
      .select("project_id, projects!inner ( quarter_id )")
      .eq("user_id", me.id)
      .eq("is_lead", true),
    "projects.quarter_id",
    scope,
  )
  const projectIds = (led ?? []).map(
    (r: { project_id: string }) => r.project_id,
  )
  if (projectIds.length === 0) return { success: true, data: [] }

  const { data: rows, error } = await supabase
    .from("project_assignments")
    .select(
      `${ASSIGNMENT_SELECT}, profiles!project_assignments_user_id_fkey ( id, full_name, avatar_url, job_title )`,
    )
    .in("project_id", projectIds)
    .neq("user_id", me.id)
  if (error) return { success: false, error: "Gagal memuat tim." }

  const byProject = new Map<string, LeadTeamProject>()
  for (const row of (rows ?? []) as unknown as (AssignmentRow & {
    profiles: KpiPerson | null
  })[]) {
    if (!row.projects || !row.profiles) continue
    const project = byProject.get(row.projects.id) ?? {
      projectId: row.projects.id,
      name: row.projects.name,
      status: row.projects.status,
      quarter: row.projects.quarter_id,
      members: [],
    }
    const p = toProject(row)
    project.members.push({
      ...row.profiles,
      assignmentId: row.id,
      role: row.role_in_project,
      sla: p.sla,
      quality: p.quality,
    })
    byProject.set(project.projectId, project)
  }
  return {
    success: true,
    data: [...byProject.values()].sort((a, b) => a.name.localeCompare(b.name)),
  }
}

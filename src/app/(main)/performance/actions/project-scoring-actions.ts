"use server"

import {
  DEFAULT_MILESTONES,
  SLA_RESULT_PERCENT,
  type SLAResult,
} from "@/entities/performance/lib/kpi"
import {
  jakartaDay,
  memberMilestones,
  qualityQuarter,
  todayJakarta,
  type Milestone,
  type PhaseRow,
  type SlaScoreRow,
} from "@/entities/performance/lib/kpi-phases"
import { createClient } from "@/shared/api/supabase/server"
import { getT } from "@/shared/i18n/server"
import { revalidatePath } from "next/cache"

export type MilestoneInput = {
  name: string
  weight: number
  result: SLAResult
}

export type CompetencyInput = {
  id: string
  name: string
  description: string | null
  isAchieved: boolean
}

export type PhaseOverride = {
  phaseId: string
  result: SLAResult
  reason: string
}

export type ScoringProject = {
  id: string
  name: string
  client: string | null
  status: string
  quarter: string | null
  start: string
  end: string
}

/** This member's tasks on the project (workspace context, not scored). */
export type MemberTasks = {
  total: number
  done: number
  /** Finished after their due date. */
  doneLate: number
  /** Still open past their due date. */
  openOverdue: number
}

export type ProjectScoring = {
  /** "phases": milestones come from project phases; "manual": old editor. */
  mode: "phases" | "manual"
  /** False until someone has saved SLA milestones for this member. */
  slaScored: boolean
  qualityScored: boolean
  /** Manual mode: the editable milestones (defaults when nothing is saved). */
  milestones: MilestoneInput[]
  /** Phase mode: one row per project phase. */
  phaseMilestones: Milestone[]
  /** Phase mode: this member's saved overrides. */
  overrides: PhaseOverride[]
  /** Quarter work quality counts in; null until hand-over. */
  qualityQuarter: string | null
  competencies: CompetencyInput[]
  project: ScoringProject | null
  /** Day the member was added to the project (Jakarta). */
  joinedOn: string | null
  today: string
  tasks: MemberTasks | null
}

type AssignmentRow = {
  user_id: string
  role_in_project: string
  created_at: string | null
  projects: {
    id: string
    name: string
    status: string | null
    quarter_id: string | null
    start_date: string
    end_date: string
    client_name: string | null
    project_phases: PhaseRow[] | null
  } | null
}

/**
 * Saved scores for one member on one project, plus the project's phases as
 * milestones when it has due dates. RLS decides who can read them
 * (stakeholders, the member, or their project lead).
 */
export async function getProjectScoring(
  assignmentId: string,
): Promise<ProjectScoring> {
  const supabase = await createClient()
  const today = todayJakarta()
  const { data: assignmentData } = await supabase
    .from("project_assignments")
    .select(
      `user_id, role_in_project, created_at,
       projects!inner (
         id, name, status, quarter_id, start_date, end_date, client_name,
         project_phases ( id, name, position, status, due_date, completed_at, sla_weight )
       )`,
    )
    .eq("id", assignmentId)
    .maybeSingle()
  const assignment = assignmentData as unknown as AssignmentRow | null
  const p = assignment?.projects ?? null

  const [{ data: sla }, { data: quality }, { data: library }, { data: tasks }] =
    await Promise.all([
      supabase
        .from("project_sla_scores")
        .select(
          "phase_id, milestone_name, weight_percentage, score_achieved, actual_result, override_reason, created_at",
        )
        .eq("assignment_id", assignmentId)
        .order("created_at"),
      supabase
        .from("project_work_quality_scores")
        .select("competency_id, is_achieved")
        .eq("assignment_id", assignmentId),
      supabase
        .from("competency_library")
        .select("id, name, description")
        .eq("role", assignment?.role_in_project ?? "")
        .order("name"),
      p && assignment
        ? supabase
            .from("project_tasks")
            .select("done, due_date, completed_at")
            .eq("project_id", p.id)
            .eq("assignee_id", assignment.user_id)
        : Promise.resolve({ data: null }),
    ])

  const scores = (sla ?? []) as SlaScoreRow[]
  const phases = p?.project_phases ?? []
  const joinedOn = assignment?.created_at
    ? jakartaDay(assignment.created_at)
    : null
  const { mode, milestones } = memberMilestones({
    phases,
    scores,
    projectQuarter: p?.quarter_id ?? null,
    joinedOn,
    today,
  })
  const manualRows = scores.filter((s) => s.phase_id === null)

  const achieved = new Map(
    (quality ?? []).map(
      (q: { competency_id: string; is_achieved: boolean | null }) => [
        q.competency_id,
        q.is_achieved === true,
      ],
    ),
  )

  const taskRows = (tasks ?? []) as {
    done: boolean
    due_date: string | null
    completed_at: string | null
  }[]

  return {
    mode,
    slaScored: mode === "phases" || manualRows.length > 0,
    qualityScored: (quality ?? []).length > 0,
    milestones: manualRows.length
      ? manualRows.map((s) => ({
          name: s.milestone_name,
          weight: Number(s.weight_percentage) || 0,
          result:
            s.actual_result && s.actual_result in SLA_RESULT_PERCENT
              ? (s.actual_result as SLAResult)
              : "On Time",
        }))
      : DEFAULT_MILESTONES.map((m) => ({ ...m, result: "On Time" })),
    phaseMilestones: mode === "phases" ? milestones : [],
    overrides: scores
      .filter(
        (s) =>
          s.phase_id &&
          s.actual_result &&
          s.actual_result in SLA_RESULT_PERCENT,
      )
      .map((s) => ({
        phaseId: s.phase_id!,
        result: s.actual_result as SLAResult,
        reason: s.override_reason ?? "",
      })),
    qualityQuarter: p
      ? qualityQuarter({
          mode,
          phases,
          project: {
            status: p.status ?? "",
            quarter_id: p.quarter_id,
            end_date: p.end_date,
          },
        })
      : null,
    competencies: (library ?? []).map(
      (c: { id: string; name: string; description: string | null }) => ({
        ...c,
        isAchieved: achieved.get(c.id) ?? false,
      }),
    ),
    project: p
      ? {
          id: p.id,
          name: p.name,
          client: p.client_name,
          status: p.status ?? "Planned",
          quarter: p.quarter_id,
          start: p.start_date,
          end: p.end_date,
        }
      : null,
    joinedOn,
    today,
    tasks: tasks
      ? {
          total: taskRows.length,
          done: taskRows.filter((r) => r.done).length,
          doneLate: taskRows.filter(
            (r) =>
              r.done &&
              r.due_date &&
              r.completed_at &&
              jakartaDay(r.completed_at) > r.due_date,
          ).length,
          openOverdue: taskRows.filter(
            (r) => !r.done && r.due_date && today > r.due_date,
          ).length,
        }
      : null,
  }
}

type SaveResult = { success: boolean; error?: string }

async function rpcError(
  error: { code?: string; message: string } | null,
  fallback: string,
): Promise<SaveResult> {
  if (!error) {
    revalidatePath("/performance", "layout")
    return { success: true }
  }
  // Our own checks raise readable Indonesian messages; hide anything else.
  const readable = ["42501", "22023"].includes(error.code ?? "")
  return { success: false, error: readable ? error.message : fallback }
}

/**
 * Saves milestones and competencies in one transaction
 * (save_assignment_scores checks the caller may score this member and that
 * the weights add up to 100). Pass `milestones: null` for phase-based
 * projects: only the competencies are saved and the SLA rows stay as they are.
 */
export async function saveProjectScores(
  assignmentId: string,
  milestones: MilestoneInput[] | null,
  competencies: { id: string; isAchieved: boolean }[],
): Promise<SaveResult> {
  const supabase = await createClient()
  const t = await getT("performance")
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: t("errLoginFirst") }

  const { error } = await supabase.rpc("save_assignment_scores", {
    p_assignment_id: assignmentId,
    p_sla: milestones
      ? milestones.map((m) => ({
          name: m.name.trim(),
          weight: m.weight,
          result: m.result,
        }))
      : null,
    p_quality: competencies.map((c) => ({
      competencyId: c.id,
      isAchieved: c.isAchieved,
    })),
  })
  return rpcError(error, t("scoresSaveFailed"))
}

/**
 * Sets (or with `override: null` removes) this member's result for one
 * phase. save_phase_overrides replaces all of the member's overrides, so the
 * others are read back and kept.
 */
export async function savePhaseOverride(
  assignmentId: string,
  phaseId: string,
  override: { result: SLAResult; reason: string } | null,
): Promise<SaveResult> {
  const supabase = await createClient()
  const t = await getT("performance")
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: t("errLoginFirst") }
  if (override && !(override.result in SLA_RESULT_PERCENT))
    return { success: false, error: t("psOverrideFailed") }
  if (override && !override.reason.trim())
    return { success: false, error: t("psReasonRequired") }

  const { data: current, error: readError } = await supabase
    .from("project_sla_scores")
    .select("phase_id, actual_result, override_reason")
    .eq("assignment_id", assignmentId)
    .not("phase_id", "is", null)
  if (readError) return { success: false, error: t("psOverrideFailed") }

  const kept = (
    (current ?? []) as {
      phase_id: string
      actual_result: string | null
      override_reason: string | null
    }[]
  )
    .filter(
      (r) =>
        r.phase_id !== phaseId &&
        r.actual_result &&
        r.actual_result in SLA_RESULT_PERCENT &&
        r.override_reason?.trim(),
    )
    .map((r) => ({
      phaseId: r.phase_id,
      result: r.actual_result,
      reason: r.override_reason!.trim(),
    }))
  const next = override
    ? [
        ...kept,
        { phaseId, result: override.result, reason: override.reason.trim() },
      ]
    : kept

  const { error } = await supabase.rpc("save_phase_overrides", {
    p_assignment_id: assignmentId,
    p_overrides: next,
  })
  return rpcError(error, t("psOverrideFailed"))
}

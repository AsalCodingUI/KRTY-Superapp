"use server"

import {
  DEFAULT_MILESTONES,
  type SLAResult,
} from "@/entities/performance/lib/kpi"
import { createClient } from "@/shared/api/supabase/server"
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

export type ProjectScoring = {
  /** False until someone has saved SLA milestones for this member. */
  slaScored: boolean
  qualityScored: boolean
  milestones: MilestoneInput[]
  competencies: CompetencyInput[]
}

/**
 * Saved scores for one member on one project, or the default milestones and
 * the role's competency list when nothing is saved yet. RLS decides who can
 * read them (stakeholders, the member, or their project lead).
 */
export async function getProjectScoring(
  assignmentId: string,
  roleInProject: string,
): Promise<ProjectScoring> {
  const supabase = await createClient()
  const [{ data: sla }, { data: quality }, { data: library }] =
    await Promise.all([
      supabase
        .from("project_sla_scores")
        .select("milestone_name, weight_percentage, actual_result, created_at")
        .eq("assignment_id", assignmentId)
        .order("created_at"),
      supabase
        .from("project_work_quality_scores")
        .select("competency_id, is_achieved")
        .eq("assignment_id", assignmentId),
      supabase
        .from("competency_library")
        .select("id, name, description")
        .eq("role", roleInProject)
        .order("name"),
    ])

  const achieved = new Map(
    (quality ?? []).map(
      (q: { competency_id: string; is_achieved: boolean }) => [
        q.competency_id,
        q.is_achieved,
      ],
    ),
  )

  return {
    slaScored: (sla ?? []).length > 0,
    qualityScored: (quality ?? []).length > 0,
    milestones: sla?.length
      ? sla.map(
          (s: {
            milestone_name: string
            weight_percentage: number
            actual_result: string
          }) => ({
            name: s.milestone_name,
            weight: Number(s.weight_percentage),
            result: (s.actual_result as SLAResult) ?? "On Time",
          }),
        )
      : DEFAULT_MILESTONES.map((m) => ({ ...m, result: "On Time" })),
    competencies: (library ?? []).map(
      (c: { id: string; name: string; description: string | null }) => ({
        ...c,
        isAchieved: achieved.get(c.id) ?? false,
      }),
    ),
  }
}

/**
 * Saves milestones and competencies in one transaction
 * (save_assignment_scores checks the caller may score this member and that
 * the weights add up to 100).
 */
export async function saveProjectScores(
  assignmentId: string,
  milestones: MilestoneInput[],
  competencies: { id: string; isAchieved: boolean }[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Silakan login dulu." }

  const { error } = await supabase.rpc("save_assignment_scores", {
    p_assignment_id: assignmentId,
    p_sla: milestones.map((m) => ({
      name: m.name.trim(),
      weight: m.weight,
      result: m.result,
    })),
    p_quality: competencies.map((c) => ({
      competencyId: c.id,
      isAchieved: c.isAchieved,
    })),
  })

  if (error) {
    // Our own checks raise readable Indonesian messages; hide anything else.
    const readable = ["42501", "22023"].includes(error.code ?? "")
    return {
      success: false,
      error: readable ? error.message : "Gagal menyimpan nilai.",
    }
  }

  revalidatePath("/performance", "layout")
  return { success: true }
}

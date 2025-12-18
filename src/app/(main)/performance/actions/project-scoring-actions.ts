"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type MilestoneData = {
    name: string
    weight: number
    result: string
    scoreAchieved: number
    targetPercentage: number
}

export async function getProjectScores(assignmentId: string) {
    const supabase = await createClient()

    // Get SLA scores
    const { data: slaScores, error: slaError } = await supabase
        .from("project_sla_scores")
        .select("*")
        .eq("assignment_id", assignmentId)

    if (slaError) {
        console.error("Error fetching SLA scores:", slaError)
        return { success: false, error: slaError.message }
    }

    // Get work quality scores
    const { data: qualityScores, error: qualityError } = await supabase
        .from("project_work_quality_scores")
        .select(`
            *,
            competency_library (
                id,
                name,
                description,
                role
            )
        `)
        .eq("assignment_id", assignmentId)

    if (qualityError) {
        console.error("Error fetching quality scores:", qualityError)
        return { success: false, error: qualityError.message }
    }

    return {
        success: true,
        data: {
            slaScores: slaScores || [],
            qualityScores: qualityScores || [],
        },
    }
}

export async function saveSLAScores(assignmentId: string, milestones: MilestoneData[]) {
    const supabase = await createClient()

    // Delete existing SLA scores for this assignment
    await supabase.from("project_sla_scores").delete().eq("assignment_id", assignmentId)

    // Insert new scores
    const scoresData = milestones.map((milestone) => ({
        assignment_id: assignmentId,
        milestone_name: milestone.name,
        weight_percentage: milestone.weight,
        actual_result: milestone.result,
        score_achieved: milestone.scoreAchieved,
        target_percentage: milestone.targetPercentage,
    }))

    const { error } = await supabase.from("project_sla_scores").insert(scoresData)

    if (error) {
        console.error("Error saving SLA scores:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/performance")
    return { success: true }
}

export async function saveWorkQualityScores(
    assignmentId: string,
    competencies: { competencyId: string; isAchieved: boolean }[]
) {
    const supabase = await createClient()

    // Delete existing quality scores for this assignment
    await supabase.from("project_work_quality_scores").delete().eq("assignment_id", assignmentId)

    // Insert new scores
    const scoresData = competencies.map((comp) => ({
        assignment_id: assignmentId,
        competency_id: comp.competencyId,
        is_achieved: comp.isAchieved,
    }))

    const { error } = await supabase.from("project_work_quality_scores").insert(scoresData)

    if (error) {
        console.error("Error saving quality scores:", error)
        return { success: false, error: error.message }
    }

    revalidatePath("/performance")
    return { success: true }
}

export async function getCompetenciesForRole(role: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("competency_library")
        .select("*")
        .eq("role", role)
        .order("name", { ascending: true })

    if (error) {
        console.error("Error fetching competencies:", error)
        return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
}

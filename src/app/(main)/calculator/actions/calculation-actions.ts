"use server"

import { createClient } from "@/shared/api/supabase/server"
import type {
  FreelanceMember,
  Phase,
  SquadMember,
} from "@/page-slices/calculator/ui/types"

export interface SaveCalculationPayload {
  projectId: string
  title: string
  revenueUsd: number
  exchangeRate: number
  hoursPerDay: number
  targetMargin: number
  phases: Phase[]
  squad: SquadMember[]
  freelanceSquad: FreelanceMember[]
}

export async function getCalculationsByProject(projectId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("project_calculations")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false as const, error: error.message, data: [] }
  }

  return { success: true as const, data: data || [] }
}

export async function saveCalculation(payload: SaveCalculationPayload) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("project_calculations")
    .insert({
      project_id: payload.projectId,
      title: payload.title,
      revenue_usd: payload.revenueUsd,
      exchange_rate: payload.exchangeRate,
      hours_per_day: payload.hoursPerDay,
      target_margin: payload.targetMargin,
      phases: payload.phases as unknown as Record<string, unknown>,
      squad: payload.squad as unknown as Record<string, unknown>,
      freelance_squad: payload.freelanceSquad as unknown as Record<
        string,
        unknown
      >,
    })
    .select()
    .single()

  if (error) {
    return { success: false as const, error: error.message }
  }

  return { success: true as const, data }
}

export async function updateCalculation(
  id: string,
  payload: Partial<SaveCalculationPayload>,
) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (payload.projectId !== undefined) updateData.project_id = payload.projectId
  if (payload.title !== undefined) updateData.title = payload.title
  if (payload.revenueUsd !== undefined)
    updateData.revenue_usd = payload.revenueUsd
  if (payload.exchangeRate !== undefined)
    updateData.exchange_rate = payload.exchangeRate
  if (payload.hoursPerDay !== undefined)
    updateData.hours_per_day = payload.hoursPerDay
  if (payload.targetMargin !== undefined)
    updateData.target_margin = payload.targetMargin
  if (payload.phases !== undefined) updateData.phases = payload.phases
  if (payload.squad !== undefined) updateData.squad = payload.squad
  if (payload.freelanceSquad !== undefined)
    updateData.freelance_squad = payload.freelanceSquad

  const { data, error } = await supabase
    .from("project_calculations")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false as const, error: error.message }
  }

  return { success: true as const, data }
}

export async function deleteCalculation(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("project_calculations")
    .delete()
    .eq("id", id)

  if (error) {
    return { success: false as const, error: error.message }
  }

  return { success: true as const }
}

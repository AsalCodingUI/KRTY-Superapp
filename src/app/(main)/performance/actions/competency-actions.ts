"use server"

import { createClient } from "@/shared/api/supabase/server"
import { getT } from "@/shared/i18n/server"
import { getAdminContext } from "@/shared/lib/admin-server"
import type { Database } from "@/shared/types/database.types"

type Role = Database["public"]["Enums"]["project_role_enum"]

export type CompetencyRow = {
  id: string
  role: Role
  name: string
  description: string | null
  /** How many saved project scores use it (deleting would erase them). */
  usage: number
}

type Result = { success: boolean; error?: string }

async function admin() {
  return (await getAdminContext())?.supabase ?? null
}

export async function getCompetencies(): Promise<CompetencyRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("competency_library")
    .select("id, role, name, description, project_work_quality_scores(count)")
    .order("role")
    .order("name")
  return (data ?? []).map(
    (c: {
      id: string
      role: Role
      name: string
      description: string | null
      project_work_quality_scores: { count: number }[]
    }) => ({
      id: c.id,
      role: c.role,
      name: c.name,
      description: c.description,
      usage: c.project_work_quality_scores?.[0]?.count ?? 0,
    }),
  )
}

export async function saveCompetency(input: {
  id?: string
  role: Role
  name: string
  description: string
}): Promise<Result> {
  const [supabase, t] = await Promise.all([admin(), getT("performance")])
  if (!supabase) return { success: false, error: t("errAdminOnly") }
  const name = input.name.trim()
  if (!name) return { success: false, error: t("errCompetencyNameRequired") }
  const row = {
    role: input.role,
    name,
    description: input.description.trim() || null,
  }
  const { error } = input.id
    ? await supabase.from("competency_library").update(row).eq("id", input.id)
    : await supabase.from("competency_library").insert(row)
  if (error?.code === "23505") {
    return { success: false, error: t("errCompetencyExists") }
  }
  if (error) return { success: false, error: t("errCompetencySaveFailed") }
  return { success: true }
}

/** Refuses when saved scores use it: deleting would rewrite past KPIs. */
export async function deleteCompetency(id: string): Promise<Result> {
  const [supabase, t] = await Promise.all([admin(), getT("performance")])
  if (!supabase) return { success: false, error: t("errAdminOnly") }
  const { count } = await supabase
    .from("project_work_quality_scores")
    .select("id", { count: "exact", head: true })
    .eq("competency_id", id)
  if (count) {
    return {
      success: false,
      error: t("errCompetencyInUse", { n: count }),
    }
  }
  const { error } = await supabase
    .from("competency_library")
    .delete()
    .eq("id", id)
  if (error) return { success: false, error: t("errCompetencyDeleteFailed") }
  return { success: true }
}

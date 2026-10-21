"use server"

import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const id = await resolveEffectiveUserId(supabase, user.id, user.email)
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", id)
    .maybeSingle()
  return canManageByRole(data?.role) ? supabase : null
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
  const supabase = await admin()
  if (!supabase) return { success: false, error: "Khusus admin." }
  const name = input.name.trim()
  if (!name) return { success: false, error: "Nama kompetensi wajib diisi." }
  const row = {
    role: input.role,
    name,
    description: input.description.trim() || null,
  }
  const { error } = input.id
    ? await supabase.from("competency_library").update(row).eq("id", input.id)
    : await supabase.from("competency_library").insert(row)
  if (error?.code === "23505") {
    return { success: false, error: "Kompetensi dengan nama itu sudah ada." }
  }
  if (error) return { success: false, error: "Gagal menyimpan kompetensi." }
  return { success: true }
}

/** Refuses when saved scores use it: deleting would rewrite past KPIs. */
export async function deleteCompetency(id: string): Promise<Result> {
  const supabase = await admin()
  if (!supabase) return { success: false, error: "Khusus admin." }
  const { count } = await supabase
    .from("project_work_quality_scores")
    .select("id", { count: "exact", head: true })
    .eq("competency_id", id)
  if (count) {
    return {
      success: false,
      error: `Sudah dipakai di ${count} penilaian, jadi tidak bisa dihapus.`,
    }
  }
  const { error } = await supabase
    .from("competency_library")
    .delete()
    .eq("id", id)
  if (error) return { success: false, error: "Gagal menghapus kompetensi." }
  return { success: true }
}

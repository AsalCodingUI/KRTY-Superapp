"use server"

import type { Database } from "@/shared/types/database.types"
import { createClient } from "@/shared/api/supabase/server"

type Competency = Database["public"]["Tables"]["competency_library"]["Row"]

export async function getCompetencies(roleFilter?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("competency_library")
    .select("*")
    .order("role", { ascending: true })
    .order("name", { ascending: true })

  // Apply role filter if provided
  if (roleFilter && roleFilter !== "All") {
    query = query.eq("role", roleFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching competencies:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data as Competency[] }
}

export async function createCompetency(formData: FormData) {
  const supabase = await createClient()

  const competencyData = {
    role: formData.get(
      "role",
    ) as Database["public"]["Enums"]["project_role_enum"],
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
  }

  const { data, error } = await supabase
    .from("competency_library")
    .insert(competencyData)
    .select()
    .single()

  if (error) {
    console.error("Error creating competency:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function updateCompetency(id: string, formData: FormData) {
  const supabase = await createClient()

  const competencyData = {
    role: formData.get(
      "role",
    ) as Database["public"]["Enums"]["project_role_enum"],
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
  }

  const { data, error } = await supabase
    .from("competency_library")
    .update(competencyData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating competency:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function deleteCompetency(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("competency_library")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting competency:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

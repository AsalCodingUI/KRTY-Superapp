"use server"

import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import type { Database } from "@/shared/types/database.types"
import { revalidatePath } from "next/cache"

/**
 * Project management (moved here from Performance › List Project). Same rule
 * as the database: stakeholders create, edit, staff and delete projects.
 */

type ProjectRole = Database["public"]["Enums"]["project_role_enum"]
type ProjectStatus = Database["public"]["Enums"]["project_status_enum"]
type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

export type ProjectMemberInput = {
  userId: string
  role: ProjectRole
  isLead: boolean
}

export type ProjectInput = {
  name: string
  description: string
  start_date: string
  end_date: string
  status?: ProjectStatus
  members: ProjectMemberInput[]
}

export type EditableProject = {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  status: ProjectStatus
  members: (ProjectMemberInput & {
    full_name: string | null
    avatar_url: string | null
    job_title: string | null
    /** Has saved SLA or competency scores (removing would erase them). */
    scored: boolean
  })[]
}

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

function validate(input: ProjectInput): string | null {
  if (!input.name.trim()) return "Nama project wajib diisi."
  if (!input.start_date || !input.end_date)
    return "Tanggal mulai dan selesai wajib diisi."
  if (input.end_date < input.start_date)
    return "Tanggal selesai harus setelah mulai."
  if (input.members.filter((m) => m.isLead).length > 1)
    return "Lead hanya satu orang."
  return null
}

export async function getEditableProject(
  id: string,
): Promise<EditableProject | null> {
  const supabase = await admin()
  if (!supabase) return null
  const { data } = await supabase
    .from("projects")
    .select(
      `id, name, description, start_date, end_date, status,
       project_assignments (
         id, user_id, role_in_project, is_lead,
         profiles!project_assignments_user_id_fkey ( full_name, avatar_url, job_title ),
         project_sla_scores ( count ),
         project_work_quality_scores ( count )
       )`,
    )
    .eq("id", id)
    .maybeSingle()
  if (!data) return null
  type Row = {
    user_id: string
    role_in_project: ProjectRole
    is_lead: boolean | null
    profiles: {
      full_name: string | null
      avatar_url: string | null
      job_title: string | null
    } | null
    project_sla_scores: { count: number }[]
    project_work_quality_scores: { count: number }[]
  }
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    start_date: data.start_date,
    end_date: data.end_date,
    status: data.status,
    members: ((data.project_assignments ?? []) as unknown as Row[]).map(
      (a) => ({
        userId: a.user_id,
        role: a.role_in_project,
        isLead: a.is_lead === true,
        full_name: a.profiles?.full_name ?? null,
        avatar_url: a.profiles?.avatar_url ?? null,
        job_title: a.profiles?.job_title ?? null,
        scored:
          (a.project_sla_scores?.[0]?.count ?? 0) +
            (a.project_work_quality_scores?.[0]?.count ?? 0) >
          0,
      }),
    ),
  }
}

export async function getAssignablePeople() {
  const supabase = await admin()
  if (!supabase) return []
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, job_title, role")
    .order("full_name")
  return data ?? []
}

/** Create or update a project and make its team match `members`. */
export async function saveProject(
  id: string | null,
  input: ProjectInput,
): Promise<Result<{ id: string }>> {
  const supabase = await admin()
  if (!supabase) return { success: false, error: "Khusus admin." }
  const invalid = validate(input)
  if (invalid) return { success: false, error: invalid }

  const fields = {
    name: input.name.trim(),
    description: input.description.trim() || null,
    start_date: input.start_date,
    end_date: input.end_date,
    ...(id && input.status ? { status: input.status } : {}),
  }
  const { data: project, error } = id
    ? await supabase
        .from("projects")
        .update(fields)
        .eq("id", id)
        .select("id")
        .maybeSingle()
    : await supabase.from("projects").insert(fields).select("id").single()
  if (error || !project)
    return { success: false, error: "Gagal menyimpan project." }

  const { data: current } = await supabase
    .from("project_assignments")
    .select("id, user_id")
    .eq("project_id", project.id)
  const currentByUser = new Map<string, string>(
    ((current ?? []) as { id: string; user_id: string }[]).map((a) => [
      a.user_id,
      a.id,
    ]),
  )
  const wanted = new Set(input.members.map((m) => m.userId))

  const removed = [...currentByUser.entries()]
    .filter(([userId]) => !wanted.has(userId))
    .map(([, assignmentId]) => assignmentId)
  if (removed.length) {
    const { error: removeError } = await supabase
      .from("project_assignments")
      .delete()
      .in("id", removed)
    if (removeError)
      return { success: false, error: "Gagal mengeluarkan anggota." }
  }

  for (const m of input.members) {
    const row = {
      project_id: project.id,
      user_id: m.userId,
      role_in_project: m.role,
      is_lead: m.isLead,
    }
    const existing = currentByUser.get(m.userId)
    const { error: memberError } = existing
      ? await supabase
          .from("project_assignments")
          .update(row)
          .eq("id", existing)
      : await supabase.from("project_assignments").insert(row)
    if (memberError)
      return { success: false, error: "Gagal menyimpan anggota tim." }
  }

  revalidatePath("/projects", "layout")
  revalidatePath("/performance", "layout")
  return { success: true, data: { id: project.id } }
}

export async function setProjectStatus(
  id: string,
  status: ProjectStatus,
): Promise<Result> {
  const supabase = await admin()
  if (!supabase) return { success: false, error: "Khusus admin." }
  const { data, error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id)
    .select("id")
  if (error || !data?.length)
    return { success: false, error: "Gagal mengubah status." }
  revalidatePath("/projects", "layout")
  return { success: true }
}

/** Permanent; also deletes the team's scores for this project. */
export async function deleteProject(id: string): Promise<Result> {
  const supabase = await admin()
  if (!supabase) return { success: false, error: "Khusus admin." }
  // Files in storage aren't cascaded with the rows; remove them first.
  const [{ data: files }, { data: docs }] = await Promise.all([
    supabase.from("project_files").select("file_path").eq("project_id", id),
    supabase.from("project_documents").select("file_path").eq("project_id", id),
  ])
  const paths = [...(files ?? []), ...(docs ?? [])]
    .map((f: { file_path: string | null }) => f.file_path)
    .filter((path): path is string => Boolean(path))
  if (paths.length) await supabase.storage.from("project-files").remove(paths)
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .select("id")
  if (error || !data?.length)
    return { success: false, error: "Gagal menghapus project." }
  revalidatePath("/projects", "layout")
  revalidatePath("/performance", "layout")
  return { success: true }
}

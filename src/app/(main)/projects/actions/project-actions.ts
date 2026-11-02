"use server"

import { createClient } from "@/shared/api/supabase/server"
import {
  accessLevel,
  canRunProjects,
  type AccessLevel,
} from "@/shared/config/access"
import { getT } from "@/shared/i18n/server"
import { getProjectManagerContext } from "@/shared/lib/admin-server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import type { Database } from "@/shared/types/database.types"
import { revalidatePath } from "next/cache"

/**
 * Project management (moved here from Performance › List Project). Same rule
 * as the database: stakeholders create, edit, staff and delete projects; PMs
 * create projects, and edit, staff, move and delete the ones they're on
 * (saved scores stay: a scored member, or a project with scores, is a
 * stakeholder's to remove).
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
  /** New projects only: the process to copy (null = the default one). */
  processId?: string | null
  /** New projects only: no phases at all (an ongoing project). */
  noPhases?: boolean
  /** project_categories.id, or null for none. */
  categoryId?: string | null
  members: ProjectMemberInput[]
}

export type EditableProject = {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  status: ProjectStatus
  category_id: string | null
  members: (ProjectMemberInput & {
    full_name: string | null
    avatar_url: string | null
    job_title: string | null
    /** Has saved SLA or competency scores (removing would erase them). */
    scored: boolean
  })[]
}

type Db = Awaited<ReturnType<typeof createClient>>

/** The effective user when they run projects (PM or stakeholder), else null. */
async function manager(): Promise<{
  supabase: Db
  userId: string
  level: AccessLevel
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const userId = await resolveEffectiveUserId(supabase, user.id, user.email)
  const { data } = await supabase
    .from("profiles")
    .select("role, job_title")
    .eq("id", userId)
    .maybeSingle()
  const level = accessLevel(data)
  return canRunProjects(level) ? { supabase, userId, level } : null
}

async function validate(input: ProjectInput): Promise<string | null> {
  const t = await getT("projects")
  if (!input.name.trim()) return t("errNameRequired")
  if (!input.start_date || !input.end_date) return t("errDatesRequired")
  if (input.end_date < input.start_date) return t("errEndBeforeStart")
  if (input.members.filter((m) => m.isLead).length > 1) return t("errOneLead")
  return null
}

export async function getEditableProject(
  id: string,
): Promise<EditableProject | null> {
  const supabase = (await getProjectManagerContext(id))?.supabase
  if (!supabase) return null
  const { data } = await supabase
    .from("projects")
    .select(
      `id, name, description, start_date, end_date, status, category_id,
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
    category_id: data.category_id ?? null,
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
  const supabase = (await manager())?.supabase
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
  // PMs create, and edit the projects they're on.
  const [t, ctx] = await Promise.all([
    getT("projects"),
    id ? getProjectManagerContext(id) : manager(),
  ])
  if (!ctx) return { success: false, error: t("errAdminOnly") }
  const { supabase } = ctx
  const invalid = await validate(input)
  if (invalid) return { success: false, error: invalid }
  // A PM stays on the team of a project they create or edit (the DB adds
  // them to a new one; dropping them would leave a project they can't open).
  if (
    ctx.level === "pm" &&
    !input.members.some((m) => m.userId === ctx.userId)
  ) {
    input = {
      ...input,
      members: [
        { userId: ctx.userId, role: "Project Manager", isLead: false },
        ...input.members,
      ],
    }
  }

  const fields = {
    name: input.name.trim(),
    description: input.description.trim() || null,
    start_date: input.start_date,
    end_date: input.end_date,
    // New projects start as "Belum mulai"; the status is edited later.
    ...(id
      ? input.status
        ? { status: input.status }
        : {}
      : { status: "Planned" as const }),
    ...(!id && input.noPhases
      ? { phases_off: true }
      : !id && input.processId
        ? { process_id: input.processId }
        : {}),
    ...(input.categoryId !== undefined
      ? { category_id: input.categoryId }
      : {}),
  }
  // New: the id is made here so the insert needs no RETURNING (a PM can only
  // read the row once the DB has put them on its team).
  let project: { id: string } | null = null
  if (id) {
    const { data, error } = await supabase
      .from("projects")
      .update(fields)
      .eq("id", id)
      .select("id")
      .maybeSingle()
    if (!error) project = data
  } else {
    const newId = crypto.randomUUID()
    const { error } = await supabase
      .from("projects")
      .insert({ id: newId, ...fields })
    if (!error) project = { id: newId }
  }
  if (!project) return { success: false, error: t("errSaveProject") }

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
    const { data: gone, error: removeError } = await supabase
      .from("project_assignments")
      .delete()
      .in("id", removed)
      .select("id")
    if (removeError) return { success: false, error: t("errRemoveMember") }
    // RLS keeps members with saved scores from a PM (removing erases them).
    if ((gone?.length ?? 0) < removed.length)
      return { success: false, error: t("errRemoveScoredMember") }
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
    if (memberError) return { success: false, error: t("errSaveMember") }
  }

  revalidatePath("/projects", "layout")
  revalidatePath("/performance", "layout")
  return { success: true, data: { id: project.id } }
}

export async function setProjectStatus(
  id: string,
  status: ProjectStatus,
): Promise<Result> {
  // Stakeholders, and PMs on their own projects (RLS + trigger enforce it).
  const [t, ctx] = await Promise.all([getT("projects"), manager()])
  if (!ctx) return { success: false, error: t("errAdminOnly") }
  const { supabase } = ctx
  const { data, error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id)
    .select("id")
  if (error || !data?.length)
    return { success: false, error: t("errChangeStatus") }
  revalidatePath("/projects", "layout")
  return { success: true }
}

/** Permanent; also deletes the team's scores for this project. */
export async function deleteProject(id: string): Promise<Result> {
  // Stakeholders, and the project's PMs while nobody has saved scores
  // (deleting would erase them; RLS refuses it too).
  const [t, ctx] = await Promise.all([
    getT("projects"),
    getProjectManagerContext(id),
  ])
  if (!ctx) return { success: false, error: t("errAdminOnly") }
  const { supabase } = ctx
  if (ctx.level === "pm") {
    const { data: scored, error: scoredError } = await supabase.rpc(
      "project_has_scores" as never,
      { p_project_id: id } as never,
    )
    if (scoredError || scored)
      return { success: false, error: t("errDeleteScoredProject") }
  }
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
    return { success: false, error: t("errDeleteProject") }
  revalidatePath("/projects", "layout")
  revalidatePath("/performance", "layout")
  return { success: true }
}

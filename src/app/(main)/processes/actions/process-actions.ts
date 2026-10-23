"use server"

import { createClient } from "@/shared/api/supabase/server"
import { getT } from "@/shared/i18n/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import { revalidatePath } from "next/cache"

/** Processes (project templates) are stakeholder-only; RLS enforces the same. */

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

type Db = Awaited<ReturnType<typeof createClient>>

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
  return canManageByRole(data?.role) ? { supabase, userId: id } : null
}

/** Runs `fn` as a stakeholder; any thrown/returned DB error becomes errSave. */
async function run<T>(
  fn: (db: Db, userId: string) => Promise<Result<T>>,
): Promise<Result<T>> {
  const t = await getT("processes")
  const ctx = await admin()
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  try {
    const result = await fn(ctx.supabase, ctx.userId)
    if (result.success) revalidatePath("/processes", "layout")
    return result
  } catch {
    return { success: false, error: t("errSave") }
  }
}

const clean = (v: string | null | undefined) => v?.trim() || null

async function fail(key: "errSave" | "errDuplicate" | "errNameRequired") {
  const t = await getT("processes")
  return { success: false as const, error: t(key) }
}

/* ---------- Processes ---------- */

export async function createProcess(input: {
  name: string
  description: string
  copyFrom: string | null
}): Promise<Result<{ id: string }>> {
  return run(async (db, userId) => {
    const name = input.name.trim()
    if (!name) return fail("errNameRequired")
    const { data, error } = await db
      .from("processes")
      .insert({
        name: name.slice(0, 80),
        description: clean(input.description)?.slice(0, 500) ?? null,
        created_by: userId,
      })
      .select("id")
      .single()
    if (error || !data)
      return fail(error?.code === "23505" ? "errDuplicate" : "errSave")
    if (input.copyFrom) await copyTree(db, input.copyFrom, data.id)
    return { success: true, data: { id: data.id } }
  })
}

async function copyTree(db: Db, fromId: string, toId: string) {
  const { data: phases } = await db
    .from("process_phases")
    .select(
      "id, name, description, position, process_steps ( id, title, description, position, process_tasks ( title, position ) )",
    )
    .eq("process_id", fromId)
  type Tree = {
    name: string
    description: string | null
    position: number
    process_steps: {
      title: string
      description: string | null
      position: number
      process_tasks: { title: string; position: number }[]
    }[]
  }
  for (const ph of (phases ?? []) as unknown as Tree[]) {
    const { data: newPhase, error } = await db
      .from("process_phases")
      .insert({
        process_id: toId,
        name: ph.name,
        description: ph.description,
        position: ph.position,
      })
      .select("id")
      .single()
    if (error || !newPhase) throw error
    for (const st of ph.process_steps ?? []) {
      const { data: newStep, error: stepError } = await db
        .from("process_steps")
        .insert({
          phase_id: newPhase.id,
          title: st.title,
          description: st.description,
          position: st.position,
        })
        .select("id")
        .single()
      if (stepError || !newStep) throw stepError
      const tasks = (st.process_tasks ?? []).map((task) => ({
        step_id: newStep.id,
        title: task.title,
        position: task.position,
      }))
      if (tasks.length) {
        const { error: taskError } = await db
          .from("process_tasks")
          .insert(tasks)
        if (taskError) throw taskError
      }
    }
  }
}

export async function updateProcess(
  id: string,
  input: { name: string; description: string },
): Promise<Result> {
  return run(async (db) => {
    const name = input.name.trim()
    if (!name) return fail("errNameRequired")
    const { error } = await db
      .from("processes")
      .update({
        name: name.slice(0, 80),
        description: clean(input.description)?.slice(0, 500) ?? null,
      })
      .eq("id", id)
    if (error) return fail(error.code === "23505" ? "errDuplicate" : "errSave")
    return { success: true }
  })
}

/** The default process is used for new projects that don't pick one. */
export async function setDefaultProcess(id: string): Promise<Result> {
  return run(async (db) => {
    const { error: clearError } = await db
      .from("processes")
      .update({ is_default: false })
      .eq("is_default", true)
      .neq("id", id)
    if (clearError) return fail("errSave")
    const { error } = await db
      .from("processes")
      .update({ is_default: true })
      .eq("id", id)
    if (error) return fail("errSave")
    return { success: true }
  })
}

/** Projects made from it keep their phases; they only lose the link. */
export async function deleteProcess(id: string): Promise<Result> {
  return run(async (db) => {
    const t = await getT("processes")
    const { data } = await db
      .from("processes")
      .select("is_default")
      .eq("id", id)
      .maybeSingle()
    if (data?.is_default)
      return { success: false, error: t("errDeleteDefault") }
    const { error } = await db.from("processes").delete().eq("id", id)
    if (error) return fail("errSave")
    return { success: true }
  })
}

/* ---------- Phases, steps, tasks ---------- */

type Level = "process_phases" | "process_steps" | "process_tasks"
const PARENT: Record<Level, "process_id" | "phase_id" | "step_id"> = {
  process_phases: "process_id",
  process_steps: "phase_id",
  process_tasks: "step_id",
}
const TEXT: Record<Level, "name" | "title"> = {
  process_phases: "name",
  process_steps: "title",
  process_tasks: "title",
}
const MAX: Record<Level, number> = {
  process_phases: 80,
  process_steps: 120,
  process_tasks: 200,
}

/** Adds a phase/step/task at the end (or at `at`, shifting the rest down). */
export async function addItem(
  level: Level,
  parentId: string,
  text: string,
  at?: number,
): Promise<Result<{ id: string }>> {
  return run(async (db) => {
    const value = text.trim().slice(0, MAX[level])
    if (!value) return fail("errNameRequired")
    const { data: siblings } = await db
      .from(level)
      .select("id, position")
      .eq(PARENT[level], parentId)
      .order("position")
    const list = siblings ?? []
    const index = at === undefined ? list.length : Math.min(at, list.length)
    for (const [i, row] of list.entries()) {
      const position = i < index ? i : i + 1
      if (row.position !== position)
        await db.from(level).update({ position }).eq("id", row.id)
    }
    const { data, error } = await db
      .from(level)
      .insert({
        [PARENT[level]]: parentId,
        [TEXT[level]]: value,
        position: index,
      } as never)
      .select("id")
      .single()
    if (error || !data) return fail("errSave")
    return { success: true, data: { id: (data as { id: string }).id } }
  })
}

export async function updateItem(
  level: Level,
  id: string,
  patch: { text?: string; description?: string },
): Promise<Result> {
  return run(async (db) => {
    const update: Record<string, string | null> = {}
    if (patch.text !== undefined) {
      const value = patch.text.trim().slice(0, MAX[level])
      if (!value) return fail("errNameRequired")
      update[TEXT[level]] = value
    }
    if (patch.description !== undefined && level !== "process_tasks")
      update.description = clean(patch.description)?.slice(0, 500) ?? null
    const { error } = await db
      .from(level)
      .update(update as never)
      .eq("id", id)
    if (error) return fail("errSave")
    return { success: true }
  })
}

/** Moves an item one place up (-1) or down (1) among its siblings. */
export async function moveItem(
  level: Level,
  id: string,
  direction: -1 | 1,
): Promise<Result> {
  return run(async (db) => {
    const { data: row } = await db
      .from(level)
      .select(PARENT[level])
      .eq("id", id)
      .maybeSingle()
    const parentId = (row as Record<string, string> | null)?.[PARENT[level]]
    if (!parentId) return fail("errSave")
    const { data: siblings } = await db
      .from(level)
      .select("id")
      .eq(PARENT[level], parentId)
      .order("position")
    const ids = ((siblings ?? []) as unknown as { id: string }[]).map(
      (s) => s.id,
    )
    const from = ids.indexOf(id)
    const to = from + direction
    if (from === -1 || to < 0 || to >= ids.length) return { success: true }
    ;[ids[from], ids[to]] = [ids[to], ids[from]]
    for (const [position, rowId] of ids.entries())
      await db.from(level).update({ position }).eq("id", rowId)
    return { success: true }
  })
}

export async function deleteItem(level: Level, id: string): Promise<Result> {
  return run(async (db) => {
    const { error } = await db.from(level).delete().eq("id", id)
    if (error) return fail("errSave")
    return { success: true }
  })
}

/* ---------- Projects ---------- */

/**
 * Replaces a project's phases and steps with the process (its unfinished
 * phase tasks are replaced too; finished ones stay).
 */
export async function applyProcessToProject(
  projectId: string,
  processId: string,
): Promise<Result> {
  return run(async (db) => {
    const { error } = await db.rpc("apply_process", {
      p_project_id: projectId,
      p_process_id: processId,
      p_replace: true,
    })
    if (error) return fail("errSave")
    revalidatePath(`/projects/${projectId}`, "layout")
    return { success: true }
  })
}

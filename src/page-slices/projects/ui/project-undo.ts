"use client"

import { setProjectStatus } from "@/app/(main)/projects/actions/project-actions"
import { createClient } from "@/shared/api/supabase/client"
import { registerUndo, sameValue, UndoStale } from "@/shared/undo"
import type { ProjectStatus } from "../lib/status"

/**
 * ⌘Z for a project moved to another status ("Pindahkan ke", a drag on
 * the kanban or list, the workspace header): back to `from`, through the
 * same server action, as long as it's still at `to`.
 */
export function registerProjectStatusUndo({
  projectId,
  label,
  from,
  to,
  refresh,
}: {
  projectId: string
  label: string
  from: ProjectStatus
  to: ProjectStatus
  refresh: () => unknown
}) {
  const go = async (expected: ProjectStatus, next: ProjectStatus) => {
    const { data, error } = await createClient()
      .from("projects")
      .select("status")
      .eq("id", projectId)
      .maybeSingle()
    if (error) throw error
    if (!data || !sameValue(data.status, expected)) throw new UndoStale()
    const result = await setProjectStatus(projectId, next)
    if (!result.success) throw new Error(result.error)
    await refresh()
  }
  registerUndo({
    label,
    undo: () => go(to, from),
    redo: () => go(from, to),
  })
}

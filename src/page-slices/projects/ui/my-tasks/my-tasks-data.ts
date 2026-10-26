"use client"

import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { OPEN_STATUSES, type ProjectStatus } from "../../lib/status"
import {
  keys,
  supabase,
  type TaskRow,
  type TeamMember,
} from "../workspace/data"
import { commentCountsQuery } from "../workspace/task-data"

/**
 * Tugas saya: the viewer's top-level tasks across every running project
 * they can open (RLS), plus what the task dialog needs per project (team,
 * subtasks). Same rule as the project page's "Mine" filter.
 */

export type MyProject = { id: string; name: string; status: ProjectStatus }

export type MyTasks = {
  tasks: TaskRow[]
  /** Subtasks of those tasks (anyone's). */
  subtasks: TaskRow[]
  projects: Record<string, MyProject>
  teams: Record<string, TeamMember[]>
}

export const myTasksKey = (viewerId: string | null) =>
  ["my-tasks", viewerId] as const

type Assignment = {
  id: string
  project_id: string
  role_in_project: string
  is_lead: boolean | null
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
    job_title: string | null
  } | null
}

export function useMyTasks(viewerId: string | null) {
  return useQuery({
    queryKey: myTasksKey(viewerId),
    enabled: Boolean(viewerId),
    // Tasks also change on the project pages; refetch whenever it's opened.
    staleTime: 0,
    queryFn: async (): Promise<MyTasks> => {
      const db = supabase()
      const { data: taskRows, error } = await db
        .from("project_tasks")
        .select("*")
        .eq("assignee_id", viewerId!)
        .is("parent_id", null)
      if (error) throw error
      const projectIds = [
        ...new Set(((taskRows ?? []) as TaskRow[]).map((t) => t.project_id)),
      ]
      if (projectIds.length === 0)
        return { tasks: [], subtasks: [], projects: {}, teams: {} }

      const [{ data: projectRows }, { data: assignments }] = await Promise.all([
        db
          .from("projects")
          .select("id, name, status")
          .in("id", projectIds)
          .in("status", OPEN_STATUSES),
        db
          .from("project_assignments")
          .select(
            "id, project_id, role_in_project, is_lead, profiles!project_assignments_user_id_fkey ( id, full_name, avatar_url, job_title )",
          )
          .in("project_id", projectIds),
      ])
      const projects = Object.fromEntries(
        ((projectRows ?? []) as MyProject[]).map((p) => [p.id, p]),
      )
      // Finished or archived projects drop out with their tasks.
      const tasks = ((taskRows ?? []) as TaskRow[]).filter(
        (t) => projects[t.project_id],
      )
      const { data: subRows } = tasks.length
        ? await db
            .from("project_tasks")
            .select("*")
            .in(
              "parent_id",
              tasks.map((t) => t.id),
            )
        : { data: [] }

      const teams: Record<string, TeamMember[]> = {}
      for (const a of (assignments ?? []) as unknown as Assignment[]) {
        if (!a.profiles) continue
        ;(teams[a.project_id] ??= []).push({
          assignmentId: a.id,
          ...a.profiles,
          role: a.role_in_project,
          isLead: a.is_lead === true,
        })
      }
      return {
        tasks,
        subtasks: (subRows ?? []) as TaskRow[],
        projects,
        teams,
      }
    },
  })
}

/** Comment badges, from the same per-project cache the project page uses. */
export function useMyCommentCounts(projectIds: string[]) {
  return useQueries({
    queries: projectIds.map((id) => commentCountsQuery(id)),
    combine: (results) =>
      Object.assign({}, ...results.map((r) => r.data ?? {})) as Record<
        string,
        number
      >,
  })
}

/**
 * Optimistic writes on the cross-project list: patch the cache, save, then
 * refetch it and the touched projects' own task lists.
 */
export function useMyTaskWriter(viewerId: string | null, onError: () => void) {
  const queryClient = useQueryClient()
  const key = myTasksKey(viewerId)

  const refresh = (projectIds: string[]) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: key }),
      ...[...new Set(projectIds)].map((id) =>
        queryClient.invalidateQueries({ queryKey: keys.tasks(id) }),
      ),
    ])

  const projectOf = (id: string) => {
    const data = queryClient.getQueryData<MyTasks>(key)
    return [...(data?.tasks ?? []), ...(data?.subtasks ?? [])].find(
      (t) => t.id === id,
    )?.project_id
  }

  const write = async (patches: { id: string; patch: Partial<TaskRow> }[]) => {
    if (!patches.length) return true
    await queryClient.cancelQueries({ queryKey: key })
    const before = queryClient.getQueryData<MyTasks>(key)
    const apply = (rows: TaskRow[]) =>
      rows.map((row) => {
        const hit = patches.find((p) => p.id === row.id)
        return hit ? { ...row, ...hit.patch } : row
      })
    queryClient.setQueryData<MyTasks>(key, (data) =>
      data
        ? { ...data, tasks: apply(data.tasks), subtasks: apply(data.subtasks) }
        : data,
    )
    const projectIds = patches
      .map((p) => projectOf(p.id))
      .filter((id): id is string => Boolean(id))
    const results = await Promise.all(
      patches.map(({ id, patch }) =>
        supabase().from("project_tasks").update(patch).eq("id", id),
      ),
    )
    const failed = results.some((r) => r.error)
    if (failed) {
      queryClient.setQueryData(key, before)
      onError()
    }
    refresh(projectIds)
    return !failed
  }

  return {
    write,
    patch: (id: string, patch: Partial<TaskRow>) => write([{ id, patch }]),
    refresh,
  }
}

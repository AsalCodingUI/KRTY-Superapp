"use client"

import {
  markLocalWrite,
  useRealtimeRefresh,
} from "@/shared/hooks/useRealtimeRefresh"
import { useT } from "@/shared/i18n/client"
import { registerUndo, rowsUndo } from "@/shared/undo"
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { OPEN_STATUSES, type ProjectStatus } from "../../lib/status"
import {
  keys,
  supabase,
  type TaskRow,
  type TeamMember,
} from "../workspace/data"
import {
  commentKeys,
  fetchCommentCounts,
  taskUndoRows,
} from "../workspace/task-data"

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

/**
 * Refreshes Tugas saya on changes to the viewer's tasks. Realtime can't
 * filter on "array contains", so this listens to every task the viewer may
 * read (RLS) and refreshes when the row lists them, or when it's a task the
 * list already shows (they may just have been taken off it).
 */
function useMyTasksLive(name: string, viewerId: string | null) {
  const queryClient = useQueryClient()
  useRealtimeRefresh(
    name,
    [
      {
        table: "project_tasks",
        keys: (row) => {
          const key = myTasksKey(viewerId)
          if (!row) return [key]
          const ids = row.assignee_ids
          if (Array.isArray(ids) && viewerId && ids.includes(viewerId))
            return [key]
          const shown = queryClient.getQueryData<MyTasks>(key)
          const id = String(row.id)
          const parent = row.parent_id ? String(row.parent_id) : null
          const due = queryClient
            .getQueriesData<MyDueTask[]>({ queryKey: [...key, "due"] })
            .some(([, rows]) => rows?.some((t) => t.id === id))
          return due || shown?.tasks.some((t) => t.id === id || t.id === parent)
            ? [key]
            : []
        },
      },
    ],
    Boolean(viewerId),
  )
}

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
  // Live: tasks handed to you (or changed by others) show up as they happen.
  useMyTasksLive(`my-tasks:${viewerId}`, viewerId)
  return useQuery({
    queryKey: myTasksKey(viewerId),
    enabled: Boolean(viewerId),
    // Kept live by useMyTasksLive (realtime), so reopening within 30s
    // needn't refetch it all again.
    staleTime: 30_000,
    queryFn: async (): Promise<MyTasks> => {
      const db = supabase()
      const { data: taskRows, error } = await db
        .from("project_tasks")
        .select("*")
        .contains("assignee_ids", [viewerId!])
        .is("parent_id", null)
      if (error) throw error
      const projectIds = [
        ...new Set(((taskRows ?? []) as TaskRow[]).map((t) => t.project_id)),
      ]
      if (projectIds.length === 0)
        return { tasks: [], subtasks: [], projects: {}, teams: {} }

      // Subtasks come along with the projects and teams (one round trip,
      // not two); those under a closed project's task are dropped below.
      const [{ data: projectRows }, { data: assignments }, { data: subRows }] =
        await Promise.all([
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
          db
            .from("project_tasks")
            .select("*")
            .in(
              "parent_id",
              ((taskRows ?? []) as TaskRow[]).map((t) => t.id),
            ),
        ])
      const projects = Object.fromEntries(
        ((projectRows ?? []) as MyProject[]).map((p) => [p.id, p]),
      )
      // Finished or archived projects drop out with their tasks.
      const tasks = ((taskRows ?? []) as TaskRow[]).filter(
        (t) => projects[t.project_id],
      )
      const taskIds = new Set(tasks.map((t) => t.id))

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
        subtasks: ((subRows ?? []) as TaskRow[]).filter(
          (s) => s.parent_id && taskIds.has(s.parent_id),
        ),
        projects,
        teams,
      }
    },
  })
}

/** A deadline on the personal calendar: an open task of yours that's due. */
export type MyDueTask = Pick<
  TaskRow,
  "id" | "project_id" | "title" | "due_date" | "done"
> & { projectName: string }

/**
 * The calendar's slice of Tugas saya: your open top-level tasks due within
 * `from`..`to` (yyyy-MM-dd) in running projects, just the columns a
 * deadline needs. Under the Tugas saya key, so what refreshes that list
 * (writes, the live feed) refreshes this too.
 */
export function useMyDueTasks(
  viewerId: string | null,
  from: string,
  to: string,
) {
  useMyTasksLive(`my-due-tasks:${viewerId}`, viewerId)
  return useQuery({
    queryKey: [...myTasksKey(viewerId), "due", from, to],
    enabled: Boolean(viewerId),
    // Kept live by useMyTasksLive (realtime), so reopening within 30s
    // needn't refetch it all again.
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<MyDueTask[]> => {
      const { data, error } = await supabase()
        .from("project_tasks")
        .select(
          "id, project_id, title, due_date, done, project:projects!inner ( name, status )",
        )
        .contains("assignee_ids", [viewerId!])
        .is("parent_id", null)
        .eq("done", false)
        .gte("due_date", from)
        .lte("due_date", to)
        .in("project.status" as never, OPEN_STATUSES as never)
      if (error) throw error
      return (
        (data ?? []) as unknown as (Omit<MyDueTask, "projectName"> & {
          project: { name: string } | null
        })[]
      ).map(({ project, ...task }) => ({
        ...task,
        projectName: project?.name ?? "",
      }))
    },
  })
}

const NO_COUNTS: Record<string, number> = {}

/** Comment badges for every listed project, counted in one request (the
 *  task dialog refreshes this along with the project's own counts). */
export function useMyCommentCounts(projectIds: string[]) {
  const ids = [...projectIds].sort()
  const { data } = useQuery({
    queryKey: commentKeys.mine(ids),
    enabled: ids.length > 0,
    queryFn: () => fetchCommentCounts(ids),
  })
  return data ?? NO_COUNTS
}

/**
 * Optimistic writes on the cross-project list: patch the cache, save, then
 * refetch it and the touched projects' own task lists.
 */
export function useMyTaskWriter(viewerId: string | null, onError: () => void) {
  const queryClient = useQueryClient()
  const tu = useT("undo")
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
    // ⌘Z takes it back (shared/undo): the fields as they were.
    const undoRows =
      before && taskUndoRows([...before.tasks, ...before.subtasks], patches)
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
    // refresh() refetches these; the rows' Realtime echo doesn't again.
    const markEcho = () =>
      markLocalWrite(
        "project_tasks",
        patches.map((p) => p.id),
        [key, ...projectIds.map((id) => keys.tasks(id))],
      )
    markEcho()
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
    markEcho()
    refresh(projectIds)
    if (!failed && undoRows?.rows.length)
      registerUndo(
        rowsUndo({
          label: tu(undoRows.label, { title: undoRows.title }),
          table: "project_tasks",
          rows: undoRows.rows,
          check: (k) => k !== "completed_at",
          write: (back) => write(back as typeof patches),
        }),
      )
    return !failed
  }

  return {
    write,
    patch: (id: string, patch: Partial<TaskRow>) => write([{ id, patch }]),
    refresh,
  }
}

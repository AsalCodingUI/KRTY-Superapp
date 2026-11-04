"use client"

import {
  markLocalWrite,
  useRealtimeRefresh,
} from "@/shared/hooks/useRealtimeRefresh"
import { useT } from "@/shared/i18n/client"
import type { Database } from "@/shared/types/database.types"
import { pick, registerUndo, rowsUndo, UndoStale } from "@/shared/undo"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { keys, supabase, type TaskRow } from "./data"

/**
 * Board data for project tasks: the four columns, ordering, optimistic
 * writes, and the comment threads. `done` follows `status` in the database
 * (trigger in migrations/project_tasks_board.sql); the cache mirrors that
 * so the UI doesn't wait for a refetch.
 */

export const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const STATUS_LABEL = {
  todo: "taskStatusTodo",
  in_progress: "taskStatusInProgress",
  review: "taskStatusReview",
  done: "taskStatusDone",
} as const

export type CommentRow =
  Database["public"]["Tables"]["project_task_comments"]["Row"] & {
    /** The comment this one replies to (one level: always a top comment). */
    parent_id?: string | null
  }

export const commentKeys = {
  thread: (taskId: string) => ["project-task-comments", taskId] as const,
  counts: (projectId: string) =>
    ["project-task-comment-counts", projectId] as const,
  /** Tugas saya: every project's counts in one request. */
  mine: (projectIds: string[]) =>
    ["project-task-comment-counts", "mine", projectIds] as const,
  mineAll: ["project-task-comment-counts", "mine"] as const,
}

export function statusOf(task: TaskRow): TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(task.status)
    ? (task.status as TaskStatus)
    : task.done
      ? "done"
      : "todo"
}

/** Column order: position, then age (rows without a position go last). */
export function byPosition(a: TaskRow, b: TaskRow) {
  if (a.position !== b.position) {
    if (a.position === null) return 1
    if (b.position === null) return -1
    return a.position - b.position
  }
  return a.created_at.localeCompare(b.created_at)
}

const GAP = 1024

/**
 * A position between two neighbours, or null when there's no room left
 * (or a neighbour has none) and the column needs renumbering.
 */
export function positionBetween(prev: number | null, next: number | null) {
  if (prev === null && next === null) return GAP
  if (prev === null) return next! - GAP
  if (next === null) return prev + GAP
  const mid = (prev + next) / 2
  return mid > prev && mid < next ? mid : null
}

/**
 * Position for a new task at the top of its list: above the first sibling
 * (same parent, and same status when given). Tasks without a position sort
 * last, so this always lands first.
 */
export function topPosition(
  tasks: TaskRow[],
  parentId: string | null,
  status?: TaskStatus,
) {
  const first = tasks
    .filter(
      (t) =>
        t.parent_id === parentId &&
        t.position !== null &&
        (!status || statusOf(t) === status),
    )
    .reduce<
      number | null
    >((min, t) => (min === null || t.position! < min ? t.position : min), null)
  return positionBetween(null, first)
}

/** The extra fields the database derives from a status change. */
export function statusPatch(task: TaskRow, status: TaskStatus) {
  const done = status === "done"
  return {
    status,
    done,
    completed_at: done ? (task.completed_at ?? new Date().toISOString()) : null,
  }
}

/**
 * A copy of a task right below it in its column (same fields, its
 * subtasks too), created by `viewerId`. `siblings` are the rows the
 * task is ordered among (its project's tasks). The copy's id when it
 * worked, else null.
 */
export async function duplicateTask({
  task,
  subtasks,
  siblings,
  title,
  viewerId,
}: {
  task: TaskRow
  subtasks: TaskRow[]
  siblings: TaskRow[]
  title: string
  viewerId: string | null
}) {
  const status = statusOf(task)
  const column = siblings.filter(
    (t) =>
      t.project_id === task.project_id &&
      t.parent_id === task.parent_id &&
      t.id !== task.id &&
      t.position !== null &&
      statusOf(t) === status,
  )
  let position: number | null = null
  if (task.position !== null) {
    const next = column
      .filter((t) => t.position! > task.position!)
      .reduce<
        number | null
      >((min, t) => (min === null || t.position! < min ? t.position : min), null)
    position = positionBetween(task.position, next)
    if (position === null) {
      const last = column.reduce<number | null>(
        (max, t) => (max === null || t.position! > max ? t.position : max),
        null,
      )
      position = positionBetween(last, null)
    }
  }
  const db = supabase()
  const { data, error } = await db
    .from("project_tasks")
    .insert({
      project_id: task.project_id,
      phase_id: task.phase_id,
      parent_id: task.parent_id,
      title,
      description: task.description,
      assignee_id: task.assignee_id,
      due_date: task.due_date,
      ...statusPatch(task, status),
      position,
      created_by: viewerId,
    })
    .select("id")
    .single()
  if (error || !data) return null
  if (subtasks.length) {
    const { error: subError } = await db.from("project_tasks").insert(
      subtasks.map((sub) => ({
        project_id: sub.project_id,
        phase_id: sub.phase_id,
        parent_id: data.id,
        title: sub.title,
        description: sub.description,
        assignee_id: sub.assignee_id,
        due_date: sub.due_date,
        ...statusPatch(sub, statusOf(sub)),
        position: sub.position,
        created_by: viewerId,
      })),
    )
    if (subError) return null
  }
  return data.id
}

/** A task and its subtasks as they are in the database (parent first). */
async function snapshotTask(id: string) {
  const { data, error } = await supabase()
    .from("project_tasks")
    .select("*")
    .or(`id.eq.${id},parent_id.eq.${id}`)
  if (error) throw error
  const rows = (data ?? []) as TaskRow[]
  return [
    ...rows.filter((r) => r.id === id),
    ...rows.filter((r) => r.id !== id),
  ]
}

/** Puts deleted rows back, same ids (parent first, then its subtasks). */
async function restoreTask(rows: TaskRow[]) {
  const [parent, ...subs] = rows
  if (!parent) return
  const db = supabase()
  const { data: there } = await db
    .from("project_tasks")
    .select("id")
    .eq("id", parent.id)
    .maybeSingle()
  // Already back (another tab), or the project is gone.
  if (there) throw new UndoStale()
  const { error } = await db.from("project_tasks").insert(parent)
  if (error) throw error
  if (subs.length) {
    const { error: subError } = await db.from("project_tasks").insert(subs)
    if (subError) throw subError
  }
}

/** Deletes a task (its subtasks go with it); false when it's not there. */
async function deleteTaskRow(id: string) {
  const { data, error } = await supabase()
    .from("project_tasks")
    .delete()
    .eq("id", id)
    .select("id")
  if (error) throw error
  return Boolean(data?.length)
}

/**
 * Deletes a task with ⌘Z to bring it back: the task and its subtasks are
 * put back with the same ids and fields (its comments don't come back:
 * they go with the task, and only their authors could write them again).
 * `refresh` runs after each step. Returns the delete's error, if any.
 */
export async function deleteTaskUndoable({
  id,
  label,
  refresh,
}: {
  id: string
  label: string
  refresh: () => unknown
}) {
  let rows: TaskRow[] = []
  try {
    rows = await snapshotTask(id)
  } catch {
    // Can't take a copy first: delete without an undo.
  }
  const { error } = await supabase().from("project_tasks").delete().eq("id", id)
  if (error) return error
  if (rows.length)
    registerUndo({
      label,
      undo: async () => {
        await restoreTask(rows)
        await refresh()
      },
      redo: async () => {
        if (!(await deleteTaskRow(id))) throw new UndoStale()
        await refresh()
      },
    })
  return null
}

/**
 * ⌘Z for a duplicate: deletes the copy (and its subtasks) as long as
 * it's still there; redo puts the same copy back.
 */
export function registerDuplicateUndo({
  copyId,
  label,
  refresh,
}: {
  copyId: string
  label: string
  refresh: () => unknown
}) {
  let rows: TaskRow[] = []
  registerUndo({
    label,
    undo: async () => {
      rows = await snapshotTask(copyId)
      if (!rows.length || !(await deleteTaskRow(copyId))) throw new UndoStale()
      await refresh()
    },
    redo: async () => {
      await restoreTask(rows)
      await refresh()
    },
  })
}

/**
 * Writes to tasks that show up at once: the cache is patched first, the
 * row saved, and the list refetched either way (rolled back on failure).
 */
export function useTaskWriter(projectId: string, onError: () => void) {
  const queryClient = useQueryClient()
  const tu = useT("undo")
  const key = keys.tasks(projectId)

  const write = async (patches: { id: string; patch: Partial<TaskRow> }[]) => {
    if (!patches.length) return true
    await queryClient.cancelQueries({ queryKey: key })
    const before = queryClient.getQueryData<TaskRow[]>(key)
    // ⌘Z takes it back (shared/undo): the fields as they were.
    const undoRows = before && taskUndoRows(before, patches)
    queryClient.setQueryData<TaskRow[]>(key, (rows) =>
      rows?.map((row) => {
        const hit = patches.find((p) => p.id === row.id)
        return hit ? { ...row, ...hit.patch } : row
      }),
    )
    // The refetch below covers these rows: their Realtime echo (the
    // project page listens) doesn't fetch the list a second time.
    const ids = patches.map((p) => p.id)
    markLocalWrite("project_tasks", ids, [key])
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
    markLocalWrite("project_tasks", ids, [key])
    queryClient.invalidateQueries({ queryKey: key })
    if (!failed && undoRows?.rows.length)
      registerUndo(
        rowsUndo({
          label: tu(undoRows.label, { title: undoRows.title }),
          table: "project_tasks",
          rows: undoRows.rows,
          // The board trigger rewrites these.
          check: (k) => k !== "completed_at",
          write: (back) => write(back as typeof patches),
        }),
      )
    return !failed
  }

  return {
    write,
    patch: (id: string, patch: Partial<TaskRow>) => write([{ id, patch }]),
  }
}

/** Fields an undo doesn't take back: the description has its editor's own. */
const NO_UNDO = new Set(["description", "updated_at"])

/**
 * What an undo of these task patches writes back (each row's fields as
 * they were in `rows`), and what to call it. Null when there's nothing
 * to take back.
 */
export function taskUndoRows(
  rows: TaskRow[],
  patches: { id: string; patch: Partial<TaskRow> }[],
) {
  const out: {
    id: string
    before: Partial<TaskRow>
    after: Partial<TaskRow>
  }[] = []
  let main: TaskRow | null = null
  let mainHasMore = false
  const fields = new Set<string>()
  for (const { id, patch } of patches) {
    const row = rows.find((r) => r.id === id)
    if (!row) return null
    const keys = Object.keys(patch).filter((k) => !NO_UNDO.has(k))
    if (!keys.length) continue
    const after = pick(patch as TaskRow, keys)
    out.push({ id, before: pick(row, keys), after })
    // The task the action is about: the first with more than a new
    // position (a renumbered column moves the others too).
    const more = keys.some((k) => k !== "position")
    if (!main || (more && !mainHasMore)) {
      main = row
      mainHasMore = more
    }
    keys.forEach((k) => fields.add(k))
  }
  if (!out.length || !main) return null
  const has = (k: string) => fields.has(k)
  const label = has("title")
    ? "taskTitle"
    : has("assignee_id")
      ? "taskAssignee"
      : has("due_date")
        ? "taskDue"
        : has("phase_id")
          ? "taskPhase"
          : has("status") || has("done")
            ? main.parent_id
              ? "subtaskDone"
              : "taskStatus"
            : [...fields].every((k) => k === "position")
              ? "taskOrder"
              : "taskEdit"
  return { rows: out, label, title: main.title } as const
}

/**
 * Comments per task in these projects, counted by the database
 * (task_comment_counts, RLS applies). Until that function is there
 * (migrations/task_comment_counts.sql), counts the rows here as before.
 */
export async function fetchCommentCounts(projectIds: string[]) {
  const counts: Record<string, number> = {}
  if (!projectIds.length) return counts
  const db = supabase()
  // Not in the generated types yet.
  const { data, error } = await db.rpc(
    "task_comment_counts" as never,
    { p_project_ids: projectIds } as never,
  )
  if (!error) {
    for (const row of (data ?? []) as unknown as {
      task_id: string
      n: number
    }[])
      counts[row.task_id] = row.n
    return counts
  }
  const { data: rows } = await db
    .from("project_task_comments")
    .select("task_id")
    .in("project_id", projectIds)
  for (const row of rows ?? [])
    counts[row.task_id] = (counts[row.task_id] ?? 0) + 1
  return counts
}

/** Comments per task for the whole project (card badges). */
export function commentCountsQuery(projectId: string) {
  return {
    queryKey: commentKeys.counts(projectId),
    queryFn: () => fetchCommentCounts([projectId]),
  }
}

export function useCommentCounts(projectId: string) {
  return useQuery(commentCountsQuery(projectId))
}

export type CommentAuthor = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

/** One task's thread, oldest first, with each author's name and avatar. */
export function useTaskComments(taskId: string | null) {
  // Live: a teammate's comment shows up in the open thread.
  useRealtimeRefresh(
    `task-comments:${taskId}`,
    [
      {
        table: "project_task_comments",
        filter: `task_id=eq.${taskId}`,
        keys: () => [commentKeys.thread(taskId ?? "")],
      },
    ],
    Boolean(taskId),
  )
  return useQuery({
    queryKey: commentKeys.thread(taskId ?? ""),
    enabled: Boolean(taskId),
    queryFn: async () => {
      const db = supabase()
      const { data } = await db
        .from("project_task_comments")
        .select(
          "id, task_id, project_id, author_id, body, mentions, created_at, parent_id",
        )
        .eq("task_id", taskId!)
        .order("created_at")
      const comments = (data ?? []) as CommentRow[]
      const ids = [
        ...new Set(comments.flatMap((c) => [c.author_id, ...c.mentions])),
      ]
      const { data: people } = ids.length
        ? await db
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", ids)
        : { data: [] }
      return {
        comments,
        people: Object.fromEntries(
          ((people ?? []) as CommentAuthor[]).map((p) => [p.id, p]),
        ) as Record<string, CommentAuthor>,
      }
    },
  })
}

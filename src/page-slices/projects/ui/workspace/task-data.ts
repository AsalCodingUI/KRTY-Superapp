"use client"

import type { Database } from "@/shared/types/database.types"
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
  Database["public"]["Tables"]["project_task_comments"]["Row"]

export const commentKeys = {
  thread: (taskId: string) => ["project-task-comments", taskId] as const,
  counts: (projectId: string) =>
    ["project-task-comment-counts", projectId] as const,
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
 * Writes to tasks that show up at once: the cache is patched first, the
 * row saved, and the list refetched either way (rolled back on failure).
 */
export function useTaskWriter(projectId: string, onError: () => void) {
  const queryClient = useQueryClient()
  const key = keys.tasks(projectId)

  const write = async (patches: { id: string; patch: Partial<TaskRow> }[]) => {
    if (!patches.length) return true
    await queryClient.cancelQueries({ queryKey: key })
    const before = queryClient.getQueryData<TaskRow[]>(key)
    queryClient.setQueryData<TaskRow[]>(key, (rows) =>
      rows?.map((row) => {
        const hit = patches.find((p) => p.id === row.id)
        return hit ? { ...row, ...hit.patch } : row
      }),
    )
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
    queryClient.invalidateQueries({ queryKey: key })
    return !failed
  }

  return {
    write,
    patch: (id: string, patch: Partial<TaskRow>) => write([{ id, patch }]),
  }
}

/** Comments per task for the whole project (card badges). Shared with
 *  Tugas saya so the dialog's invalidation refreshes both. */
export function commentCountsQuery(projectId: string) {
  return {
    queryKey: commentKeys.counts(projectId),
    queryFn: async () => {
      const { data } = await supabase()
        .from("project_task_comments")
        .select("task_id")
        .eq("project_id", projectId)
      const counts: Record<string, number> = {}
      for (const row of data ?? [])
        counts[row.task_id] = (counts[row.task_id] ?? 0) + 1
      return counts
    },
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
  return useQuery({
    queryKey: commentKeys.thread(taskId ?? ""),
    enabled: Boolean(taskId),
    queryFn: async () => {
      const db = supabase()
      const { data } = await db
        .from("project_task_comments")
        .select(
          "id, task_id, project_id, author_id, body, mentions, created_at",
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

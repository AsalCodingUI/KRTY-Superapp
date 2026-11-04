"use client"

import { BRIEFS_KEY } from "@/page-slices/briefs/model/data"
import { useRealtimeRefresh } from "@/shared/hooks/useRealtimeRefresh"
import { keys } from "./data"
import { reportKeys } from "./reports-data"
import { commentKeys } from "./task-data"

/**
 * A project's pages stay live: what a teammate changes (tasks, comments,
 * phases and steps, the team, reports, documents, the library, briefs)
 * shows up without leaving and coming back.
 */
export function useProjectRealtime(projectId: string) {
  const filter = `project_id=eq.${projectId}`
  useRealtimeRefresh(`project:${projectId}`, [
    {
      table: "project_tasks",
      filter,
      keys: () => [keys.tasks(projectId), ["my-tasks"]],
    },
    {
      table: "project_task_comments",
      filter,
      keys: (row) => [
        commentKeys.counts(projectId),
        row?.task_id
          ? commentKeys.thread(String(row.task_id))
          : ["project-task-comments"],
      ],
    },
    {
      table: "project_steps",
      filter,
      keys: () => [keys.steps(projectId), keys.workspace(projectId)],
    },
    {
      table: "project_phases",
      filter,
      keys: () => [keys.workspace(projectId)],
    },
    {
      table: "project_assignments",
      filter,
      keys: () => [keys.workspace(projectId)],
    },
    {
      table: "projects",
      filter: `id=eq.${projectId}`,
      keys: () => [keys.workspace(projectId)],
    },
    {
      table: "project_reports",
      filter,
      keys: () => [reportKeys.list(projectId)],
    },
    {
      table: "project_documents",
      filter,
      keys: () => [keys.documents(projectId)],
    },
    { table: "project_files", filter, keys: () => [keys.library(projectId)] },
    { table: "project_folders", filter, keys: () => [keys.library(projectId)] },
    { table: "briefs", filter, keys: () => [BRIEFS_KEY] },
  ])
}

"use client"

import { useT } from "@/shared/i18n/client"
import { useMemo } from "react"
import { toast } from "sonner"
import {
  supabase,
  useInvalidate,
  useTasks,
  useViewer,
  useWorkspace,
  type TaskRow,
} from "./data"
import { TaskDialog } from "./TaskDialog"
import {
  byPosition,
  positionBetween,
  statusOf,
  statusPatch,
  useTaskWriter,
  type TaskStatus,
} from "./task-data"

/**
 * One task opened from outside its project (the calendars). Loads the
 * project's tasks and team itself; writes go through the same cache as the
 * project page, and `onChanged` lets the caller refresh its own view.
 */
export function ProjectTaskDialog({
  projectId,
  taskId,
  open,
  onOpenChange,
  onChanged,
}: {
  projectId: string
  taskId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged?: () => void
}) {
  const t = useT("projects")
  const viewer = useViewer()
  const { data: workspace } = useWorkspace(projectId)
  const { data: tasks = [] } = useTasks(projectId)
  const invalidate = useInvalidate(projectId)
  const writer = useTaskWriter(projectId, () => toast.error(t("errSaveTask")))

  const task = tasks.find((row) => row.id === taskId) ?? null
  const subtasks = useMemo(
    () =>
      task
        ? tasks.filter((row) => row.parent_id === task.id).sort(byPosition)
        : [],
    [tasks, task],
  )

  const patch = async (id: string, value: Partial<TaskRow>) => {
    await writer.patch(id, value)
    onChanged?.()
  }

  const setStatus = (row: TaskRow, status: TaskStatus) => {
    if (statusOf(row) === status) return
    const last = tasks
      .filter(
        (other) =>
          other.parent_id === row.parent_id &&
          other.id !== row.id &&
          statusOf(other) === status,
      )
      .reduce<
        number | null
      >((max, other) => (other.position !== null && (max === null || other.position > max) ? other.position : max), null)
    patch(row.id, {
      ...statusPatch(row, status),
      position: positionBetween(last, null),
    })
  }

  const addSubtask = async (title: string, parentId: string) => {
    const value = title.trim()
    const parent = tasks.find((row) => row.id === parentId)
    if (!value || !parent) return false
    const { error } = await supabase().from("project_tasks").insert({
      project_id: projectId,
      title: value,
      parent_id: parentId,
      status: "todo",
      phase_id: parent.phase_id,
      created_by: viewer.id,
    })
    if (error) {
      toast.error(t("errAddTask"))
      return false
    }
    await invalidate("tasks")
    return true
  }

  const remove = async (id: string) => {
    if (id === taskId) onOpenChange(false)
    await supabase().from("project_tasks").delete().eq("id", id)
    await invalidate("tasks")
    onChanged?.()
  }

  return (
    <TaskDialog
      task={task}
      open={open}
      onOpenChange={onOpenChange}
      projectId={projectId}
      subtasks={subtasks}
      team={workspace?.team ?? []}
      viewerId={viewer.id}
      onPatch={patch}
      onStatus={setStatus}
      onAddSub={addSubtask}
      onRemove={remove}
    />
  )
}

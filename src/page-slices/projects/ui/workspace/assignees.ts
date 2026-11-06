/**
 * Task assignees (project_tasks.assignee_ids): zero or more people per
 * task. The database keeps assignee_id as the first of them for older
 * code (migrations/task_assignees.sql); the app reads and writes the
 * array only.
 */

type WithAssignees = { assignee_ids: string[] }

/** The ids without blanks or repeats, first occurrence kept (as the trigger does). */
export function cleanAssigneeIds(ids: readonly (string | null | undefined)[]) {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))]
}

/** True when `userId` is one of the task's assignees ("Mine"). */
export function isAssignedTo(task: WithAssignees, userId: string | null) {
  return Boolean(userId) && task.assignee_ids.includes(userId!)
}

/** The ids with `id` added at the end, or taken out when it's there. */
export function toggleAssignee(ids: readonly string[], id: string) {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}

/** The task's assignees found in `team`, in assignment order. */
export function assigneesOf<P extends { id: string }>(
  task: WithAssignees,
  team: readonly P[],
): P[] {
  return task.assignee_ids
    .map((id) => team.find((m) => m.id === id))
    .filter((m): m is P => Boolean(m))
}

/** Same set of people, order aside. */
export function sameAssignees(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((id) => b.includes(id))
}

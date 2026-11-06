"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import {
  OPEN_STATUSES,
  type ProjectStatus,
} from "@/page-slices/projects/lib/status"
import type { TaskRow } from "@/page-slices/projects/ui/workspace/data"
import { useQuery } from "@tanstack/react-query"
import { parseISO } from "date-fns"

export type CalendarMember = {
  userId: string
  name: string
  role: string
  isLead: boolean
}

export type CalendarProject = {
  id: string
  name: string
  status: ProjectStatus
  start: Date | null
  end: Date | null
  members: CalendarMember[]
}

export type CalendarTask = Pick<
  TaskRow,
  | "id"
  | "project_id"
  | "title"
  | "status"
  | "done"
  | "due_date"
  | "assignee_ids"
  | "position"
> & {
  /** The assignees' names, in assignment order (team members only). */
  assigneeNames: string[]
}

type ProjectRow = {
  id: string
  name: string
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  project_assignments: {
    user_id: string
    role_in_project: string
    is_lead: boolean | null
    profiles: { full_name: string | null } | null
  }[]
}

export const projectCalendarKey = ["calendar-projects"] as const

/**
 * The project calendar's data: every running project you're on (all of
 * them for stakeholders) with its team, and their top-level tasks. One
 * query feeds both the timeline and the task deadlines in week/month.
 */
export function useProjectCalendarData(isStakeholder: boolean, enabled = true) {
  const { profile } = useUserProfile()
  const viewerId = profile?.id ?? null
  return useQuery({
    queryKey: [...projectCalendarKey, viewerId, isStakeholder],
    enabled: enabled && Boolean(viewerId),
    staleTime: 30_000,
    queryFn: async () => {
      const db = createClient()
      // Not a stakeholder: only the projects you're on, in the same request
      // (an inner-joined `mine`, filtered to you); the team embed stays whole.
      const columns =
        "id, name, status, start_date, end_date, project_assignments ( user_id, role_in_project, is_lead, profiles!project_assignments_user_id_fkey ( full_name ) )"
      let query = db
        .from("projects")
        .select(
          isStakeholder
            ? columns
            : `${columns}, mine:project_assignments!inner ( user_id )`,
        )
        .in("status", OPEN_STATUSES)
        .order("start_date", { ascending: true, nullsFirst: false })
      if (!isStakeholder)
        query = query.eq("mine.user_id" as never, viewerId! as never)
      const { data: projectRows, error } = await query
      if (error) throw error

      const projects: CalendarProject[] = (
        (projectRows ?? []) as unknown as ProjectRow[]
      ).map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        start: p.start_date ? parseISO(p.start_date) : null,
        end: p.end_date ? parseISO(p.end_date) : null,
        members: (p.project_assignments ?? [])
          .map((a) => ({
            userId: a.user_id,
            name: a.profiles?.full_name ?? "—",
            role: a.role_in_project,
            isLead: Boolean(a.is_lead),
          }))
          .sort(
            (a, b) =>
              Number(b.isLead) - Number(a.isLead) ||
              a.name.localeCompare(b.name),
          ),
      }))
      if (projects.length === 0) return { projects, tasks: [] }

      const { data: taskRows } = await db
        .from("project_tasks")
        .select(
          "id, project_id, title, status, done, due_date, assignee_ids, position",
        )
        .in(
          "project_id",
          projects.map((p) => p.id),
        )
        .is("parent_id", null)
      const names = new Map(
        projects.flatMap((p) => p.members.map((m) => [m.userId, m.name])),
      )
      const tasks: CalendarTask[] = (
        (taskRows ?? []) as Omit<CalendarTask, "assigneeNames">[]
      ).map((task) => ({
        ...task,
        assigneeNames: task.assignee_ids
          .map((id) => names.get(id))
          .filter((name): name is string => Boolean(name)),
      }))
      return { projects, tasks }
    },
  })
}

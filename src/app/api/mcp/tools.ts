import type { SupabaseClient } from "@supabase/supabase-js"
import { getEventTypeDefinition } from "@/widgets/event-calendar/lib/event-color-registry"
import type { TokenAuth } from "@/shared/api/api-token"

/**
 * The tools Kretya's MCP server offers (/api/mcp). Each runs with the
 * token owner's database session (their RLS): what they can't see or do in
 * the app, they can't here either. `write` tools need a write token.
 */

type Args = Record<string, unknown>
type Ctx = { db: SupabaseClient; auth: TokenAuth }

export type Tool = {
  name: string
  description: string
  inputSchema: {
    type: "object"
    properties: Record<string, unknown>
    required?: string[]
  }
  write?: boolean
  run: (args: Args, ctx: Ctx) => Promise<unknown>
}

export class ToolError extends Error {}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "")
const opt = (v: unknown) => str(v) || undefined
const num = (v: unknown, fallback: number, max: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), max) : fallback
}
const strings = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
const need = (value: string, name: string) => {
  if (!value) throw new ToolError(`"${name}" is required`)
  return value
}
const isoDate = (v: string, name: string) => {
  if (!v) return undefined
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) throw new ToolError(`"${name}" is not a date`)
  return d
}
const today = () => new Date().toISOString().slice(0, 10)

async function rows<T>(
  query: PromiseLike<{ data: T | null; error: { message: string } | null }>,
) {
  const { data, error } = await query
  if (error) throw new ToolError(error.message)
  return data
}

const TASK_STATUSES = ["todo", "in_progress", "review", "done"]
const PRIORITIES = ["none", "high", "urgent"]
const EVENT_TYPES = ["Event", "Internal", "Personal", "Task"]

export const TOOLS: Tool[] = [
  {
    name: "whoami",
    description: "Who this token acts as (name, email, access, token scope).",
    inputSchema: { type: "object", properties: {} },
    run: async (_a, { auth }) => ({
      id: auth.profileId,
      name: auth.name,
      email: auth.email,
      access: "stakeholder",
      scope: auth.scope,
    }),
  },
  {
    name: "list_people",
    description:
      "Everyone at the studio: id, name, job title, role, email. Use the ids for assignees.",
    inputSchema: { type: "object", properties: {} },
    run: async (_a, { db }) =>
      rows(
        db
          .from("profiles")
          .select("id, full_name, job_title, role, email")
          .order("full_name"),
      ),
  },
  {
    name: "list_projects",
    description:
      "Projects (newest first) with status, stage, dates and client. Filter by status or a name search.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "e.g. active, completed" },
        search: { type: "string", description: "Part of the project name" },
        limit: { type: "number", description: "Default 50, max 200" },
      },
    },
    run: async (a, { db }) => {
      let q = db
        .from("projects")
        .select(
          "id, name, status, stage, start_date, end_date, client_name, quarter_id",
        )
        .order("start_date", { ascending: false })
        .limit(num(a.limit, 50, 200))
      if (str(a.status)) q = q.eq("status", str(a.status))
      if (str(a.search)) q = q.ilike("name", `%${str(a.search)}%`)
      return rows(q)
    },
  },
  {
    name: "list_tasks",
    description:
      "Project tasks with their project, status, priority, due date and assignees. Filter by project, assignee (or mine), status, or overdue.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        assignee_id: {
          type: "string",
          description: "A person's id (list_people)",
        },
        mine: { type: "boolean", description: "Only tasks assigned to me" },
        status: { type: "string", enum: TASK_STATUSES },
        overdue: {
          type: "boolean",
          description: "Not done and due before today",
        },
        limit: { type: "number", description: "Default 100, max 300" },
      },
    },
    run: async (a, { db, auth }) => {
      let q = db
        .from("project_tasks")
        .select(
          "id, title, status, priority, due_date, assignee_ids, parent_id, project:projects(id, name)",
        )
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(num(a.limit, 100, 300))
      if (str(a.project_id)) q = q.eq("project_id", str(a.project_id))
      const who = a.mine === true ? auth.profileId : str(a.assignee_id)
      if (who) q = q.contains("assignee_ids", [who])
      if (str(a.status)) q = q.eq("status", str(a.status))
      if (a.overdue === true)
        q = q.neq("status", "done").lt("due_date", today())
      return rows(q)
    },
  },
  {
    name: "create_task",
    description:
      "Create a task in a project (at the end of its column). Returns the new task.",
    write: true,
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        assignee_ids: { type: "array", items: { type: "string" } },
        due_date: { type: "string", description: "YYYY-MM-DD" },
        status: { type: "string", enum: TASK_STATUSES },
        priority: { type: "string", enum: PRIORITIES },
        parent_id: { type: "string", description: "Make it a subtask" },
      },
      required: ["project_id", "title"],
    },
    run: async (a, { db, auth }) => {
      const project_id = need(str(a.project_id), "project_id")
      const title = need(str(a.title), "title").slice(0, 500)
      const status = TASK_STATUSES.includes(str(a.status))
        ? str(a.status)
        : "todo"
      const last = await rows(
        db
          .from("project_tasks")
          .select("position")
          .eq("project_id", project_id)
          .eq("status", status)
          .not("position", "is", null)
          .order("position", { ascending: false })
          .limit(1),
      )
      const position = ((last?.[0]?.position as number | undefined) ?? 0) + 1
      return rows(
        db
          .from("project_tasks")
          .insert({
            project_id,
            title,
            description: opt(a.description) ?? null,
            assignee_ids: strings(a.assignee_ids),
            due_date: opt(a.due_date) ?? null,
            status,
            priority: PRIORITIES.includes(str(a.priority))
              ? str(a.priority)
              : null,
            parent_id: opt(a.parent_id) ?? null,
            position,
            created_by: auth.profileId,
          })
          .select(
            "id, title, status, priority, due_date, assignee_ids, project_id",
          )
          .single(),
      )
    },
  },
  {
    name: "update_task",
    description:
      "Change a task: status (todo, in_progress, review, done), title, description, due date, priority or assignees.",
    write: true,
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: { type: "string", enum: TASK_STATUSES },
        title: { type: "string" },
        description: { type: "string" },
        due_date: {
          type: "string",
          description: "YYYY-MM-DD, or empty to clear",
        },
        priority: { type: "string", enum: PRIORITIES },
        assignee_ids: { type: "array", items: { type: "string" } },
      },
      required: ["id"],
    },
    run: async (a, { db }) => {
      const id = need(str(a.id), "id")
      const patch: Record<string, unknown> = {}
      if (TASK_STATUSES.includes(str(a.status))) {
        patch.status = str(a.status)
        patch.done = str(a.status) === "done"
        patch.completed_at =
          str(a.status) === "done" ? new Date().toISOString() : null
      }
      if (str(a.title)) patch.title = str(a.title).slice(0, 500)
      if (typeof a.description === "string") patch.description = a.description
      if (typeof a.due_date === "string")
        patch.due_date = str(a.due_date) || null
      if (PRIORITIES.includes(str(a.priority))) patch.priority = str(a.priority)
      if (Array.isArray(a.assignee_ids))
        patch.assignee_ids = strings(a.assignee_ids)
      if (!Object.keys(patch).length) throw new ToolError("Nothing to change")
      const data = await rows(
        db
          .from("project_tasks")
          .update(patch)
          .eq("id", id)
          .select("id, title, status, priority, due_date, assignee_ids"),
      )
      if (!data?.length)
        throw new ToolError("Task not found (or not yours to change)")
      return data[0]
    },
  },
  {
    name: "list_calendar_events",
    description:
      "Calendar events between two dates (default: the next 7 days), with type, time, location.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "ISO date or datetime" },
        to: { type: "string", description: "ISO date or datetime" },
      },
    },
    run: async (a, { db }) => {
      const from = isoDate(str(a.from), "from") ?? new Date()
      const to =
        isoDate(str(a.to), "to") ?? new Date(from.getTime() + 7 * 86_400_000)
      return rows(
        db
          .from("calendar_events")
          .select(
            "id, title, description, start_at, end_at, all_day, event_type, location, meeting_url, organizer",
          )
          .lt("start_at", to.toISOString())
          .gt("end_at", from.toISOString())
          .order("start_at")
          .limit(300),
      )
    },
  },
  {
    name: "create_calendar_event",
    description:
      "Add an event to the studio calendar. Times are ISO datetimes with a timezone (Asia/Jakarta is +07:00).",
    write: true,
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        start: { type: "string" },
        end: { type: "string" },
        type: {
          type: "string",
          enum: EVENT_TYPES,
          description: "Default Event",
        },
        all_day: { type: "boolean" },
        description: { type: "string" },
        location: { type: "string" },
        meeting_url: { type: "string" },
      },
      required: ["title", "start", "end"],
    },
    run: async (a, { db, auth }) => {
      const title = need(str(a.title), "title")
      const start = isoDate(need(str(a.start), "start"), "start")!
      const end = isoDate(need(str(a.end), "end"), "end")!
      if (end <= start) throw new ToolError('"end" must be after "start"')
      const type = EVENT_TYPES.includes(str(a.type)) ? str(a.type) : "Event"
      return rows(
        db
          .from("calendar_events")
          .insert({
            title,
            start_at: start.toISOString(),
            end_at: end.toISOString(),
            all_day: a.all_day === true,
            event_type: type,
            color: getEventTypeDefinition(type)?.color ?? "blue",
            description: opt(a.description) ?? null,
            location: opt(a.location) ?? null,
            meeting_url: opt(a.meeting_url) ?? null,
            user_id: auth.profileId,
          })
          .select("id, title, start_at, end_at, event_type")
          .single(),
      )
    },
  },
  {
    name: "list_leave_requests",
    description:
      "Leave / WFH requests with the person, dates, type, reason and status. Default: pending ones.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pending", "approved", "rejected", "all"],
        },
        from: {
          type: "string",
          description: "Only requests ending on/after (YYYY-MM-DD)",
        },
        to: {
          type: "string",
          description: "Only requests starting on/before (YYYY-MM-DD)",
        },
        limit: { type: "number", description: "Default 50, max 200" },
      },
    },
    run: async (a, { db }) => {
      let q = db
        .from("leave_requests")
        .select(
          "id, start_date, end_date, leave_type, reason, status, review_note, created_at, person:profiles(id, full_name)",
        )
        .order("start_date", { ascending: true })
        .limit(num(a.limit, 50, 200))
      const status = str(a.status) || "pending"
      if (status !== "all") q = q.eq("status", status)
      if (str(a.from)) q = q.gte("end_date", str(a.from))
      if (str(a.to)) q = q.lte("start_date", str(a.to))
      return rows(q)
    },
  },
  {
    name: "review_leave_request",
    description:
      "Approve or reject a pending leave request (a rejection can carry a note).",
    write: true,
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number" },
        decision: { type: "string", enum: ["approve", "reject"] },
        note: { type: "string" },
      },
      required: ["id", "decision"],
    },
    run: async (a, { db }) => {
      const id = Number(a.id)
      if (!Number.isInteger(id)) throw new ToolError('"id" is required')
      const approve = str(a.decision) === "approve"
      if (!approve && str(a.decision) !== "reject")
        throw new ToolError('"decision" is approve or reject')
      const data = await rows(
        db
          .from("leave_requests")
          .update({
            status: approve ? "approved" : "rejected",
            review_note: approve ? null : (opt(a.note) ?? null),
          })
          .eq("id", id)
          .eq("status", "pending")
          .select("id, status"),
      )
      if (!data?.length)
        throw new ToolError(
          "Not a pending request (already decided, or not found)",
        )
      return data[0]
    },
  },
  {
    name: "attendance",
    description:
      "Who clocked in on a day (default today), when, and whether they're still working.",
    inputSchema: {
      type: "object",
      properties: { date: { type: "string", description: "YYYY-MM-DD" } },
    },
    run: async (a, { db }) =>
      rows(
        db
          .from("attendance_logs")
          .select(
            "date, clock_in, clock_out, is_break, break_total, status, notes, person:profiles(id, full_name)",
          )
          .eq("date", str(a.date) || today())
          .order("clock_in"),
      ),
  },
  {
    name: "search_wiki",
    description:
      "Find Kretya Wiki pages by title (empty query: the most recently edited).",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "number" } },
    },
    run: async (a, { db }) => {
      let q = db
        .from("wiki_pages")
        .select("id, title, parent_id, kind, updated_at")
        .order("updated_at", { ascending: false })
        .limit(num(a.limit, 25, 100))
      if (str(a.query)) q = q.ilike("title", `%${str(a.query)}%`)
      return rows(q)
    },
  },
  {
    name: "read_wiki_page",
    description: "A wiki page's title and body (Markdown), with its subpages.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    run: async (a, { db }) => {
      const id = need(str(a.id), "id")
      const page = await rows(
        db
          .from("wiki_pages")
          .select("id, title, body, kind, schema, props, locked, updated_at")
          .eq("id", id)
          .maybeSingle(),
      )
      if (!page) throw new ToolError("Page not found")
      const subpages = await rows(
        db
          .from("wiki_pages")
          .select("id, title, props")
          .eq("parent_id", id)
          .order("position"),
      )
      return { ...(page as Record<string, unknown>), subpages }
    },
  },
  {
    name: "create_wiki_page",
    description:
      "Write a new wiki page (Markdown body), at the top or under a page.",
    write: true,
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string", description: "Markdown" },
        parent_id: { type: "string" },
      },
      required: ["title"],
    },
    run: async (a, { db }) => {
      const parent_id = opt(a.parent_id) ?? null
      // After its siblings, as the app's + Halaman baru.
      let last = db
        .from("wiki_pages")
        .select("position")
        .order("position", { ascending: false })
        .limit(1)
      last = parent_id
        ? last.eq("parent_id", parent_id)
        : last.is("parent_id", null)
      const top = await rows(last)
      return rows(
        db
          .from("wiki_pages")
          .insert({
            title: need(str(a.title), "title").slice(0, 200),
            body: typeof a.body === "string" ? a.body.slice(0, 200_000) : "",
            parent_id,
            position: ((top?.[0]?.position as number | undefined) ?? 0) + 1,
          })
          .select("id, title")
          .single(),
      )
    },
  },
  {
    name: "list_notifications",
    description: "My notifications, newest first.",
    inputSchema: {
      type: "object",
      properties: {
        unread_only: { type: "boolean" },
        limit: { type: "number", description: "Default 30, max 100" },
      },
    },
    run: async (a, { db, auth }) => {
      let q = db
        .from("notifications")
        .select("id, title, message, type, link, is_read, created_at")
        .eq("user_id", auth.profileId)
        .order("created_at", { ascending: false })
        .limit(num(a.limit, 30, 100))
      if (a.unread_only === true) q = q.eq("is_read", false)
      return rows(q)
    },
  },
]

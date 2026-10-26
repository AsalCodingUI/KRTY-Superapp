"use client"

import { ProjectTaskDialog } from "@/page-slices/projects/ui/workspace/ProjectTaskDialog"
import {
  useMyTasks,
  myTasksKey,
} from "@/page-slices/projects/ui/my-tasks/my-tasks-data"
import { createClient } from "@/shared/api/supabase/client"
import type { AccessLevel } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { Database } from "@/shared/types/database.types"
import {
  getEventTypeDefinition,
  getEventTypeLabelKey,
} from "@/widgets/event-calendar/lib/event-color-registry"
import {
  CalendarProvider,
  useCalendarContext,
} from "@/widgets/event-calendar/ui/calendar-context"
import type {
  CalendarEvent,
  EventCategory,
  EventColor,
  ViewMode,
} from "@/widgets/event-calendar/ui/types"
import { GoogleCalendarProvider } from "@/widgets/event-calendar/ui/google-calendar-context"
import { getViewRange } from "@/widgets/event-calendar/ui/utils"
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { leaveTypeLabel } from "@/shared/lib/leave"
import { endOfDay, format, parseISO, startOfDay } from "date-fns"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { CalendarContent } from "./CalendarContent"
import { ProjectTimeline } from "./ProjectTimeline"
import {
  projectCalendarKey,
  useProjectCalendarData,
} from "./project-calendar-data"

type CalendarT = ReturnType<typeof useT<"calendar">>
type LeaveT = ReturnType<typeof useT<"leave">>

type CalendarEventRow = Database["public"]["Tables"]["calendar_events"]["Row"]
type CalendarEventInsert =
  Database["public"]["Tables"]["calendar_events"]["Insert"]
type CalendarEventRowLite = Pick<
  CalendarEventRow,
  | "id"
  | "title"
  | "description"
  | "start_at"
  | "end_at"
  | "color"
  | "location"
  | "all_day"
  | "meeting_url"
  | "guests"
  | "reminders"
  | "rsvp_status"
  | "organizer"
  | "event_type"
  | "user_id"
  | "is_recurring"
  | "recurrence_rule"
>
type LeaveRequestCalendarRow = Pick<
  Database["public"]["Tables"]["leave_requests"]["Row"],
  | "id"
  | "start_date"
  | "end_date"
  | "leave_type"
  | "status"
  | "reason"
  | "user_id"
> & {
  profiles?:
    | { full_name?: string | null }
    | { full_name?: string | null }[]
    | null
}
type OneOnOneCalendarRow = Pick<
  Database["public"]["Tables"]["one_on_one_slots"]["Row"],
  | "id"
  | "start_at"
  | "end_at"
  | "status"
  | "cycle_name"
  | "meeting_url"
  | "location"
  | "mode"
  | "organizer_id"
  | "booked_by"
  | "google_event_id"
  | "updated_at"
> & {
  organizer?:
    | { full_name?: string | null; email?: string | null }
    | { full_name?: string | null; email?: string | null }[]
    | null
  booked_by_profile?:
    | { full_name?: string | null; email?: string | null }
    | { full_name?: string | null; email?: string | null }[]
    | null
}

export type CalendarScope = "personal" | "project"

interface CalendarClientProps {
  scope: CalendarScope
  level: AccessLevel
  userId: string | null
}

const EVENT_COLORS: EventColor[] = [
  "emerald",
  "orange",
  "violet",
  "blue",
  "rose",
  "amber",
  "cyan",
  "pink",
  "teal",
  "neutral",
]

const isEventColor = (value: string): value is EventColor =>
  EVENT_COLORS.includes(value as EventColor)

const mapRowToEvent = (row: CalendarEventRowLite): CalendarEvent => {
  const typeDefinition = getEventTypeDefinition(row.event_type ?? undefined)
  const resolvedColor = typeDefinition?.color
    ? typeDefinition.color
    : isEventColor(row.color)
      ? row.color
      : "blue"

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    start: new Date(row.start_at),
    end: new Date(row.end_at),
    color: resolvedColor,
    location: row.location ?? undefined,
    allDay: row.all_day ?? false,
    meetingUrl: row.meeting_url ?? undefined,
    guests: (row.guests as unknown as CalendarEvent["guests"]) ?? undefined,
    reminders:
      (row.reminders as unknown as CalendarEvent["reminders"]) ?? undefined,
    rsvpStatus: (row.rsvp_status as CalendarEvent["rsvpStatus"]) ?? undefined,
    organizer: row.organizer ?? undefined,
    type: typeDefinition?.value ?? row.event_type ?? undefined,
    employeeId: row.user_id ?? undefined,
    isRecurring: row.is_recurring ?? undefined,
    recurrenceRule: row.recurrence_rule ?? undefined,
  }
}

const mapEventToInsert = (
  eventData: Partial<CalendarEvent>,
): Partial<CalendarEventInsert> => {
  const payload: Partial<CalendarEventInsert> = {}

  if (eventData.title !== undefined) payload.title = eventData.title
  if (eventData.description !== undefined)
    payload.description = eventData.description
  if (eventData.start) payload.start_at = eventData.start.toISOString()
  if (eventData.end) payload.end_at = eventData.end.toISOString()
  if (eventData.color) {
    payload.color = eventData.color
  } else if (eventData.type) {
    const typeDefinition = getEventTypeDefinition(eventData.type)
    if (typeDefinition) {
      payload.color = typeDefinition.color
    }
  }
  if (eventData.location !== undefined) payload.location = eventData.location
  if (eventData.allDay !== undefined) payload.all_day = eventData.allDay
  if (eventData.meetingUrl !== undefined)
    payload.meeting_url = eventData.meetingUrl
  if (eventData.type !== undefined) payload.event_type = eventData.type
  if (eventData.organizer !== undefined) payload.organizer = eventData.organizer
  if (eventData.guests !== undefined)
    payload.guests =
      eventData.guests as unknown as CalendarEventInsert["guests"]
  if (eventData.reminders !== undefined)
    payload.reminders =
      eventData.reminders as unknown as CalendarEventInsert["reminders"]
  if (eventData.rsvpStatus !== undefined)
    payload.rsvp_status = eventData.rsvpStatus
  if (eventData.isRecurring !== undefined)
    payload.is_recurring = eventData.isRecurring
  if (eventData.recurrenceRule !== undefined)
    payload.recurrence_rule = eventData.recurrenceRule

  return payload
}

const mapLeaveRowToEvent = (
  row: LeaveRequestCalendarRow,
  t: CalendarT,
  tLeave: LeaveT,
): CalendarEvent => {
  const leaveType = row.leave_type || "Cuti"
  const normalizedType = leaveType.toLowerCase().includes("wfh")
    ? "WFH"
    : "Cuti"
  const typeDefinition = getEventTypeDefinition(normalizedType)
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  const employeeName = profile?.full_name || t("fallbackEmployee")
  // Stored types are English ("Annual Leave"); show the UI-language label.
  const leaveLabel = row.leave_type
    ? leaveTypeLabel(row.leave_type, tLeave)
    : t("fallbackLeaveType")
  // Date-only strings: parseISO reads them as local days.
  const startDate = startOfDay(parseISO(row.start_date))
  const endDate = endOfDay(parseISO(row.end_date))
  const reason = row.reason?.trim()

  return {
    id: `leave-${row.id}`,
    title: `${employeeName} • ${leaveLabel}`,
    // The leave dialog labels it "Alasan" itself.
    description: reason || undefined,
    start: startDate,
    end: endDate,
    allDay: true,
    color: typeDefinition?.color ?? "rose",
    type: normalizedType,
    employeeId: row.user_id,
  }
}

const mapSlotToEvent = (
  slot: OneOnOneCalendarRow,
  t: CalendarT,
): CalendarEvent | null => {
  if (slot.status !== "booked" && slot.status !== "cancelled") return null
  const typeDefinition = getEventTypeDefinition("301 Meeting")
  const organizerProfile = Array.isArray(slot.organizer)
    ? slot.organizer[0]
    : slot.organizer
  const bookedProfile = Array.isArray(slot.booked_by_profile)
    ? slot.booked_by_profile[0]
    : slot.booked_by_profile
  const organizerName =
    organizerProfile?.full_name ||
    organizerProfile?.email ||
    t("fallbackOrganizer")
  const employeeName =
    bookedProfile?.full_name || bookedProfile?.email || t("fallbackEmployee")
  const statusLabel =
    slot.status === "cancelled"
      ? t("slotStatusCancelled")
      : t("slotStatusBooked")
  const titleBase = t("slotTitle", { cycle: slot.cycle_name })
  const title =
    slot.status === "cancelled"
      ? t("slotTitleCancelled", { title: titleBase })
      : titleBase
  const modeLabel =
    slot.mode === "online"
      ? t("slotModeOnline")
      : slot.mode === "offline"
        ? t("slotModeOffline")
        : slot.mode
  const detailLines = [
    t("slotDetailStatus", { value: statusLabel }),
    t("slotDetailOrganizer", { value: organizerName }),
    t("slotDetailEmployee", { value: employeeName }),
    t("slotDetailMode", { value: modeLabel }),
  ]

  if (slot.meeting_url) {
    detailLines.push(t("slotDetailMeeting", { value: slot.meeting_url }))
  }
  if (slot.location) {
    detailLines.push(t("slotDetailLocation", { value: slot.location }))
  }

  return {
    id: `perf-${slot.id}`,
    title,
    description: detailLines.join("\n"),
    start: new Date(slot.start_at),
    end: new Date(slot.end_at),
    color:
      slot.status === "cancelled"
        ? "neutral"
        : (typeDefinition?.color ?? "amber"),
    type: "301 Meeting",
    meetingUrl: slot.meeting_url ?? undefined,
    location:
      slot.mode === "offline"
        ? (slot.location ?? undefined)
        : (slot.meeting_url ?? undefined),
    organizer: organizerName,
    employeeId: slot.booked_by ?? undefined,
    allDay: false,
  }
}

const SANTUY = "Sharing Santuy"

/** What each calendar is for, per access level. */
const SCOPES = {
  personal: {
    basePath: "/calendar/personal",
    views: ["week", "month"] as ViewMode[],
    categories: [
      "Personal",
      SANTUY,
      "Internal",
      "Event",
      "301 Meeting",
      "Company Holiday",
      "Public Holiday",
      "Cuti",
      "WFH",
      "Task",
    ],
    eventTypes: {
      employee: ["Personal", SANTUY],
      pm: ["Personal", SANTUY, "Internal"],
      stakeholder: ["Personal", SANTUY, "Internal", "Event", "Company Holiday"],
    },
  },
  project: {
    basePath: "/calendar",
    views: ["timeline", "week", "month"] as ViewMode[],
    categories: ["Internal", "Event", "Company Holiday", "Task", "Cuti", "WFH"],
    eventTypes: {
      employee: [],
      pm: ["Internal", "Event"],
      stakeholder: ["Internal", "Event", "Company Holiday"],
    },
  },
} satisfies Record<
  CalendarScope,
  {
    basePath: string
    views: ViewMode[]
    categories: string[]
    eventTypes: Record<AccessLevel, string[]>
  }
>

/** Team-wide work events; Personal and Sharing Santuy live on the personal one. */
const PROJECT_EVENT_TYPES = new Set(["Internal", "Event", "Company Holiday"])

/** Rows made up from other tables (leave, 1:1, tasks) can't be edited here. */
const isSyntheticId = (id: string) => /^(leave|perf|task)-/.test(id)

type GuestLike = { id?: string; email?: string } | string

/** On my agenda: mine, invited, or meant for everyone. */
function onMyAgenda(
  event: CalendarEvent,
  userId: string | null,
  email: string | null,
) {
  if (event.employeeId && event.employeeId === userId) return true
  if (event.type === "Personal") return false
  if (event.type === SANTUY || event.type === "Company Holiday") return true
  const guests = (
    Array.isArray(event.guests) ? event.guests : []
  ) as GuestLike[]
  if (guests.length === 0) return true
  return guests.some((g) =>
    typeof g === "string"
      ? g === userId
      : g.id === userId || (!!email && g.email === email),
  )
}

type TaskLike = {
  id: string
  project_id: string
  title: string
  due_date: string | null
  done: boolean
}

const taskToEvent = (
  task: TaskLike,
  projectName: string | undefined,
): CalendarEvent => {
  const day = parseISO(task.due_date!)
  return {
    id: `task-${task.id}`,
    title: projectName ? `${task.title} · ${projectName}` : task.title,
    start: startOfDay(day),
    end: endOfDay(day),
    allDay: true,
    color: "teal",
    type: "Task",
  }
}

function CalendarDataLayer({ scope, level, userId }: CalendarClientProps) {
  const t = useT("calendar")
  const tLeave = useT("leave")
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()
  const { userEmail } = useUserProfile()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [openTask, setOpenTask] = useState<{
    projectId: string
    taskId: string
  } | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const { currentDate, viewMode } = useCalendarContext()

  const config = SCOPES[scope]
  const personal = scope === "personal"
  const isStakeholder = level === "stakeholder"
  // Other people's leave: PM and stakeholders only, and only on the project
  // calendar. Everyone sees their own on the personal one.
  const teamLeave = !personal && level !== "employee"
  const eventTypes = config.eventTypes[level]

  const categories: EventCategory[] = useMemo(
    () =>
      config.categories
        .filter(
          (type) =>
            personal || teamLeave || (type !== "Cuti" && type !== "WFH"),
        )
        .map((type) => {
          const definition = getEventTypeDefinition(type)
          const labelKey = getEventTypeLabelKey(type)
          return {
            id: type,
            name: labelKey ? t(labelKey) : (definition?.label ?? type),
            color: definition?.color ?? "neutral",
            // Task deadlines start hidden on the personal calendar (opt-in filter).
            isActive: !(personal && type === "Task"),
          }
        }),
    [config, personal, teamLeave, t],
  )

  const range = useMemo(() => {
    const viewRange = getViewRange(currentDate, viewMode)
    return {
      start: startOfDay(viewRange.start),
      end: endOfDay(viewRange.end),
    }
  }, [currentDate, viewMode])
  const rangeStartIso = range.start.toISOString()
  const rangeEndIso = range.end.toISOString()
  // Local days for the date columns (toISOString is UTC, a day early in WIB).
  const rangeStartDate = format(range.start, "yyyy-MM-dd")
  const rangeEndDate = format(range.end, "yyyy-MM-dd")
  const onTimeline = viewMode === "timeline"
  const eventsKey = ["calendar-events", scope, rangeStartIso, rangeEndIso]

  const { data: rawEvents = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: eventsKey,
    enabled: !onTimeline,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("calendar_events")
          .select(
            "id,title,description,start_at,end_at,color,location,all_day,meeting_url,guests,reminders,rsvp_status,organizer,event_type,user_id,is_recurring,recurrence_rule",
          )
          // Overlaps the range; recurring events can start long before it.
          .lte("start_at", rangeEndIso)
          .or(`end_at.gte.${rangeStartIso},end_at.is.null,is_recurring.eq.true`)

        if (error) {
          throw error
        }
        return (data || []).map(mapRowToEvent)
      } catch (error) {
        toast.error(t("toastInternalLoadFailed"))
        throw error
      }
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  // RLS already hides other people's Personal events; this picks what
  // belongs on this calendar.
  const events = useMemo(
    () =>
      rawEvents.filter((event) =>
        personal
          ? onMyAgenda(event, userId, userEmail ?? null)
          : PROJECT_EVENT_TYPES.has(event.type ?? ""),
      ),
    [rawEvents, personal, userId, userEmail],
  )

  const { data: leaveRequests = [], isLoading: leaveLoading } = useQuery<
    LeaveRequestCalendarRow[]
  >({
    queryKey: [
      "calendar-leave",
      scope,
      userId,
      teamLeave,
      rangeStartDate,
      rangeEndDate,
    ],
    queryFn: async () => {
      try {
        let query = supabase
          .from("leave_requests")
          .select(
            "id,start_date,end_date,leave_type,status,reason,user_id,profiles(full_name)",
          )
          .eq("status", "approved")
          .lte("start_date", rangeEndDate)
          .gte("end_date", rangeStartDate)

        if (!teamLeave) query = query.eq("user_id", userId!)

        const { data, error } = await query
        if (error) throw error
        return (data || []) as unknown as LeaveRequestCalendarRow[]
      } catch (error) {
        toast.error(t("toastLeaveLoadFailed"))
        throw error
      }
    },
    enabled: !!userId && !onTimeline && (personal || teamLeave),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const { data: oneOnOneSlots = [], isLoading: oneOnOneLoading } = useQuery<
    OneOnOneCalendarRow[]
  >({
    queryKey: ["calendar-1on1", userId, rangeStartIso, rangeEndIso],
    queryFn: async () => {
      try {
        const response = await fetch("/api/one-on-one/slots")
        if (!response.ok) {
          throw new Error("fetch_failed")
        }

        const payload = (await response.json().catch(() => null)) as {
          slots?: OneOnOneCalendarRow[]
        } | null

        // Only the ones you're in (as organizer or employee).
        return (payload?.slots || []).filter(
          (slot) =>
            slot.start_at <= rangeEndIso &&
            slot.end_at >= rangeStartIso &&
            (slot.booked_by === userId || slot.organizer_id === userId),
        )
      } catch (error) {
        toast.error(t("toastOneOnOneLoadFailed"))
        throw error
      }
    },
    enabled: !!userId && personal,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  // Task deadlines: your own on the personal calendar, the team's on the
  // project one (which also feeds the timeline).
  const myTasks = useMyTasks(personal ? userId : null)
  const projectData = useProjectCalendarData(isStakeholder, !personal)

  const taskEvents = useMemo(() => {
    if (personal) {
      const data = myTasks.data
      return (data?.tasks ?? [])
        .filter((task) => task.due_date && !task.done)
        .map((task) => taskToEvent(task, data?.projects[task.project_id]?.name))
    }
    const data = projectData.data
    const names = new Map(data?.projects.map((p) => [p.id, p.name]) ?? [])
    return (data?.tasks ?? [])
      .filter((task) => task.due_date && !task.done)
      .map((task) => taskToEvent(task, names.get(task.project_id)))
  }, [personal, myTasks.data, projectData.data])

  const taskProject = useMemo(() => {
    const map = new Map<string, string>()
    for (const task of myTasks.data?.tasks ?? [])
      map.set(task.id, task.project_id)
    for (const task of projectData.data?.tasks ?? [])
      map.set(task.id, task.project_id)
    return map
  }, [myTasks.data, projectData.data])

  const openTaskById = (taskId: string, projectId?: string) => {
    const project = projectId ?? taskProject.get(taskId)
    if (!project) return
    setOpenTask({ projectId: project, taskId })
    setTaskDialogOpen(true)
  }

  const handleEventOpen = (event: CalendarEvent) => {
    if (!event.id.startsWith("task-")) return false
    openTaskById(event.id.slice("task-".length))
    return true
  }

  const refreshTasks = () => {
    queryClient.invalidateQueries({ queryKey: myTasksKey(userId) })
    queryClient.invalidateQueries({ queryKey: projectCalendarKey })
  }

  const leaveEvents = useMemo(
    () => leaveRequests.map((row) => mapLeaveRowToEvent(row, t, tLeave)),
    [leaveRequests, t, tLeave],
  )

  const oneOnOneEvents = useMemo(
    () =>
      oneOnOneSlots
        .map((slot) => mapSlotToEvent(slot, t))
        .filter(Boolean) as CalendarEvent[],
    [oneOnOneSlots, t],
  )

  const blockedGoogleEventIds = useMemo(
    () =>
      oneOnOneSlots
        .map((slot) => slot.google_event_id)
        .filter((id): id is string => Boolean(id)),
    [oneOnOneSlots],
  )

  const combinedEvents = useMemo(
    () => [...events, ...leaveEvents, ...oneOnOneEvents, ...taskEvents],
    [events, leaveEvents, oneOnOneEvents, taskEvents],
  )

  const canEditEvent = (event: CalendarEvent) =>
    !isSyntheticId(event.id) &&
    !event.googleEventId &&
    (event.employeeId === userId ||
      (isStakeholder && event.type !== "Personal"))

  const refreshEvents = () =>
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] })

  const handleEventAdd = async (eventData: Partial<CalendarEvent>) => {
    const payload = mapEventToInsert(eventData)
    if (userId) {
      payload.user_id = userId
    }
    if (!payload.title || !payload.start_at || !payload.end_at) {
      toast.error(t("toastEventIncomplete"))
      return
    }
    if (!payload.color) {
      const typeDefinition = payload.event_type
        ? getEventTypeDefinition(payload.event_type)
        : undefined
      payload.color = typeDefinition?.color ?? "blue"
    }

    const { error } = await supabase
      .from("calendar_events")
      .insert([payload as CalendarEventInsert])
    if (error) {
      toast.error(t("toastAddFailed"))
      // Reject so the dialog stays open with the user's input.
      throw error
    }
    toast.success(t("toastAdded"))
    refreshEvents()
    setDialogOpen(false)
  }

  const handleEventUpdate = async (eventData: Partial<CalendarEvent>) => {
    if (!eventData.id) return
    const payload = mapEventToInsert(eventData)
    // Sharing Santuy participants change through the join RPC; an edit must
    // not write back a stale list.
    if (eventData.type === SANTUY) delete payload.guests
    const { error } = await supabase
      .from("calendar_events")
      .update(payload)
      .eq("id", eventData.id)

    if (error) {
      toast.error(t("toastUpdateFailed"))
      throw error
    }
    toast.success(t("toastUpdated"))
    refreshEvents()
    setDialogOpen(false)
  }

  const handleEventDelete = async (eventId: string) => {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId)
    if (error) {
      toast.error(t("toastDeleteFailed"))
      return
    }
    toast.success(t("toastDeleted"))
    refreshEvents()
  }

  const loading =
    isLoading ||
    leaveLoading ||
    oneOnOneLoading ||
    (personal ? myTasks.isLoading : projectData.isLoading)

  return (
    <>
      <CalendarContent
        events={combinedEvents}
        loading={loading}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        handleEventAdd={handleEventAdd}
        handleEventUpdate={handleEventUpdate}
        handleEventDelete={handleEventDelete}
        canAdd={eventTypes.length > 0}
        canEditEvent={canEditEvent}
        eventTypes={eventTypes}
        categories={categories}
        views={config.views}
        basePath={config.basePath}
        withGoogle={personal}
        blockedGoogleEventIds={blockedGoogleEventIds}
        onEventOpen={handleEventOpen}
        timeline={
          personal ? undefined : (
            <ProjectTimeline
              projects={projectData.data?.projects ?? []}
              tasks={projectData.data?.tasks ?? []}
              loading={projectData.isLoading}
              onOpenTask={(task) => openTaskById(task.id, task.project_id)}
            />
          )
        }
      />
      {openTask && (
        <ProjectTaskDialog
          projectId={openTask.projectId}
          taskId={openTask.taskId}
          open={taskDialogOpen}
          onOpenChange={(open) => {
            setTaskDialogOpen(open)
            if (!open) refreshTasks()
          }}
          onChanged={refreshTasks}
        />
      )}
    </>
  )
}

export default function CalendarClient({
  scope,
  level,
  userId,
}: CalendarClientProps) {
  return (
    <CalendarProvider initialView={SCOPES[scope].views[0]}>
      <GoogleCalendarProvider>
        <CalendarDataLayer scope={scope} level={level} userId={userId} />
      </GoogleCalendarProvider>
    </CalendarProvider>
  )
}

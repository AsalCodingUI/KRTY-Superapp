"use client"

import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"
import {
  CalendarSkeleton,
  CalendarToolbar,
  EmptyState,
  useCalendarContext,
  type CalendarEvent,
  type EventCategory,
  type ViewMode,
} from "@/widgets/event-calendar"
import { useGoogleCalendar } from "@/widgets/event-calendar/ui/hooks/use-google-calendar"
import {
  endOfDay,
  format,
  isSameDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
} from "date-fns"
import dynamic from "next/dynamic"
import { useEffect, useMemo } from "react"
import { toast } from "sonner"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import { useQuery } from "@tanstack/react-query"
import { getViewRange } from "@/widgets/event-calendar/ui/utils"

const EventCalendar = dynamic(
  () =>
    import("@/widgets/event-calendar/ui/EventCalendar").then(
      (mod) => mod.EventCalendar,
    ),
  {
    ssr: false,
    loading: () => null,
  },
)

// Separate component to use useCalendarContext
function CalendarContent({
  events,
  loading,
  dialogOpen,
  setDialogOpen,
  handleEventAdd,
  handleEventUpdate,
  handleEventDelete,
  isStakeholder,
  categories,
  blockedGoogleEventIds,
}: {
  events: CalendarEvent[]
  loading: boolean
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  handleEventAdd: (eventData: Partial<CalendarEvent>) => Promise<void>
  handleEventUpdate: (eventData: Partial<CalendarEvent>) => Promise<void>
  handleEventDelete: (eventId: string) => Promise<void>
  isStakeholder: boolean
  categories: EventCategory[]
  blockedGoogleEventIds?: string[]
}) {
  const {
    currentDate,
    viewMode,
    goToToday,
    goToNext,
    goToPrevious,
    setViewMode,
  } = useCalendarContext()
  const { activeTab: viewTab, setActiveTab: setViewTab } =
    useTabRoute<"month" | "week" | "day" | "agenda">({
      basePath: "/calendar",
      tabs: ["month", "week", "day", "agenda"],
      defaultTab: "week",
      mode: "history",
    })
  const { isConnected } = useGoogleCalendar()

  const viewRange = useMemo(() => {
    const range = getViewRange(currentDate, viewMode)
    return {
      start: startOfDay(range.start),
      end: endOfDay(range.end),
    }
  }, [currentDate, viewMode])

  useEffect(() => {
    if (viewTab && viewTab !== viewMode) {
      setViewMode(viewTab)
    }
  }, [viewTab, viewMode, setViewMode])

  const handleViewChange = (nextView: ViewMode) => {
    if (nextView !== viewMode) {
      setViewMode(nextView)
    }
    if (nextView !== viewTab) {
      setViewTab(nextView)
    }
  }

  const { data: googleEventsRaw = [], isLoading: googleLoading } = useQuery<
    CalendarEvent[]
  >({
    queryKey: [
      "google-events",
      viewRange.start.toISOString(),
      viewRange.end.toISOString(),
    ],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          start: viewRange.start.toISOString(),
          end: viewRange.end.toISOString(),
        })
        const response = await fetch(
          `/api/calendar/events?${params.toString()}`,
        )
        if (!response.ok) {
          throw new Error("Failed to fetch Google Calendar events")
        }
        const data = await response.json()
        return (data.events || []).map((event: CalendarEvent) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }))
      } catch (error) {
        toast.error("Gagal memuat Google Calendar")
        throw error
      }
    },
    enabled: isConnected,
  })

  const googleEvents = useMemo(() => {
    if (!blockedGoogleEventIds?.length) return googleEventsRaw
    const blockedSet = new Set(blockedGoogleEventIds)
    return googleEventsRaw.filter(
      (event) => !event.googleEventId || !blockedSet.has(event.googleEventId),
    )
  }, [googleEventsRaw, blockedGoogleEventIds])

  const allEvents = useMemo(() => {
    if (googleEvents.length === 0) return events
    const map = new Map<string, CalendarEvent>()
    events.forEach((event) => map.set(event.id, event))
    googleEvents.forEach((event) => map.set(event.id, event))
    return Array.from(map.values())
  }, [events, googleEvents])

  const { meetingCount, upcomingThisWeek } = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }).getTime()
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }).getTime()
    let meetingsToday = 0
    let upcoming = 0

    for (const event of allEvents) {
      const eventStart = event.start.getTime()
      if (eventStart >= weekStart && eventStart <= weekEnd) {
        upcoming += 1
      }

      if (!isSameDay(event.start, currentDate)) continue

      const type = (event.type || "").toLowerCase()
      const title = (event.title || "").toLowerCase()
      const description = (event.description || "").toLowerCase()
      const isMeeting =
        Boolean(event.meetingUrl) ||
        type.includes("meeting") ||
        type === "internal" ||
        type === "internal meeting" ||
        title.includes("meeting") ||
        description.includes("meeting")

      if (isMeeting) {
        meetingsToday += 1
      }
    }

    return {
      meetingCount: meetingsToday,
      upcomingThisWeek: upcoming,
    }
  }, [allEvents, currentDate])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCreateEvent: isStakeholder ? () => setDialogOpen(true) : () => { },
    onGoToday: goToToday,
    onPrevious: goToPrevious,
    onNext: goToNext,
    onViewChange: setViewMode,
  })

  return (
    <div className="flex min-h-[calc(100vh-1rem)] flex-col">
      <div className="flex items-center gap-md rounded-xxl px-5 pt-4 pb-3">
        <RiCalendarLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">Calendar</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-xxl bg-surface-neutral-primary">
        <div className="grid grid-cols-1 gap-md px-5 py-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3">
            <p className="text-label-sm text-foreground-secondary">
              Current Date
            </p>
            <p className="text-heading-md text-foreground-primary">
              {format(currentDate, "EEEE, dd MMM")}
            </p>
          </div>
          <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3">
            <p className="text-label-sm text-foreground-secondary">
              Meetings Today
            </p>
            <p className="text-heading-md text-foreground-primary">
              {meetingCount}
            </p>
          </div>
          <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3">
            <p className="text-label-sm text-foreground-secondary">
              Upcoming This Week
            </p>
            <p className="text-heading-md text-foreground-primary">
              {upcomingThisWeek}
            </p>
          </div>
        </div>

        <div className="border-b border-neutral-primary px-5 py-2">
          <CalendarToolbar
            onAddEvent={() => setDialogOpen(true)}
            showAddEvent={isStakeholder}
            onViewChange={handleViewChange}
          />
        </div>

        <div className="flex min-h-0 w-full flex-1 p-5">
          {loading || googleLoading ? (
            <CalendarSkeleton />
          ) : allEvents.length === 0 ? (
            <EmptyState
              onCreateEvent={
                isStakeholder ? () => setDialogOpen(true) : undefined
              }
            />
          ) : (
            <div className="flex min-h-0 w-full flex-1">
              <EventCalendar
                events={allEvents}
                onEventAdd={handleEventAdd}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
                categories={categories}
                canEdit={isStakeholder}
                dialogOpen={dialogOpen}
                onDialogOpenChange={setDialogOpen}
              />
            </div>
          )}
        </div>
      </div>
      {/* EventDialog is now handled inside EventCalendar component to avoid duplication */}
    </div>
  )
}

export { CalendarContent }

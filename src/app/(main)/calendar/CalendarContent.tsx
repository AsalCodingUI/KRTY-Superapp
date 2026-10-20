"use client"

import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
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
import { getViewRange } from "@/widgets/event-calendar/ui/utils"
import { useQuery } from "@tanstack/react-query"
import {
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "date-fns"
import { id } from "date-fns/locale"
import dynamic from "next/dynamic"
import { useEffect, useMemo } from "react"
import { toast } from "sonner"

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
  const { activeTab: viewTab, setActiveTab: setViewTab } = useTabRoute<
    "month" | "week" | "day" | "agenda"
  >({
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
          throw new Error("Gagal memuat event Google Calendar")
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
    onCreateEvent: isStakeholder ? () => setDialogOpen(true) : () => {},
    onGoToday: goToToday,
    onPrevious: goToPrevious,
    onNext: goToNext,
    onViewChange: setViewMode,
  })

  return (
    <div className="flex min-h-[calc(100vh-1rem)] flex-col">
      <div className="flex items-center gap-2 pb-4">
        <h1 className="text-foreground truncate text-xl font-semibold tracking-tight">
          Kalender
        </h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="bg-border my-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border sm:my-2 xl:grid-cols-3">
          <div className="bg-background md:bg-sidebar flex h-full flex-col gap-1 px-4 py-3 [&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1">
            <p className="text-muted-foreground text-sm font-medium">
              Tanggal Saat Ini
            </p>
            <p className="text-foreground text-lg font-semibold">
              {format(currentDate, "EEEE, dd MMM", { locale: id })}
            </p>
          </div>
          <div className="bg-background md:bg-sidebar flex h-full flex-col gap-1 px-4 py-3 [&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1">
            <p className="text-muted-foreground text-sm font-medium">
              Rapat Hari Ini
            </p>
            <p className="text-foreground text-lg font-semibold">
              {meetingCount}
            </p>
          </div>
          <div className="bg-background md:bg-sidebar flex h-full flex-col gap-1 px-4 py-3 [&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1">
            <p className="text-muted-foreground text-sm font-medium">
              Jadwal Minggu Ini
            </p>
            <p className="text-foreground text-lg font-semibold">
              {upcomingThisWeek}
            </p>
          </div>
        </div>

        <div className="border-border border-b py-3 sm:py-2">
          <CalendarToolbar
            onAddEvent={() => setDialogOpen(true)}
            showAddEvent={isStakeholder}
            onViewChange={handleViewChange}
          />
        </div>

        <div className="flex min-h-0 w-full flex-1 overflow-hidden py-3 sm:py-4">
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

"use client"

import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import {
  CalendarSkeleton,
  CalendarToolbar,
  EmptyState,
  useCalendarContext,
  type CalendarEvent,
  type EventCategory,
} from "@/widgets/event-calendar"
import { useGoogleCalendar } from "@/widgets/event-calendar/ui/hooks/use-google-calendar"

const EventCalendar = dynamic(
  () =>
    import("@/widgets/event-calendar/ui/EventCalendar").then(
      (mod) => mod.EventCalendar,
    ),
  {
    ssr: false,
    loading: () => <CalendarSkeleton />,
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
}) {
  const {
    currentDate,
    viewMode,
    goToToday,
    goToNext,
    goToPrevious,
    setViewMode,
  } = useCalendarContext()
  const { isConnected } = useGoogleCalendar()
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])
  const [googleLoading, setGoogleLoading] = useState(false)

  const viewRange = useMemo(() => {
    switch (viewMode) {
      case "day":
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
        }
      case "week": {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        const end = endOfWeek(currentDate, { weekStartsOn: 1 })
        return { start: startOfDay(start), end: endOfDay(end) }
      }
      case "month": {
        const start = startOfMonth(currentDate)
        const end = endOfMonth(currentDate)
        return { start: startOfDay(start), end: endOfDay(end) }
      }
      case "agenda": {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        const end = endOfWeek(currentDate, { weekStartsOn: 1 })
        return { start: startOfDay(start), end: endOfDay(end) }
      }
      default:
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
        }
    }
  }, [currentDate, viewMode])

  useEffect(() => {
    if (!isConnected) {
      setGoogleEvents([])
      return
    }

    const controller = new AbortController()
    const fetchGoogleEvents = async () => {
      try {
        setGoogleLoading(true)
        const params = new URLSearchParams({
          start: viewRange.start.toISOString(),
          end: viewRange.end.toISOString(),
        })
        const response = await fetch(`/api/calendar/events?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error("Failed to fetch Google Calendar events")
        }
        const data = await response.json()
        const mapped = (data.events || []).map((event: CalendarEvent) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }))
        setGoogleEvents(mapped)
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Gagal memuat Google Calendar")
        }
      } finally {
        setGoogleLoading(false)
      }
    }

    fetchGoogleEvents()

    return () => controller.abort()
  }, [isConnected, viewRange.start, viewRange.end])

  const allEvents = useMemo(() => {
    if (googleEvents.length === 0) return events
    const map = new Map<string, CalendarEvent>()
    events.forEach((event) => map.set(event.id, event))
    googleEvents.forEach((event) => map.set(event.id, event))
    return Array.from(map.values())
  }, [events, googleEvents])

  const meetingCount = allEvents.filter((event) => {
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
    return isMeeting && isSameDay(event.start, currentDate)
  }).length

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const upcomingThisWeek = allEvents.filter((event) =>
    isWithinInterval(event.start, { start: weekStart, end: weekEnd }),
  ).length

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
      <div className="flex items-center gap-md rounded-[14px] px-5 pt-4 pb-3">
        <RiCalendarLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">Calendar</p>
      </div>

      <div className="bg-surface-neutral-primary flex min-h-0 flex-1 flex-col rounded-[14px]">
        <div className="grid grid-cols-1 gap-md px-5 py-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-sm rounded-lg border px-2xl py-xl">
            <p className="text-label-sm text-foreground-secondary">
              Current Date
            </p>
            <p className="text-heading-lg text-foreground-primary">
              {format(currentDate, "EEEE, dd MMM")}
            </p>
          </div>
          <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-sm rounded-lg border px-2xl py-xl">
            <p className="text-label-sm text-foreground-secondary">
              Meetings Today
            </p>
            <p className="text-heading-lg text-foreground-primary">
              {meetingCount}
            </p>
          </div>
          <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-sm rounded-lg border px-2xl py-xl">
            <p className="text-label-sm text-foreground-secondary">
              Upcoming This Week
            </p>
            <p className="text-heading-lg text-foreground-primary">
              {upcomingThisWeek}
            </p>
          </div>
        </div>

        <div className="border-b border-neutral-primary px-5 py-2">
          <CalendarToolbar
            onAddEvent={() => setDialogOpen(true)}
            showAddEvent={isStakeholder}
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

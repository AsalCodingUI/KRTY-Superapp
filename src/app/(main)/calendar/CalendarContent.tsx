"use client"

import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts"
import { useT } from "@/shared/i18n/client"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
// Deep imports (not the `@/widgets/event-calendar` barrel) so the dynamic
// EventCalendar split below isn't defeated by the barrel's static re-exports.
import { useCalendarContext } from "@/widgets/event-calendar/ui/calendar-context"
import { CalendarToolbar } from "@/widgets/event-calendar/ui/CalendarToolbar"
import { CalendarSkeleton } from "@/widgets/event-calendar/ui/components/CalendarSkeleton"
import type {
  CalendarEvent,
  EventCategory,
  ViewMode,
} from "@/widgets/event-calendar/ui/types"
import { EventVisibilityProvider } from "@/widgets/event-calendar/ui/hooks/use-event-visibility"
import { useGoogleCalendar } from "@/widgets/event-calendar/ui/hooks/use-google-calendar"
import { getViewRange } from "@/widgets/event-calendar/ui/utils"
import { useQuery } from "@tanstack/react-query"
import { endOfDay, startOfDay } from "date-fns"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
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

const CALENDAR_VIEWS: readonly ViewMode[] = [
  "week",
  "month",
  "timeline",
  "day",
  "agenda",
]

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
  const t = useT("calendar")
  const pathname = usePathname()
  // Personal calendar lives under /calendar/personal/<view>.
  const basePath = pathname.startsWith("/calendar/personal")
    ? "/calendar/personal"
    : "/calendar"
  const { activeTab: viewTab, setActiveTab: setViewTab } =
    useTabRoute<ViewMode>({
      basePath,
      tabs: CALENDAR_VIEWS,
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
        toast.error(t("toastGoogleLoadFailed"))
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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCreateEvent: isStakeholder ? () => setDialogOpen(true) : () => {},
    onGoToday: goToToday,
    onPrevious: goToPrevious,
    onNext: goToNext,
    onViewChange: setViewMode,
  })

  return (
    <EventVisibilityProvider initialCategories={categories}>
      {/* Fill the viewport under the header; the grid scrolls inside. */}
      <div className="flex h-[calc(100svh-4rem)] min-h-[520px] flex-col gap-4 pt-1">
        <CalendarToolbar
          onAddEvent={() => setDialogOpen(true)}
          showAddEvent={isStakeholder}
          onViewChange={handleViewChange}
        />

        <div className="bg-background dark:bg-surface flex min-h-0 flex-1 overflow-hidden rounded-xl border">
          {loading || (googleLoading && viewMode !== "timeline") ? (
            <CalendarSkeleton />
          ) : (
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
          )}
        </div>
      </div>
    </EventVisibilityProvider>
  )
}

export { CalendarContent }

"use client"

import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts"
import { useT } from "@/shared/i18n/client"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import { cx } from "@/shared/lib/utils"
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
import { useEffect, useMemo, type ReactNode } from "react"
import { toast } from "sonner"
import { CALENDAR_HEIGHT } from "./calendar-height"

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

export type CalendarShellProps = {
  events: CalendarEvent[]
  loading: boolean
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  handleEventAdd: (eventData: Partial<CalendarEvent>) => Promise<void>
  handleEventUpdate: (eventData: Partial<CalendarEvent>) => Promise<void>
  handleEventDelete: (eventId: string) => Promise<void>
  /** May create events here. */
  canAdd: boolean
  canEditEvent: (event: CalendarEvent) => boolean
  /** Types offered in the new-event form. */
  eventTypes: string[]
  categories: EventCategory[]
  /** Views in the switch; the first is the default. */
  views: ViewMode[]
  basePath: string
  /** Merge in the user's Google Calendar (personal calendar only). */
  withGoogle: boolean
  blockedGoogleEventIds?: string[]
  onEventOpen?: (event: CalendarEvent) => boolean
  timeline?: ReactNode
}

function CalendarContent({
  events,
  loading,
  dialogOpen,
  setDialogOpen,
  handleEventAdd,
  handleEventUpdate,
  handleEventDelete,
  canAdd,
  canEditEvent,
  eventTypes,
  categories,
  views,
  basePath,
  withGoogle,
  blockedGoogleEventIds,
  onEventOpen,
  timeline,
}: CalendarShellProps) {
  const {
    currentDate,
    viewMode,
    goToToday,
    goToNext,
    goToPrevious,
    setViewMode,
  } = useCalendarContext()
  const t = useT("calendar")
  const { activeTab: viewTab, setActiveTab: setViewTab } =
    useTabRoute<ViewMode>({
      basePath,
      tabs: views,
      defaultTab: views[0],
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
    if (!views.includes(nextView)) return
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
    enabled: withGoogle && isConnected,
  })

  const allEvents = useMemo(() => {
    if (!withGoogle || googleEventsRaw.length === 0) return events
    const blocked = new Set(blockedGoogleEventIds ?? [])
    const map = new Map<string, CalendarEvent>()
    events.forEach((event) => map.set(event.id, event))
    googleEventsRaw
      .filter(
        (event) => !event.googleEventId || !blocked.has(event.googleEventId),
      )
      .forEach((event) => map.set(event.id, event))
    return Array.from(map.values())
  }, [events, googleEventsRaw, blockedGoogleEventIds, withGoogle])

  useKeyboardShortcuts({
    onCreateEvent: canAdd ? () => setDialogOpen(true) : () => {},
    onGoToday: goToToday,
    onPrevious: goToPrevious,
    onNext: goToNext,
    onViewChange: handleViewChange,
  })

  const waiting =
    viewMode !== "timeline" &&
    (loading || (withGoogle && isConnected && googleLoading))

  return (
    <EventVisibilityProvider initialCategories={categories}>
      {/* Fills the page sheet exactly; the grid scrolls inside. */}
      <div
        className={cx(
          CALENDAR_HEIGHT,
          "flex min-h-[520px] flex-col gap-4 pt-1",
        )}
      >
        <CalendarToolbar
          onAddEvent={() => setDialogOpen(true)}
          showAddEvent={canAdd}
          onViewChange={handleViewChange}
          views={views}
          showGoogleStatus={withGoogle}
        />

        <div className="bg-background dark:bg-surface flex min-h-0 flex-1 overflow-hidden rounded-xl border">
          {waiting ? (
            <CalendarSkeleton />
          ) : (
            <EventCalendar
              events={allEvents}
              onEventAdd={handleEventAdd}
              onEventUpdate={handleEventUpdate}
              onEventDelete={handleEventDelete}
              categories={categories}
              canEdit={canAdd}
              canEditEvent={canEditEvent}
              onEventOpen={onEventOpen}
              eventTypes={eventTypes}
              timeline={timeline}
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

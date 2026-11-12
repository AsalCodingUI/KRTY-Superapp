"use client"

import { sheetFillClassName } from "@/components/split-pane"
import { useNewParam } from "@/shared/hooks/useNewParam"
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts"
import { useT } from "@/shared/i18n/client"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import { isIdHolidayDate } from "@/shared/lib/id-holidays"
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
import { endOfDay, format, startOfDay } from "date-fns"
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
  /** Above the toolbar, where a page title would be (the scope switch). */
  header?: ReactNode
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
  header,
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
      // Indonesian holidays come from our own list (id-holidays.ts, shown to
      // stakeholders only); Google's copy of the same day would double it.
      .filter(
        (event) =>
          event.type !== "Public Holiday" ||
          !isIdHolidayDate(format(event.start, "yyyy-MM-dd")),
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

  // The sidebar's + menu: Event baru.
  useNewParam(() => setDialogOpen(true), canAdd)

  const waiting =
    viewMode !== "timeline" &&
    (loading || (withGoogle && isConnected && googleLoading))

  return (
    <EventVisibilityProvider initialCategories={categories}>
      {/* Fills the page sheet; the grid scrolls inside. From lg edge to
          edge (sheetFill): one bar on top (the scopes' tabs, then the
          toolbar), the grid under it with no card around it. Narrower:
          the scopes, the toolbar and the grid as a card, as before. */}
      <div
        data-sheet-fill=""
        className={cx(
          CALENDAR_HEIGHT,
          sheetFillClassName,
          "flex min-h-[520px] flex-col gap-4 pt-6 lg:gap-0 lg:pt-0",
        )}
      >
        {/* The bar: 44px (the tabs' height) 6px from the top, so its
            controls centre on the sidebar panel's "Kantor"; the active
            tab's underline sits on the hairline under it. */}
        <div className="border-border flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-x-6 lg:border-b lg:px-6 lg:pt-1.5">
          {header && <div className="shrink-0 lg:self-end">{header}</div>}
          {/* The pages (tabs) apart from the view switch beside them, the
              toolbar's own divider. */}
          {header && (
            <div aria-hidden className="bg-border h-4 w-px max-lg:hidden" />
          )}
          <div className="min-w-0 flex-1 lg:py-1.5">
            <CalendarToolbar
              onAddEvent={() => setDialogOpen(true)}
              showAddEvent={canAdd}
              onViewChange={handleViewChange}
              views={views}
              showGoogleStatus={withGoogle}
            />
          </div>
        </div>

        <div className="bg-background dark:bg-surface flex min-h-0 flex-1 overflow-hidden max-lg:rounded-xl max-lg:border">
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
              views={views}
              onViewChange={handleViewChange}
            />
          )}
        </div>
      </div>
    </EventVisibilityProvider>
  )
}

export { CalendarContent }

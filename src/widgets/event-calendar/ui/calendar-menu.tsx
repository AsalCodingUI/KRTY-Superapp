"use client"

/**
 * The calendar's right-click menu (shared/context-menu):
 *
 * - an event: open / edit / duplicate / move to a date / Meet / copy /
 *   delete, by what it is (a task deadline, approved leave, a national or
 *   office holiday, a Sharing Santuy session, a 1:1, a Google event, ours)
 *   and only what the viewer may do (the same checks as the dialog);
 * - empty space (a day cell, an hour slot, the all-day strip): a new event
 *   there, switch to that week / month, today, go to a date.
 *
 * EventCalendar provides the actions (useCalendarMenuApi); the views mark
 * events with <EventTarget> and slots with `data-cal-slot` on a surface
 * registered by useCalendarSurface.
 */

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  ContextTarget,
  copyText,
  useContextTarget,
  type CtxItem,
  type CtxSection,
} from "@/shared/context-menu"
import { getIdHoliday } from "@/shared/lib/id-holidays"
import { useQueryClient } from "@tanstack/react-query"
import { endOfDay, format, startOfDay } from "date-fns"
import {
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  CalendarSearch,
  CalendarX,
  ClipboardCopy,
  CopyPlus,
  Eye,
  FileText,
  Link as LinkIcon,
  ListTodo,
  Pencil,
  Settings2,
  Trash2,
  UserCheck,
  Video,
} from "@/components/icons"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import {
  createContext,
  useContext,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react"
import { toast } from "sonner"
import { runUndo } from "@/shared/undo"
import {
  officeHolidayKey,
  setOfficeHoliday,
  unsetOfficeHoliday,
  registerOfficeHolidayUndo,
} from "../lib/office-holiday"
import { useCalendarContext } from "./calendar-context"
import { eventDetailsText } from "./components/CopyEventButton"
import type { CalendarEvent, ViewMode } from "./types"

const PickDateDialog = dynamic(
  () => import("./components/PickDateDialog").then((m) => m.PickDateDialog),
  { loading: () => null },
)

type CalendarT = ReturnType<typeof useT<"calendar">>

const SANTUY = "Sharing Santuy"
const SANTUY_PAGE = "/calendar/santuy"

/** What an event is, for its menu. */
type EventKind =
  | "task"
  | "leave"
  | "holiday"
  | "office-holiday"
  | "santuy"
  | "one-on-one"
  | "google"
  | "event"

function eventKind(event: CalendarEvent): EventKind {
  if (event.id.startsWith("task-")) return "task"
  if (event.id.startsWith("leave-")) return "leave"
  if (event.id.startsWith("holiday-")) return "holiday"
  if (event.holidayKey) return "office-holiday"
  if (event.id.startsWith("santuy-")) return "santuy"
  if (event.id.startsWith("perf-")) return "one-on-one"
  if (event.googleEventId) return "google"
  return "event"
}

const isUrl = (value?: string) => !!value && /^https?:\/\//i.test(value)

/** The call link: the Meet URL, or a location that is one. */
const meetUrlOf = (event: CalendarEvent) =>
  event.meetingUrl || (isUrl(event.location) ? event.location : undefined)

/** What the calendar lets the menu do; EventCalendar provides it. */
export type CalendarMenuApi = {
  /** What a click does (the event's dialog, or a task's own dialog). */
  open: (event: CalendarEvent) => void
  /** Straight to the form (Sharing Santuy rows open on details). */
  edit: (event: CalendarEvent) => void
  /** The new-event form, prefilled from it. */
  duplicate: (event: CalendarEvent) => void
  /** Pick a date, then move it there (same time and length). */
  move: (event: CalendarEvent) => void
  remove: (event: CalendarEvent) => void | Promise<unknown>
  /** National holiday → office holiday (true), or back (false). */
  setOfficeHoliday: (event: CalendarEvent, on: boolean) => Promise<unknown>
  /** The new-event form at this time (all day: that whole day). */
  newAt: (date: Date, allDay?: boolean) => void
  /** Switch view, showing the period around `date`. */
  show: (view: ViewMode, date: Date) => void
  goToToday: () => void
  /** "Pergi ke tanggal…". */
  pickDate: () => void
  navigate: (href: string) => void
  copy: (text: string) => Promise<unknown>
  canAdd: boolean
  canEditEvent: (event: CalendarEvent) => boolean
  /** Types this person may create (a duplicate keeps one of these). */
  eventTypes?: string[]
  views: ViewMode[]
  viewMode: ViewMode
  dateLocale: ReturnType<typeof useDateLocale>
}

const CalendarMenuContext = createContext<CalendarMenuApi | null>(null)
export const CalendarMenuProvider = CalendarMenuContext.Provider
const useCalendarMenu = () => useContext(CalendarMenuContext)

/**
 * Builds the menu's actions from the calendar's own handlers, plus the date
 * picker they open (render `dialog` once).
 */
export function useCalendarMenuApi({
  openEvent,
  editEvent,
  newEvent,
  updateEvent,
  deleteEvent,
  canAdd,
  canEditEvent,
  eventTypes,
  views,
  onViewChange,
}: {
  openEvent: (event: CalendarEvent) => void
  editEvent: (event: CalendarEvent) => void
  /** The new-event form: at a time, or prefilled (a duplicate). */
  newEvent: (init: { date?: Date; draft?: Partial<CalendarEvent> }) => void
  updateEvent: (event: CalendarEvent) => Promise<void>
  deleteEvent?: (eventId: string) => Promise<void>
  canAdd: boolean
  canEditEvent: (event: CalendarEvent) => boolean
  eventTypes?: string[]
  views: ViewMode[]
  onViewChange: (view: ViewMode) => void
}): { api: CalendarMenuApi; dialog: ReactNode } {
  const t = useT("calendar")
  const tu = useT("undo")
  const dateLocale = useDateLocale()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { profile, authProfile } = useUserProfile()
  const { currentDate, setCurrentDate, viewMode, goToToday } =
    useCalendarContext()
  // The date picker: where to go, or which event to move.
  const [pick, setPick] = useState<{ event?: CalendarEvent } | null>(null)
  const [pickOpen, setPickOpen] = useState(false)

  const copy = async (text: string) => {
    if (await copyText(text)) toast.success(t("ctxCopied"))
    else toast.error(t("ctxCopyFailed"))
  }

  const toggleOffice = async (event: CalendarEvent, on: boolean) => {
    const key = event.holidayKey
    const holiday = getIdHoliday(key)
    if (!key || !holiday) return
    const userId = authProfile?.id ?? profile?.id ?? null
    const set = () => setOfficeHoliday(holiday, key, userId)
    const unset = () => unsetOfficeHoliday(key)
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: officeHolidayKey(key) })
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] })
    }
    const ok = await (on ? set() : unset())
    refresh()
    if (!ok) {
      toast.error(t("holidayOfficeFailed"))
      return
    }
    // ⌘Z and the toast's Undo are the same step (shared/undo).
    const undoId = registerOfficeHolidayUndo({
      on,
      holiday,
      holidayKey: key,
      userId,
      label: tu(on ? "holidaySet" : "holidayCancel", { name: holiday.name }),
      refresh,
    })
    toast.success(
      on
        ? t("holidayOfficeSetToast", { name: holiday.name })
        : t("holidayOfficeUnsetToast"),
      {
        action: {
          label: t("holidayOfficeUndo"),
          onClick: () => void runUndo("undo", undoId),
        },
      },
    )
  }

  const api: CalendarMenuApi = {
    open: openEvent,
    edit: editEvent,
    duplicate: (event) =>
      newEvent({
        draft: {
          title: event.title,
          description: event.description,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          location: event.location,
          color: event.color,
          type: event.type,
          meetingUrl: event.meetingUrl,
          guests: event.guests,
          reminders: event.reminders,
        },
      }),
    move: (event) => {
      setPick({ event })
      setPickOpen(true)
    },
    remove: (event) => deleteEvent?.(event.id),
    setOfficeHoliday: toggleOffice,
    newAt: (date, allDay) =>
      newEvent(
        allDay
          ? {
              draft: {
                start: startOfDay(date),
                end: endOfDay(date),
                allDay: true,
              },
            }
          : { date },
      ),
    show: (view, date) => {
      setCurrentDate(date)
      onViewChange(view)
    },
    goToToday,
    pickDate: () => {
      setPick({})
      setPickOpen(true)
    },
    navigate: (href) => router.push(href),
    copy,
    canAdd,
    canEditEvent,
    eventTypes,
    views,
    viewMode,
    dateLocale,
  }

  const moving = pick?.event
  const onPick = (day: Date) => {
    if (!moving) {
      setCurrentDate(day)
      return
    }
    // Same time of day and length, on the picked date.
    const start = new Date(day)
    start.setHours(
      moving.start.getHours(),
      moving.start.getMinutes(),
      moving.start.getSeconds(),
      0,
    )
    const end = new Date(
      start.getTime() + (moving.end.getTime() - moving.start.getTime()),
    )
    void updateEvent({ ...moving, start, end }).catch(() => {})
  }

  const dialog = pick ? (
    <PickDateDialog
      open={pickOpen}
      onOpenChange={setPickOpen}
      title={moving ? t("ctxMoveTitle") : t("ctxPickTitle")}
      description={moving ? `${moving.title} · ${t("ctxMoveHint")}` : undefined}
      initial={moving ? moving.start : currentDate}
      onPick={onPick}
    />
  ) : null

  return { api, dialog }
}

/** The event's items, in groups: act on it / Meet and copy / delete. */
function eventSections(
  event: CalendarEvent,
  api: CalendarMenuApi,
  t: CalendarT,
): CtxSection[] {
  const kind = eventKind(event)
  // Ours and editable by this person (the dialog's own check).
  const editable = kind === "event" && api.canEditEvent(event)
  const santuyRow = event.type === SANTUY
  const main: CtxItem[] = []

  if (kind === "task") {
    main.push({
      id: "open-task",
      label: t("ctxOpenTask"),
      icon: ListTodo,
      onSelect: () => api.open(event),
    })
  } else if (editable && !santuyRow) {
    // Its dialog is the form already.
    main.push({
      id: "edit",
      label: t("ctxEdit"),
      icon: Pencil,
      onSelect: () => api.open(event),
    })
  } else {
    main.push({
      id: "detail",
      label: t("ctxDetail"),
      icon: Eye,
      onSelect: () => api.open(event),
    })
    if (editable)
      main.push({
        id: "edit",
        label: t("ctxEdit"),
        icon: Pencil,
        onSelect: () => api.edit(event),
      })
  }

  if (kind === "leave")
    main.push({
      id: "leave",
      label: t("ctxOpenLeave"),
      icon: FileText,
      onSelect: () => api.navigate("/leave"),
    })

  // Only stakeholders see national holidays (and set office ones).
  if (kind === "holiday")
    main.push({
      id: "office-on",
      label: t("ctxHolidayMake"),
      icon: CalendarCheck,
      access: ["stakeholder"],
      // Everyone is notified of the new office holiday.
      confirm: t("ctxHolidayMakeConfirm"),
      onSelect: () => api.setOfficeHoliday(event, true),
    })

  if (kind === "santuy") {
    const date = event.id.slice("santuy-".length)
    main.push(
      {
        id: "santuy-page",
        label: t("ctxSantuyPage"),
        icon: Settings2,
        onSelect: () => api.navigate(SANTUY_PAGE),
      },
      {
        id: "santuy-assign",
        label: t("ctxSantuyAssign"),
        icon: UserCheck,
        // Same as the page: PMs and stakeholders run the rotation.
        access: ["pm", "stakeholder"],
        onSelect: () => api.navigate(`${SANTUY_PAGE}?week=${date}`),
      },
    )
  }

  if (editable && !event.holidayKey) {
    const typeAllowed =
      !!event.type && (api.eventTypes ?? []).includes(event.type)
    if (api.canAdd && typeAllowed)
      main.push({
        id: "duplicate",
        label: t("ctxDuplicate"),
        icon: CopyPlus,
        onSelect: () => api.duplicate(event),
      })
    main.push({
      id: "move",
      label: t("ctxMove"),
      icon: CalendarDays,
      onSelect: () => api.move(event),
    })
  }

  const share: CtxItem[] = []
  const meet = meetUrlOf(event)
  if (meet)
    share.push(
      {
        id: "join-meet",
        label: t("ctxJoinMeet"),
        icon: Video,
        onSelect: () => void window.open(meet, "_blank", "noopener,noreferrer"),
      },
      {
        id: "copy-meet",
        label: t("ctxCopyMeet"),
        icon: LinkIcon,
        hint: meet.replace(/^https?:\/\//, "").slice(0, 28),
        onSelect: () => api.copy(meet),
      },
    )
  share.push({
    id: "copy-details",
    label: t("ctxCopyDetails"),
    icon: ClipboardCopy,
    onSelect: () =>
      api.copy(eventDetailsText(event, t("copyNoLocation"), api.dateLocale)),
  })

  const danger: CtxItem[] = []
  if (kind === "office-holiday")
    danger.push({
      id: "office-off",
      label: t("ctxHolidayUnset"),
      icon: CalendarX,
      access: ["stakeholder"],
      destructive: true,
      confirm: true,
      onSelect: () => api.setOfficeHoliday(event, false),
    })
  else if (editable)
    danger.push({
      id: "delete",
      label: t("ctxDelete"),
      icon: Trash2,
      destructive: true,
      confirm: true,
      onSelect: () => api.remove(event),
    })

  return [{ items: main }, { items: share }, { items: danger }].filter(
    (section) => section.items.length > 0,
  )
}

/**
 * Gives an event's element (a button that passes data-* props) its
 * right-click menu. Outside EventCalendar it renders the child as is.
 */
export function EventTarget({
  event,
  children,
}: {
  event: CalendarEvent
  children: ReactElement<Record<string, unknown>>
}) {
  const api = useCalendarMenu()
  const t = useT("calendar")
  if (!api) return children
  return (
    <ContextTarget
      type="calendar-event"
      id={event.id}
      label={event.title}
      href={event.href}
      items={() => eventSections(event, api, t)}
    >
      {children}
    </ContextTarget>
  )
}

/** A slot's data attributes: its time; `day` = the whole day, no hour. */
export function slotProps(
  date: Date,
  kind: "time" | "day" | "all-day" = "time",
) {
  return { "data-cal-slot": date.toISOString(), "data-cal-kind": kind }
}

/** New events from a day (no hour picked) start at nine. */
const DAY_START_HOUR = 9

/**
 * Right-click on empty calendar space under `ref`: the nearest element
 * marked with slotProps() says which day / hour.
 */
export function useCalendarSurface(ref: RefObject<HTMLElement | null>) {
  const api = useCalendarMenu()
  const t = useT("calendar")
  useContextTarget(ref, (ctx) => {
    if (!api) return null
    // An event (or another target) under the pointer has its own menu.
    const inner = ctx.target.closest("[data-ctx]")
    if (inner && inner !== ctx.el && ctx.el.contains(inner)) return null
    const slot = ctx.target.closest<HTMLElement>("[data-cal-slot]")
    if (!slot || !ctx.el.contains(slot)) return null
    const date = new Date(slot.dataset.calSlot!)
    const kind = slot.dataset.calKind ?? "time"
    const timed = kind === "time"
    const label = format(
      date,
      timed ? "EEEE, d MMM · HH:mm" : "EEEE, d MMMM yyyy",
      { locale: api.dateLocale },
    )
    const at = new Date(date)
    if (kind === "day") at.setHours(DAY_START_HOUR, 0, 0, 0)

    const items: CtxItem[] = [
      {
        id: "new-here",
        label: t(kind === "all-day" ? "ctxNewAllDay" : "ctxNewHere"),
        icon: CalendarPlus,
        hidden: !api.canAdd,
        onSelect: () => api.newAt(at, kind === "all-day"),
      },
      {
        id: "view-week",
        label: t("ctxViewWeek"),
        icon: CalendarRange,
        hidden: api.viewMode === "week" || !api.views.includes("week"),
        onSelect: () => api.show("week", date),
      },
      {
        id: "view-month",
        label: t("ctxViewMonth"),
        icon: CalendarDays,
        hidden: api.viewMode === "month" || !api.views.includes("month"),
        onSelect: () => api.show("month", date),
      },
    ]
    return [
      { label, items: items.filter((item) => !item.hidden) },
      { items: navigationItems(api, t) },
    ]
  })
}

/** Today and "go to a date" (the surface and the toolbar share them). */
function navigationItems(
  api: Pick<CalendarMenuApi, "goToToday" | "pickDate">,
  t: CalendarT,
): CtxItem[] {
  return [
    {
      id: "today",
      label: t("ctxToday"),
      icon: CalendarCheck,
      shortcut: "T",
      onSelect: api.goToToday,
    },
    {
      id: "go-to",
      label: t("ctxGoToDate"),
      icon: CalendarSearch,
      onSelect: api.pickDate,
    },
  ]
}

const VIEW_SHORTCUTS: Partial<Record<ViewMode, string>> = {
  week: "W",
  month: "M",
  day: "D",
  agenda: "A",
}

/**
 * The toolbar's menu: new event, today / previous / next, go to a date,
 * the view, and which calendars show. Render `dialog` once.
 */
export function useToolbarMenu(
  ref: RefObject<HTMLElement | null>,
  {
    views,
    viewLabel,
    onViewChange,
    onAddEvent,
    canAdd,
    categories,
    toggleCategory,
  }: {
    views: ViewMode[]
    viewLabel: (view: ViewMode) => string
    onViewChange: (view: ViewMode) => void
    onAddEvent: () => void
    canAdd: boolean
    categories: { id: string; name: string; isActive: boolean }[]
    toggleCategory: (id: string) => void
  },
): ReactNode {
  const t = useT("calendar")
  const {
    currentDate,
    setCurrentDate,
    viewMode,
    goToToday,
    goToPrevious,
    goToNext,
  } = useCalendarContext()
  const [pickOpen, setPickOpen] = useState(false)
  const [picked, setPicked] = useState(false)

  useContextTarget(
    ref,
    (ctx) => {
      // A control's own target (none today) would win; buttons are fine.
      const inner = ctx.target.closest("[data-ctx]")
      if (inner && inner !== ctx.el && ctx.el.contains(inner)) return null
      return [
        {
          items: [
            {
              id: "new",
              label: t("toolbarNewEvent"),
              icon: CalendarPlus,
              shortcut: "C",
              hidden: !canAdd,
              onSelect: onAddEvent,
            },
            ...navigationItems(
              {
                goToToday,
                pickDate: () => {
                  setPicked(true)
                  setPickOpen(true)
                },
              },
              t,
            ),
            {
              id: "previous",
              label: t("toolbarPrevious"),
              shortcut: "←",
              onSelect: goToPrevious,
            },
            {
              id: "next",
              label: t("toolbarNext"),
              shortcut: "→",
              onSelect: goToNext,
            },
          ].filter((item) => !item.hidden),
        },
        {
          items: [
            {
              id: "view",
              label: t("ctxView"),
              icon: CalendarRange,
              hint: viewLabel(viewMode),
              submenu: views.map((view) => ({
                id: view,
                label: viewLabel(view),
                role: "radio" as const,
                checked: view === viewMode,
                shortcut: VIEW_SHORTCUTS[view],
                onSelect: () => onViewChange(view),
              })),
            },
            {
              id: "shown",
              label: t("ctxShown"),
              icon: Eye,
              hidden: categories.length === 0,
              hint: `${categories.filter((c) => c.isActive).length}/${categories.length}`,
              submenu: categories.map((category) => ({
                id: category.id,
                label: category.name,
                role: "checkbox" as const,
                checked: category.isActive,
                keepOpen: true,
                onSelect: () => toggleCategory(category.id),
              })),
            },
          ].filter((item) => !item.hidden),
        },
      ]
    },
    { label: t("ctxCalendar") },
  )

  return picked ? (
    <PickDateDialog
      open={pickOpen}
      onOpenChange={setPickOpen}
      title={t("ctxPickTitle")}
      initial={currentDate}
      onPick={setCurrentDate}
    />
  ) : null
}

"use client"

import { AnimatePresence } from "motion/react"
import { EmptyValue } from "@/components/empty-value"
import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  listGroupHeaderClassName,
  listHeaderClassName,
  ListRow,
  ListRowActions,
} from "@/components/grouped-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AvatarGroup } from "@/components/avatar-group"
import { Badge } from "@/components/ui/badge"
import { Collapse } from "@/components/ui/collapse"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ATTENDANCE_NOTE_TAGS,
  attendanceStatusLabel,
  formatWorked,
  hasAttendanceNote,
  LONG_SESSION_MS,
  workedMs,
} from "@/shared/lib/attendance"
import { getAttendanceLogLocalDate } from "@/shared/lib/date"
import { Database } from "@/shared/types/database.types"
import { RiArrowDownSLine, RiCalendarLine } from "@/shared/ui/lucide-icons"
import { format, isToday, isYesterday, parseISO } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import type { Locale } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"
import * as React from "react"
import { ContextTarget } from "@/shared/context-menu"
import { useCopyWithToast } from "@/page-slices/leave/ui/components/leave-context-menu"
import { employeeHref } from "@/shared/lib/url-params"
import {
  Clock,
  Pencil,
  SearchCheck,
  SquareStop,
  UserRound,
} from "@/components/icons"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type AttendanceLogWithProfile =
  Database["public"]["Tables"]["attendance_logs"]["Row"] & {
    profiles: {
      full_name: string
      avatar_url: string | null
      job_title: string | null
    } | null
  }

const DAYS_PER_PAGE = 14
const OPEN_DAYS = 3

/** Shared column template so the header and every day's rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_6.5rem_7.5rem_4.5rem] lg:grid-cols-[minmax(0,1fr)_6.5rem_7.5rem_5.5rem_4.5rem_10rem]"

export function dayLabel(
  date: string,
  hydrated = true,
  locale: Locale = idLocale,
  words = { today: "Hari ini", yesterday: "Kemarin" },
) {
  const d = parseISO(date)
  const long = format(d, "EEEE, d MMMM yyyy", { locale })
  if (!hydrated) return long
  if (isToday(d))
    return `${words.today} · ${format(d, "EEEE, d MMM", { locale })}`
  if (isYesterday(d))
    return `${words.yesterday} · ${format(d, "EEEE, d MMM", { locale })}`
  return long
}

/** Kehadiran (admin): one group per day, one row per session. */
export function AdminAttendanceHistoryList({
  logs,
  onApproveDelete,
  onCloseSession,
  onEditSession,
}: {
  logs: AttendanceLogWithProfile[]
  onApproveDelete?: (id: string) => void
  onCloseSession?: (id: string) => void
  onEditSession?: (id: string) => void
}) {
  const t = useT("leave")
  const [visibleDays, setVisibleDays] = useState(DAYS_PER_PAGE)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  const groups = useMemo(() => {
    const byDate = new Map<string, AttendanceLogWithProfile[]>()
    for (const log of logs) {
      const key = getAttendanceLogLocalDate(log)
      byDate.set(key, [...(byDate.get(key) ?? []), log])
    }
    return [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [logs])

  if (logs.length === 0) {
    return (
      <EmptyState
        title={t("emptyAttendanceTitle")}
        description={t("emptyAttendanceTeamDesc")}
        icon={<RiCalendarLine className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <GroupedList>
        <div className={cn(ROW_GRID, listHeaderClassName)}>
          <span>{t("colEmployee")}</span>
          <span className="hidden md:block">{t("colStatus")}</span>
          <span className="hidden md:block">{t("colTime")}</span>
          <span className="hidden text-right lg:block">{t("colBreak")}</span>
          <span className="text-right">{t("colDuration")}</span>
          <span className="hidden lg:block" />
        </div>
        {groups.slice(0, visibleDays).map(([date, dayLogs], index) => (
          <AttendanceDay
            key={date}
            date={date}
            logs={dayLogs}
            hydrated={hydrated}
            defaultOpen={index < OPEN_DAYS}
          >
            <AnimatePresence initial={false}>
              {dayLogs.map((log) => (
                <AdminAttendanceRow
                  key={log.id}
                  log={log}
                  hydrated={hydrated}
                  onApproveDelete={onApproveDelete}
                  onCloseSession={onCloseSession}
                  onEditSession={onEditSession}
                />
              ))}
            </AnimatePresence>
          </AttendanceDay>
        ))}
      </GroupedList>

      {groups.length > visibleDays && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setVisibleDays((n) => n + DAYS_PER_PAGE)}
          >
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * One day of sessions. The header doubles as a summary (who came, how many
 * sessions, total hours) so a collapsed day still says something.
 */
function AttendanceDay({
  date,
  logs,
  hydrated,
  defaultOpen,
  children,
}: {
  date: string
  logs: AttendanceLogWithProfile[]
  hydrated: boolean
  defaultOpen: boolean
  children: React.ReactNode
}) {
  const t = useT("leave")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const [open, setOpen] = useState(defaultOpen)
  const d = useMemo(() => parseISO(date), [date])
  // Summary passes over the day's logs; recompute only when the logs change,
  // not on every expand/collapse.
  const { active, people, totalMs } = useMemo(
    () => ({
      active: logs.filter((l) => !l.clock_out).length,
      people: [...new Map(logs.map((l) => [l.user_id, l.profiles])).values()],
      totalMs: hydrated ? logs.reduce((sum, l) => sum + workedMs(l), 0) : 0,
    }),
    [logs, hydrated],
  )
  const relative = hydrated
    ? isToday(d)
      ? "today"
      : isYesterday(d)
        ? "yesterday"
        : null
    : null

  return (
    <section
      data-state={open ? "open" : "closed"}
      className="group/day mt-0.5 first:mt-0"
    >
      {/* Same columns as the rows: who came under Status/Jam, sessions under
          Istirahat, the day's total under Durasi. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(ROW_GRID, listGroupHeaderClassName)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <RiArrowDownSLine
            className={cn(
              "text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-out",
              !open && "-rotate-90",
            )}
          />
          <span className="text-foreground truncate" suppressHydrationWarning>
            {format(d, "EEEE, d MMMM", { locale: dateLocale })}
          </span>
          {relative && (
            <Badge variant={relative === "today" ? "info" : "secondary"}>
              {tc(relative)}
            </Badge>
          )}
        </span>
        <span className="col-span-2 hidden items-center gap-2 md:flex">
          <AvatarGroup>
            {people.slice(0, 6).map((p, i) => (
              <Avatar key={i} className="size-5">
                <AvatarImage src={p?.avatar_url || undefined} alt="" />
                <AvatarFallback className="text-[9px]">
                  {(p?.full_name || "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          {people.length > 6 && (
            <span className="text-tertiary-foreground text-meta tabular-nums">
              +{people.length - 6}
            </span>
          )}
        </span>
        <span className="text-muted-foreground text-meta hidden text-right tabular-nums lg:block">
          {t(logs.length === 1 ? "sessionsOne" : "sessionsOther", {
            n: logs.length,
          })}
        </span>
        <span
          className="text-foreground text-right tabular-nums"
          suppressHydrationWarning
        >
          {hydrated ? formatWorked(totalMs, t("hourShort")) : ""}
        </span>
        <span className="hidden justify-end lg:flex">
          {active > 0 && (
            <span className="text-success-ink text-meta flex items-center gap-1.5">
              <span className="bg-success size-1.5 animate-pulse rounded-full motion-reduce:animate-none" />
              {t("activeCount", { n: active })}
            </span>
          )}
        </span>
      </button>
      <Collapse open={open}>{children}</Collapse>
    </section>
  )
}

function AdminAttendanceRow({
  log,
  hydrated,
  onApproveDelete,
  onCloseSession,
  onEditSession,
}: {
  log: AttendanceLogWithProfile
  hydrated: boolean
  onApproveDelete?: (id: string) => void
  onCloseSession?: (id: string) => void
  onEditSession?: (id: string) => void
}) {
  const t = useT("leave")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const router = useRouter()
  const copy = useCopyWithToast()
  const name = log.profiles?.full_name || t("unknownName")
  const isActive = !log.clock_out
  const deleteRequested = hasAttendanceNote(
    log.notes,
    ATTENDANCE_NOTE_TAGS.deleteRequested,
  )
  const edited = hasAttendanceNote(
    log.notes,
    ATTENDANCE_NOTE_TAGS.adminEditedSession,
  )

  const status =
    log.is_break && isActive ? (
      <Badge variant="warning">{t("onBreak")}</Badge>
    ) : isActive ? (
      <Badge variant="success">{t("active")}</Badge>
    ) : log.status && log.status !== "Present" ? (
      <Badge variant="secondary">{attendanceStatusLabel(log.status, t)}</Badge>
    ) : (
      <Badge variant="secondary">{t("done")}</Badge>
    )
  const notes = [
    edited && t("noteEditedByAdmin"),
    hasAttendanceNote(log.notes, ATTENDANCE_NOTE_TAGS.autoClockOut) &&
      t("noteAutoClockOut"),
    deleteRequested && t("noteDeleteRequested"),
  ].filter(Boolean)

  const times = `${format(new Date(log.clock_in), "HH:mm")} – ${
    log.clock_out ? format(new Date(log.clock_out), "HH:mm") : "…"
  }`
  const day = format(parseISO(getAttendanceLogLocalDate(log)), "EEEE, d MMMM", {
    locale: dateLocale,
  })

  return (
    // Right-click: the row's buttons (same conditions), the person's
    // profile, and the session's times.
    <ContextTarget
      type="attendance-log"
      id={log.id}
      label={`${name} · ${times}`}
      items={() => [
        {
          id: "review-delete",
          label: t("reviewDelete"),
          icon: SearchCheck,
          hidden: !deleteRequested || !onApproveDelete,
          onSelect: () => onApproveDelete?.(log.id),
        },
        {
          id: "close-session",
          label: t("closeSession"),
          icon: SquareStop,
          // Its confirm dialog asks first.
          hidden: !isActive || !onCloseSession,
          onSelect: () => onCloseSession?.(log.id),
        },
        {
          id: "edit",
          label: tc("edit"),
          icon: Pencil,
          hidden: !onEditSession || isActive || deleteRequested,
          onSelect: () => onEditSession?.(log.id),
        },
        {
          id: "profile",
          label: t("ctxOpenProfile"),
          icon: UserRound,
          access: ["stakeholder"],
          onSelect: () =>
            router.push(employeeHref({ id: log.user_id, full_name: name })),
        },
        {
          id: "copy-times",
          label: t("ctxCopyTimes"),
          icon: Clock,
          hint: times,
          onSelect: () => copy(`${name}, ${day}, ${times}`),
        },
      ]}
    >
      <ListRow desc className={ROW_GRID}>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-7">
            <AvatarImage
              src={log.profiles?.avatar_url || undefined}
              alt={name}
            />
            <AvatarFallback className="text-micro">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="text-foreground truncate">{name}</span>
            {notes.length > 0 && (
              <span className="text-tertiary-foreground text-meta truncate">
                {notes.join(" · ")}
              </span>
            )}
          </div>
        </div>

        <div className="hidden md:block">{status}</div>
        <span className="hidden tabular-nums md:block">
          {format(new Date(log.clock_in), "HH:mm")}
          <span className="text-muted-foreground"> – </span>
          {log.clock_out ? format(new Date(log.clock_out), "HH:mm") : "…"}
        </span>
        <span className="text-muted-foreground hidden text-right tabular-nums lg:block">
          {log.break_total ? `${log.break_total}m` : <EmptyValue />}
        </span>
        <WorkedTime log={log} hydrated={hydrated} />

        {/* Actions wrap under the row on narrow screens. */}
        <div className="col-span-full flex justify-end gap-1 empty:hidden lg:col-span-1">
          {deleteRequested && onApproveDelete && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onApproveDelete(log.id)}
            >
              {t("reviewDelete")}
            </Button>
          )}
          {isActive && onCloseSession && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCloseSession(log.id)}
            >
              {t("closeSession")}
            </Button>
          )}
          {onEditSession && !isActive && !deleteRequested && (
            <ListRowActions className="hidden lg:flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditSession(log.id)}
              >
                {tc("edit")}
              </Button>
            </ListRowActions>
          )}
        </div>
      </ListRow>
    </ContextTarget>
  )
}

/** Over 12 hours almost always means a missed clock-out; flag it. */
function WorkedTime({
  log,
  hydrated,
}: {
  log: Parameters<typeof workedMs>[0]
  hydrated: boolean
}) {
  const t = useT("leave")
  const ms = hydrated ? workedMs(log) : 0
  const long = ms > LONG_SESSION_MS
  return (
    <span
      className={
        long
          ? "text-warning text-right tabular-nums"
          : "text-foreground text-right tabular-nums"
      }
      title={long ? t("longSessionHint") : undefined}
      suppressHydrationWarning
    >
      {hydrated ? formatWorked(ms, t("hourShort")) : ""}
    </span>
  )
}

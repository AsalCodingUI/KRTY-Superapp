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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapse } from "@/components/ui/collapse"
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
import { useDateLocale, useT } from "@/shared/i18n/client"
import * as React from "react"
import { ContextTarget } from "@/shared/context-menu"
import { useCopyWithToast } from "@/page-slices/leave/ui/components/leave-context-menu"
import { Clock, Trash2 } from "@/components/icons"
import { useEffect, useMemo, useState } from "react"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

const DAYS_PER_PAGE = 14
const OPEN_DAYS = 3

/** Shared column template so the header and every day's rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_6.5rem_5.5rem_4.5rem]"

/** Kehadiran (employee): one group per day, one row per session. */
export function AttendanceHistoryList({
  logs,
  onRequestDelete,
}: {
  logs: AttendanceLog[]
  onRequestDelete?: (id: string) => void
}) {
  const t = useT("leave")
  const [visibleDays, setVisibleDays] = useState(DAYS_PER_PAGE)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  const groups = useMemo(() => {
    const byDate = new Map<string, AttendanceLog[]>()
    for (const log of logs) {
      const key = getAttendanceLogLocalDate(log)
      byDate.set(key, [...(byDate.get(key) ?? []), log])
    }
    return [...byDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(
        ([date, items]) =>
          [
            date,
            items.sort((a, b) => b.clock_in.localeCompare(a.clock_in)),
          ] as const,
      )
  }, [logs])

  if (logs.length === 0) {
    return (
      <EmptyState
        title={t("emptyAttendanceTitle")}
        description={t("emptyAttendanceSelfDesc")}
        icon={<RiCalendarLine className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Rows sit inside AttendanceDay: counted here for the long-list mode. */}
      <GroupedList
        rowCount={groups
          .slice(0, visibleDays)
          .reduce((n, [, dayLogs]) => n + dayLogs.length, 0)}
      >
        <div className={cn(ROW_GRID, listHeaderClassName)}>
          <span>{t("colTime")}</span>
          <span className="hidden md:block">{t("colStatus")}</span>
          <span className="hidden md:block">{t("colBreak")}</span>
          <span className="text-right">{t("colDuration")}</span>
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
                <AttendanceRow
                  key={log.id}
                  log={log}
                  hydrated={hydrated}
                  onRequestDelete={onRequestDelete}
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
 * One day of sessions. The header doubles as a summary (sessions, breaks,
 * total hours) so a collapsed day still says something.
 */
function AttendanceDay({
  date,
  logs,
  hydrated,
  defaultOpen,
  children,
}: {
  date: string
  logs: readonly AttendanceLog[]
  hydrated: boolean
  defaultOpen: boolean
  children: React.ReactNode
}) {
  const t = useT("leave")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const [open, setOpen] = useState(defaultOpen)
  const d = parseISO(date)
  const active = logs.some((l) => !l.clock_out)
  const totalMs = hydrated ? logs.reduce((sum, l) => sum + workedMs(l), 0) : 0
  const totalBreak = logs.reduce((sum, l) => sum + (l.break_total ?? 0), 0)
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
      {/* Same columns as the rows: sessions under Status, the day's breaks
          under Istirahat, its total under Durasi. */}
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
          {active && (
            <span className="text-success-ink text-meta flex items-center gap-1.5">
              <span className="bg-success size-1.5 animate-pulse rounded-full motion-reduce:animate-none" />
              {t("active")}
            </span>
          )}
        </span>
        <span className="text-muted-foreground text-meta hidden tabular-nums md:block">
          {t(logs.length === 1 ? "sessionsOne" : "sessionsOther", {
            n: logs.length,
          })}
        </span>
        <span className="text-muted-foreground text-meta hidden tabular-nums md:block">
          {totalBreak ? `${totalBreak}m` : ""}
        </span>
        <span
          className="text-foreground text-right tabular-nums"
          suppressHydrationWarning
        >
          {hydrated ? formatWorked(totalMs, t("hourShort")) : ""}
        </span>
      </button>
      <Collapse open={open}>{children}</Collapse>
    </section>
  )
}

function AttendanceRow({
  log,
  hydrated,
  onRequestDelete,
}: {
  log: AttendanceLog
  hydrated: boolean
  onRequestDelete?: (id: string) => void
}) {
  const t = useT("leave")
  const dateLocale = useDateLocale()
  const isActive = !log.clock_out
  const copy = useCopyWithToast()
  const deleteRequested = hasAttendanceNote(
    log.notes,
    ATTENDANCE_NOTE_TAGS.deleteRequested,
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
    hasAttendanceNote(log.notes, ATTENDANCE_NOTE_TAGS.adminEditedSession) &&
      t("noteEditedByAdmin"),
    hasAttendanceNote(log.notes, ATTENDANCE_NOTE_TAGS.autoClockOut) &&
      t("noteAutoClockOut"),
    deleteRequested && t("notePendingDelete"),
  ].filter(Boolean)

  const canRequestDelete = Boolean(
    onRequestDelete && !isActive && !deleteRequested,
  )
  const requestDeleteButton = (
    <Button variant="ghost" size="sm" onClick={() => onRequestDelete?.(log.id)}>
      {t("requestDelete")}
    </Button>
  )

  const times = `${format(new Date(log.clock_in), "HH:mm")} – ${
    log.clock_out ? format(new Date(log.clock_out), "HH:mm") : "…"
  }`
  const day = format(parseISO(getAttendanceLogLocalDate(log)), "EEEE, d MMMM", {
    locale: dateLocale,
  })

  return (
    // Right-click: the row's "Minta hapus", and copy its times.
    <ContextTarget
      type="attendance-log"
      id={log.id}
      label={`${day} · ${times}`}
      items={() => [
        {
          id: "request-delete",
          label: t("requestDelete"),
          icon: Trash2,
          destructive: true,
          hidden: !canRequestDelete,
          // Its dialog asks first.
          onSelect: () => onRequestDelete?.(log.id),
        },
        {
          id: "copy-times",
          label: t("ctxCopyTimes"),
          icon: Clock,
          hint: times,
          onSelect: () => copy(`${day}, ${times}`),
        },
      ]}
    >
      <ListRow desc className={ROW_GRID}>
        {/* Indented to sit under the day label, past the chevron. */}
        <div className="flex min-w-0 flex-col pl-7">
          <span className="text-foreground truncate tabular-nums">
            {format(new Date(log.clock_in), "HH:mm")}
            <span className="text-muted-foreground"> – </span>
            {log.clock_out ? format(new Date(log.clock_out), "HH:mm") : "…"}
          </span>
          {notes.length > 0 && (
            <span className="text-tertiary-foreground text-meta truncate">
              {notes.join(" · ")}
            </span>
          )}
          {/* Narrow screens: a quiet link under the times rather than a
            button row under every session. */}
          {canRequestDelete && (
            <button
              type="button"
              onClick={() => onRequestDelete?.(log.id)}
              className="text-tertiary-foreground hover:text-foreground text-meta -my-1 self-start py-1 underline-offset-2 hover:underline lg:hidden"
            >
              {t("requestDelete")}
            </button>
          )}
        </div>

        <div className="hidden md:block">{status}</div>
        <span className="text-muted-foreground hidden tabular-nums md:block">
          {log.break_total ? `${log.break_total}m` : <EmptyValue />}
        </span>
        {/* On wide screens the action floats over the duration cell on
          hover (no empty column, so the table runs to the same edge as
          every other page); on narrow ones it's a link under the times. */}
        <span className="relative flex justify-end">
          <WorkedTime log={log} hydrated={hydrated} />
          {canRequestDelete && (
            <ListRowActions className="bg-popover shadow-raised absolute inset-y-0 right-0 my-auto hidden h-fit rounded-full lg:flex">
              {requestDeleteButton}
            </ListRowActions>
          )}
        </span>
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
          ? "text-warning-ink text-right tabular-nums"
          : "text-foreground text-right tabular-nums"
      }
      title={long ? t("longSessionHint") : undefined}
      suppressHydrationWarning
    >
      {hydrated ? formatWorked(ms, t("hourShort")) : ""}
    </span>
  )
}

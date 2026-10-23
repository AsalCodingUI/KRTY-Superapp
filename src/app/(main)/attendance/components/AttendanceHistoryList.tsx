"use client"

import { AnimatePresence } from "motion/react"
import { EmptyValue } from "@/components/empty-value"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow, ListRowActions } from "@/components/grouped-list"
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
import { useEffect, useMemo, useState } from "react"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

const DAYS_PER_PAGE = 14
const OPEN_DAYS = 3

/** Shared column template so the header and every day's rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_6.5rem_5.5rem_4.5rem] lg:grid-cols-[minmax(0,1fr)_6.5rem_5.5rem_4.5rem_10rem]"

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
      <GroupedList>
        <div
          className={cn(
            ROW_GRID,
            "gutter-x text-muted-foreground border-border h-9 border-b text-[13px]",
          )}
        >
          <span>{t("colTime")}</span>
          <span className="hidden md:block">{t("colStatus")}</span>
          <span className="hidden text-right md:block">{t("colBreak")}</span>
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
    <section data-state={open ? "open" : "closed"} className="group/day">
      {/* Same columns as the rows: sessions under Status, the day's breaks
          under Istirahat, its total under Durasi. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          ROW_GRID,
          "gutter-x focus-visible:ring-focus-ring h-12 w-full rounded-lg text-left text-sm transition-colors outline-none hover:bg-(--row-hover) focus-visible:ring-2",
        )}
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
        <span className="text-muted-foreground hidden text-[13px] tabular-nums md:block">
          {t(logs.length === 1 ? "sessionsOne" : "sessionsOther", {
            n: logs.length,
          })}
        </span>
        <span className="text-muted-foreground hidden text-right text-[13px] tabular-nums md:block">
          {totalBreak ? `${totalBreak}m` : ""}
        </span>
        <span
          className="text-foreground text-right tabular-nums"
          suppressHydrationWarning
        >
          {hydrated ? formatWorked(totalMs, t("hourShort")) : ""}
        </span>
        <span className="hidden justify-end lg:flex">
          {active && (
            <span className="text-success flex items-center gap-1.5 text-[13px]">
              <span className="bg-success size-1.5 animate-pulse rounded-full motion-reduce:animate-none" />
              {t("active")}
            </span>
          )}
        </span>
      </button>
      <Collapse open={open}>
        <div className="border-border border-t">{children}</div>
      </Collapse>
      <div className="border-border border-b group-data-[state=open]/day:border-transparent" />
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
  const isActive = !log.clock_out
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

  return (
    <ListRow className={cn(ROW_GRID, "min-h-14")}>
      {/* Indented to sit under the day label, past the chevron. */}
      <div className="flex min-w-0 flex-col pl-7">
        <span className="text-foreground truncate tabular-nums">
          {format(new Date(log.clock_in), "HH:mm")}
          <span className="text-muted-foreground"> – </span>
          {log.clock_out ? format(new Date(log.clock_out), "HH:mm") : "…"}
        </span>
        {notes.length > 0 && (
          <span className="text-tertiary-foreground truncate text-[13px]">
            {notes.join(" · ")}
          </span>
        )}
      </div>

      <div className="hidden md:block">{status}</div>
      <span className="text-muted-foreground hidden text-right tabular-nums md:block">
        {log.break_total ? `${log.break_total}m` : <EmptyValue />}
      </span>
      <WorkedTime log={log} hydrated={hydrated} />

      {/* Actions wrap under the row on narrow screens. */}
      <div className="col-span-full flex justify-end empty:hidden lg:col-span-1">
        {onRequestDelete && !isActive && !deleteRequested && (
          <ListRowActions className="max-lg:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRequestDelete(log.id)}
            >
              {t("requestDelete")}
            </Button>
          </ListRowActions>
        )}
      </div>
    </ListRow>
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

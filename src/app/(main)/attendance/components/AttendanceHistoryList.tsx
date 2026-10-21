"use client"

import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListChip,
  ListGroup,
  ListRow,
  ListRowActions,
} from "@/components/grouped-list"
import { Button } from "@/components/ui/button"
import {
  ATTENDANCE_NOTE_TAGS,
  ATTENDANCE_STATUS_LABELS,
  formatWorked,
  hasAttendanceNote,
  LONG_SESSION_MS,
  workedMs,
} from "@/shared/lib/attendance"
import { getAttendanceLogLocalDate } from "@/shared/lib/date"
import { Database } from "@/shared/types/database.types"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"
import {
  addDays,
  differenceInCalendarWeeks,
  format,
  parseISO,
  startOfWeek,
} from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useEffect, useMemo, useState } from "react"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

const WEEKS_PER_PAGE = 8

function weekLabel(weekStart: Date, hydrated: boolean) {
  const end = addDays(weekStart, 6)
  const range = `${format(weekStart, "d MMM", { locale: idLocale })} – ${format(end, "d MMM", { locale: idLocale })}`
  if (!hydrated) return range
  const diff = differenceInCalendarWeeks(new Date(), weekStart, {
    weekStartsOn: 1,
  })
  if (diff === 0) return `Minggu ini · ${range}`
  if (diff === 1) return `Minggu lalu · ${range}`
  return range
}

/** Kehadiran (employee): one group per week, one row per session. */
export function AttendanceHistoryList({
  logs,
  onRequestDelete,
}: {
  logs: AttendanceLog[]
  onRequestDelete?: (id: string) => void
}) {
  const [visibleWeeks, setVisibleWeeks] = useState(WEEKS_PER_PAGE)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  const weeks = useMemo(() => {
    const byWeek = new Map<string, AttendanceLog[]>()
    for (const log of logs) {
      const key = format(
        startOfWeek(parseISO(getAttendanceLogLocalDate(log)), {
          weekStartsOn: 1,
        }),
        "yyyy-MM-dd",
      )
      byWeek.set(key, [...(byWeek.get(key) ?? []), log])
    }
    return [...byWeek.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => ({
        start: parseISO(key),
        items: items.sort((a, b) => b.clock_in.localeCompare(a.clock_in)),
      }))
  }, [logs])

  if (logs.length === 0) {
    return (
      <EmptyState
        title="Belum ada data kehadiran"
        description="Data muncul setelah kamu clock in pertama kali."
        icon={<RiCalendarLine className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <GroupedList>
        {weeks.slice(0, visibleWeeks).map(({ start, items }, index) => {
          const total = hydrated
            ? items.reduce((ms, log) => ms + workedMs(log), 0)
            : 0
          return (
            <ListGroup
              key={start.toISOString()}
              defaultOpen={index < 2}
              label={
                <span suppressHydrationWarning>
                  {weekLabel(start, hydrated)}
                </span>
              }
              count={new Set(items.map(getAttendanceLogLocalDate)).size}
              action={
                <span
                  className="text-muted-foreground text-xs tabular-nums"
                  suppressHydrationWarning
                >
                  {hydrated ? formatWorked(total) : ""}
                </span>
              }
            >
              {items.map((log) => (
                <AttendanceRow
                  key={log.id}
                  log={log}
                  hydrated={hydrated}
                  onRequestDelete={onRequestDelete}
                />
              ))}
            </ListGroup>
          )
        })}
      </GroupedList>

      {weeks.length > visibleWeeks && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setVisibleWeeks((n) => n + WEEKS_PER_PAGE)}
          >
            Muat lebih banyak
          </Button>
        </div>
      )}
    </div>
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
  const isActive = !log.clock_out
  const deleteRequested = hasAttendanceNote(
    log.notes,
    ATTENDANCE_NOTE_TAGS.deleteRequested,
  )
  const day = parseISO(getAttendanceLogLocalDate(log))

  return (
    <ListRow>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="w-24 shrink-0 font-medium">
          {format(day, "EEEE", { locale: idLocale })}
        </span>
        <span className="text-muted-foreground shrink-0">
          {format(day, "d MMM", { locale: idLocale })}
        </span>
        {log.status !== "Present" && (
          <span className="text-muted-foreground/70 truncate">
            ·{" "}
            {(log.status && ATTENDANCE_STATUS_LABELS[log.status]) ?? log.status}
          </span>
        )}
        {hasAttendanceNote(log.notes, ATTENDANCE_NOTE_TAGS.autoClockOut) && (
          <span className="text-muted-foreground/70 shrink-0 text-xs">
            · clock out otomatis
          </span>
        )}
      </div>

      {onRequestDelete &&
        (deleteRequested ? (
          <span className="text-muted-foreground text-xs">
            Menunggu dihapus
          </span>
        ) : (
          !isActive && (
            <ListRowActions>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRequestDelete(log.id)}
              >
                Minta hapus
              </Button>
            </ListRowActions>
          )
        ))}

      {log.is_break && isActive ? (
        <ListChip className="text-warning">Istirahat</ListChip>
      ) : isActive ? (
        <ListChip className="text-success">Aktif</ListChip>
      ) : log.break_total ? (
        <ListChip>Istirahat {log.break_total}m</ListChip>
      ) : null}
      <span className="text-muted-foreground w-28 shrink-0 text-right text-xs tabular-nums">
        {format(new Date(log.clock_in), "HH:mm")} –{" "}
        {log.clock_out ? format(new Date(log.clock_out), "HH:mm") : "…"}
      </span>
      <WorkedTime log={log} hydrated={hydrated} />
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
  const ms = hydrated ? workedMs(log) : 0
  const long = ms > LONG_SESSION_MS
  return (
    <span
      className={
        long
          ? "text-warning w-16 shrink-0 text-right text-xs font-medium tabular-nums"
          : "w-16 shrink-0 text-right text-xs font-medium tabular-nums"
      }
      title={long ? "Lebih dari 12 jam, kemungkinan lupa clock out" : undefined}
      suppressHydrationWarning
    >
      {hydrated ? formatWorked(ms) : ""}
    </span>
  )
}

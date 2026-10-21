"use client"

import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListChip,
  ListGroup,
  ListRow,
  ListRowActions,
} from "@/components/grouped-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { format, isToday, isYesterday, parseISO } from "date-fns"
import { id as idLocale } from "date-fns/locale"
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

export function dayLabel(date: string, hydrated = true) {
  const d = parseISO(date)
  const long = format(d, "EEEE, d MMMM yyyy", { locale: idLocale })
  if (!hydrated) return long
  if (isToday(d))
    return `Hari ini · ${format(d, "EEEE, d MMM", { locale: idLocale })}`
  if (isYesterday(d))
    return `Kemarin · ${format(d, "EEEE, d MMM", { locale: idLocale })}`
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
        title="Belum ada data kehadiran"
        description="Data muncul setelah anggota tim clock in."
        icon={<RiCalendarLine className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <GroupedList>
        {groups.slice(0, visibleDays).map(([date, dayLogs], index) => {
          const active = dayLogs.filter((l) => !l.clock_out).length
          return (
            <ListGroup
              key={date}
              defaultOpen={index < OPEN_DAYS}
              label={
                <span suppressHydrationWarning>{dayLabel(date, hydrated)}</span>
              }
              count={dayLogs.length}
              action={
                active > 0 ? (
                  <span className="text-success text-xs">{active} aktif</span>
                ) : undefined
              }
            >
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
            </ListGroup>
          )
        })}
      </GroupedList>

      {groups.length > visibleDays && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setVisibleDays((n) => n + DAYS_PER_PAGE)}
          >
            Muat lebih banyak
          </Button>
        </div>
      )}
    </div>
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
  const name = log.profiles?.full_name || "Unknown"
  const isActive = !log.clock_out
  const deleteRequested = hasAttendanceNote(
    log.notes,
    ATTENDANCE_NOTE_TAGS.deleteRequested,
  )
  const edited = hasAttendanceNote(
    log.notes,
    ATTENDANCE_NOTE_TAGS.adminEditedSession,
  )

  return (
    <ListRow>
      <Avatar className="size-5">
        <AvatarImage src={log.profiles?.avatar_url || undefined} alt={name} />
        <AvatarFallback className="text-[10px]">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-medium">{name}</span>
        {log.status !== "Present" && (
          <span className="text-muted-foreground shrink-0">
            {(log.status && ATTENDANCE_STATUS_LABELS[log.status]) ?? log.status}
          </span>
        )}
        {edited && (
          <span className="text-muted-foreground/70 shrink-0 text-xs">
            · diedit admin
          </span>
        )}
        {hasAttendanceNote(log.notes, ATTENDANCE_NOTE_TAGS.autoClockOut) && (
          <span className="text-muted-foreground/70 shrink-0 text-xs">
            · clock out otomatis
          </span>
        )}
      </div>

      <ListRowActions>
        {onEditSession && !isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditSession(log.id)}
          >
            Edit
          </Button>
        )}
      </ListRowActions>
      {deleteRequested && onApproveDelete && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onApproveDelete(log.id)}
        >
          Tinjau hapus
        </Button>
      )}
      {isActive && onCloseSession && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCloseSession(log.id)}
        >
          Tutup sesi
        </Button>
      )}

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

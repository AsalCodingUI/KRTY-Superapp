"use client"

import { getAttendanceLogLocalDate } from "@/shared/lib/date"
import { Database } from "@/shared/types/database.types"
import { DataTable } from "@/components/data-table"
import { EmptyState } from "@/components/empty-state"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"
import { differenceInSeconds, format, isToday, parseISO } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useMemo, useState } from "react"
import { columns } from "./Columns"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

// Helper hitung durasi dalam detik
const getDurationSeconds = (log: AttendanceLog) => {
  if (!log.clock_out) return 0
  const start = new Date(log.clock_in)
  const end = new Date(log.clock_out)

  // break_total di database dalam menit, konversi ke detik
  const breakSeconds = (log.break_total || 0) * 60

  const totalSeconds = differenceInSeconds(end, start) - breakSeconds
  return totalSeconds < 0 ? 0 : totalSeconds
}

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  return `${hours}j ${mins}m ${secs}d`
}

/** Table view of the employee's Kehadiran; see AttendanceHistoryList. */
export function AttendanceHistoryTable({
  logs,
  onRequestDelete,
}: {
  logs: AttendanceLog[]
  onRequestDelete?: (id: string) => void
}) {
  const [visibleDays, setVisibleDays] = useState(14)

  // 1. Group logs by Date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, AttendanceLog[]> = {}

    logs.forEach((log) => {
      const dateKey = getAttendanceLogLocalDate(log)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(log)
    })

    // Sort tanggal descending (Terbaru di atas)
    return Object.entries(groups).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime(),
    )
  }, [logs])

  const visibleGroups = useMemo(
    () => groupedLogs.slice(0, visibleDays),
    [groupedLogs, visibleDays],
  )
  const defaultOpenDate = visibleGroups[0]?.[0]

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
    <div className="space-y-3">
      <Accordion
        multiple
        className="space-y-3"
        defaultValue={defaultOpenDate ? [defaultOpenDate] : []}
      >
        {visibleGroups.map(([date, dailyLogs]) => {
          // Hitung total jam kerja hari itu (dalam detik)
          const totalDailySeconds = dailyLogs.reduce(
            (acc, log) => acc + getDurationSeconds(log),
            0,
          )
          const isDayActive = dailyLogs.some((l) => !l.clock_out)
          const dateObj = parseISO(date)
          const isCurrentDay = isToday(dateObj)

          return (
            <AccordionItem key={date} value={date}>
              <AccordionTrigger>
                <div className="flex w-full items-center justify-between pr-4">
                  <div className="flex flex-col items-start sm:flex-row sm:items-center sm:gap-3">
                    <span className="text-foreground" suppressHydrationWarning>
                      {format(dateObj, "EEEE, d MMMM yyyy", {
                        locale: idLocale,
                      })}
                      {isCurrentDay && (
                        <span className="text-primary ml-2 text-xs">
                          (Hari ini)
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {dailyLogs.length} sesi
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isDayActive ? (
                      <Badge variant="success">Aktif</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm font-medium tabular-nums">
                        {formatDuration(totalDailySeconds)}
                      </span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="!border-0 !p-0">
                <div>
                  <DataTable
                    data={dailyLogs}
                    columns={columns(onRequestDelete)}
                    showExport={false}
                    showViewOptions={false}
                    enableSelection={false}
                    enableHover={false}
                    showPagination={false}
                    showFilterbar={false}
                    noBorder={true}
                    onCreate={undefined}
                    searchKey="status"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {groupedLogs.length > visibleDays && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisibleDays((prev) => prev + 14)}
          >
            Muat lebih banyak
          </Button>
        </div>
      )}
    </div>
  )
}

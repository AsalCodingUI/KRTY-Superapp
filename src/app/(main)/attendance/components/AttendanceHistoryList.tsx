"use client"

import { Database } from "@/shared/types/database.types"
import { differenceInSeconds, format, isToday } from "date-fns"
import { useMemo } from "react"
import { columns } from "./Columns"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui"
import { Badge } from "@/shared/ui"
import { DataTable, EmptyState } from "@/shared/ui"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"

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

  return `${hours}h ${mins}m ${secs}s`
}

export function AttendanceHistoryList({
  logs,
  onRequestDelete,
}: {
  logs: AttendanceLog[]
  onRequestDelete?: (id: string) => void
}) {
  // 1. Group logs by Date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, AttendanceLog[]> = {}

    logs.forEach((log) => {
      const dateKey = log.date // Format YYYY-MM-DD
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

  if (logs.length === 0) {
    return (
      <EmptyState
        title="No attendance records"
        description="Your attendance history will appear here once you start clocking in"
        icon={<RiCalendarLine className="size-5" />}
      />
    )
  }

  const defaultOpenDate = groupedLogs[0]?.[0]

  return (
    <Accordion
      type="multiple"
      className="space-y-3"
      defaultValue={defaultOpenDate ? [defaultOpenDate] : []}
    >
      {groupedLogs.map(([date, dailyLogs]) => {
        // Hitung total jam kerja hari itu (dalam detik)
        const totalDailySeconds = dailyLogs.reduce(
          (acc, log) => acc + getDurationSeconds(log),
          0,
        )
        const isDayActive = dailyLogs.some((l) => !l.clock_out)
        const dateObj = new Date(date)
        const isCurrentDay = isToday(dateObj)

        return (
          <AccordionItem key={date} value={date}>
            <AccordionTrigger>
              <div className="flex w-full items-center justify-between pr-4">
                <div className="flex flex-col items-start sm:flex-row sm:items-center sm:gap-3">
                  <span
                    className="text-foreground-primary font-semibold"
                    suppressHydrationWarning
                  >
                    {format(dateObj, "eeee, dd MMMM yyyy")}
                    {isCurrentDay && (
                      <span className="text-body-xs ml-2 text-foreground-brand-primary">
                        (Today)
                      </span>
                    )}
                  </span>
                  <span className="text-body-xs text-foreground-secondary">
                    {dailyLogs.length} Session{dailyLogs.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {isDayActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <span className="text-label-md text-foreground-secondary tabular-nums">
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
  )
}

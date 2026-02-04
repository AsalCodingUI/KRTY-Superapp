"use client"

import { Database } from "@/shared/types/database.types"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  DataTable,
  EmptyState,
} from "@/shared/ui"
import { differenceInSeconds, format, isToday } from "date-fns"
import { useMemo } from "react"
import { createAttendanceColumns } from "./AttendanceColumns"

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

interface AttendanceHistoryListProps {
  logs: AttendanceLog[]
  onRequestDelete?: (id: string) => void
}

export function AttendanceHistoryList({
  logs,
  onRequestDelete,
}: AttendanceHistoryListProps) {
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

  const columns = useMemo(
    () => createAttendanceColumns(onRequestDelete),
    [onRequestDelete],
  )

  if (logs.length === 0) {
    return (
      <EmptyState
        title="No attendance records"
        description="Your attendance history will appear here once you start clocking in"
        icon={null}
        variant="compact"
      />
    )
  }

  return (
    <Accordion type="multiple" className="space-y-3">
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
                    className="text-content dark:text-content font-semibold"
                    suppressHydrationWarning
                  >
                    {format(dateObj, "eeee, dd MMMM yyyy")}
                    {isCurrentDay && (
                      <span className="text-body-xs ml-2 text-blue-600 dark:text-blue-400">
                        (Today)
                      </span>
                    )}
                  </span>
                  <span className="text-body-xs text-content-subtle dark:text-content-subtle">
                    {dailyLogs.length} Session{dailyLogs.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {isDayActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <span className="text-label-md text-content-subtle dark:text-content-placeholder tabular-nums">
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
                  columns={columns}
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

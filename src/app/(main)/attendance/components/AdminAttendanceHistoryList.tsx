"use client"

import { Database } from "@/shared/types/database.types"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge, Button,
  DataTable, EmptyState,
} from "@/shared/ui"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"
import { format, isToday } from "date-fns"
import { useMemo, useState } from "react"
import { adminAttendanceColumns } from "./AdminColumns"

// Tipe data gabungan (Join)
type AttendanceLogWithProfile =
  Database["public"]["Tables"]["attendance_logs"]["Row"] & {
    profiles: {
      full_name: string
      avatar_url: string | null
      job_title: string | null
    } | null
  }

export function AdminAttendanceHistoryList({
  logs,
  onApproveDelete,
}: {
  logs: AttendanceLogWithProfile[]
  onApproveDelete?: (id: string) => void
}) {
  const [visibleDays, setVisibleDays] = useState(14)

  // 1. Group logs by Date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, AttendanceLogWithProfile[]> = {}

    logs.forEach((log) => {
      const dateKey = log.date // YYYY-MM-DD
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
        title="No attendance records"
        description="Records will appear after employees check in."
        icon={<RiCalendarLine className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        className="space-y-4"
        defaultValue={defaultOpenDate ? [defaultOpenDate] : []}
      >
        {visibleGroups.map(([date, dailyLogs]) => {
          const dateObj = new Date(date)
          const isCurrentDay = isToday(dateObj)

          // Hitung statistik harian sederhana
          const activeSessions = dailyLogs.filter((l) => !l.clock_out).length
          const totalPresent = dailyLogs.length

          return (
            <AccordionItem key={date} value={date}>
              <AccordionTrigger>
                <div className="flex w-full items-center justify-between pr-4">
                  <div className="flex flex-col items-start sm:flex-row sm:items-center sm:gap-3">
                    <span
                      className="text-label-md text-foreground-primary"
                      suppressHydrationWarning
                    >
                      {format(dateObj, "eeee, dd MMMM yyyy")}
                      {isCurrentDay && (
                        <span className="text-body-xs ml-2 text-foreground-brand-primary">
                          (Today)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-body-sm text-foreground-secondary flex items-center gap-2">
                      <span className="hidden sm:inline">Present:</span>
                      <span className="text-foreground-primary font-medium">
                        {totalPresent}
                      </span>
                    </div>
                    {activeSessions > 0 && (
                      <Badge variant="success">{activeSessions} Active</Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="!border-0 !p-0">
                <div>
                  {/* Menggunakan DataTable standar */}
                  <DataTable
                    data={dailyLogs}
                    columns={adminAttendanceColumns(onApproveDelete)}
                    showExport={false}
                    showViewOptions={false}
                    showPagination={false}
                    showFilterbar={false}
                    noBorder={true}
                    enableSelection={false}
                    searchKey="profiles.full_name"
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
            variant="secondary"
            size="sm"
            onClick={() => setVisibleDays((prev) => prev + 14)}
          >
            Load more
          </Button>
        </div>
      )}

    </div>
  )
}

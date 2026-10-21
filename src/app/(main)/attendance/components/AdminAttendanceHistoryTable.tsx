"use client"

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
import { format, isToday } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useEffect, useMemo, useState } from "react"
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

/** Table view of Kehadiran (admin); see AdminAttendanceHistoryList for the list. */
export function AdminAttendanceHistoryTable({
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
  const [visibleDays, setVisibleDays] = useState(14)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

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
        title="Belum ada data kehadiran"
        description="Data muncul setelah anggota tim clock in."
        icon={<RiCalendarLine className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <div className="space-y-3">
      <Accordion
        multiple
        defaultValue={defaultOpenDate ? [defaultOpenDate] : []}
      >
        {visibleGroups.map(([date, dailyLogs]) => {
          const dateObj = new Date(date)
          const isCurrentDay = hydrated && isToday(dateObj)
          const triggerId = `attendance-trigger-${date}`
          const contentId = `attendance-content-${date}`

          // Hitung statistik harian sederhana
          const activeSessions = dailyLogs.filter((l) => !l.clock_out).length
          const totalPresent = dailyLogs.length

          return (
            <AccordionItem key={date} value={date}>
              <AccordionTrigger id={triggerId} aria-controls={contentId}>
                <div className="flex w-full items-center justify-between pr-4">
                  <div className="flex flex-col items-start sm:flex-row sm:items-center sm:gap-3">
                    <span
                      className="text-foreground text-sm font-medium"
                      suppressHydrationWarning
                    >
                      {format(dateObj, "EEEE, d MMMM yyyy", {
                        locale: idLocale,
                      })}
                      {isCurrentDay && (
                        <span className="text-primary ml-2 text-xs">
                          (Hari ini)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <span className="hidden sm:inline">Hadir:</span>
                      <span className="text-foreground font-medium">
                        {totalPresent}
                      </span>
                    </div>
                    {activeSessions > 0 && (
                      <Badge variant="success">{activeSessions} aktif</Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent
                id={contentId}
                aria-labelledby={triggerId}
                className="!border-0 !p-0"
              >
                <div>
                  {/* Menggunakan DataTable standar */}
                  <DataTable
                    data={dailyLogs}
                    columns={adminAttendanceColumns(
                      onApproveDelete,
                      onCloseSession,
                      onEditSession,
                    )}
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

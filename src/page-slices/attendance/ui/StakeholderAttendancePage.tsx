"use client"

import { AdminAttendanceHistoryList } from "@/app/(main)/attendance/components/AdminAttendanceHistoryList"
import { Card } from "@/shared/ui"
import { createClient } from "@/shared/api/supabase/client"
import { Database } from "@/shared/types/database.types"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

// Join Profile
type AttendanceLogWithProfile = AttendanceLog & {
  profiles: {
    full_name: string
    avatar_url: string | null
    job_title: string | null
  } | null
}

interface StakeholderAttendancePageProps {
  logs: AttendanceLogWithProfile[]
  showHeader?: boolean
}

export function StakeholderAttendancePage({
  logs,
  showHeader = true,
}: StakeholderAttendancePageProps) {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const channel = supabase
      .channel("admin-attendance-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_logs" },
        () => router.refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router])

  // Hitung statistik Ringkas untuk Hari Ini
  const todayDateKey = new Date().toISOString().split("T")[0]
  const todaysLogs = logs.filter((l) => l.date === todayDateKey)

  const handleApproveDelete = async (logId: string) => {
    if (!confirm("Approve delete request for this attendance record?")) return

    const { error } = await supabase
      .from("attendance_logs")
      .delete()
      .eq("id", logId)

    if (error) {
      alert("Error deleting: " + error.message)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col">
      {showHeader && (
        <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
          <RiCalendarLine className="size-4 text-foreground-secondary" />
          <p className="text-label-md text-foreground-primary">
            Attendance Overview
          </p>
        </div>
      )}

      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
        <div className="space-y-6 p-5">
          {/* Summary Cards (Fokus Hari Ini) */}
          <div className="grid gap-md sm:grid-cols-2">
            <Card className="px-4 py-3">
              <dt className="text-label-sm text-foreground-secondary">
                Present Today
              </dt>
              <dd className="text-heading-md text-foreground-primary mt-2">
                {todaysLogs.length}
              </dd>
            </Card>
            <Card className="px-4 py-3">
              <dt className="text-label-sm text-foreground-secondary">
                Currently Active
              </dt>
              <dd className="text-heading-md text-foreground-primary mt-2">
                {todaysLogs.filter((l) => !l.clock_out).length}
              </dd>
            </Card>
          </div>

          {/* Accordion List */}
          <div className="space-y-4">
            <h3 className="text-heading-md text-foreground-primary">
              Attendance History
            </h3>
            <AdminAttendanceHistoryList
              logs={logs}
              onApproveDelete={handleApproveDelete}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

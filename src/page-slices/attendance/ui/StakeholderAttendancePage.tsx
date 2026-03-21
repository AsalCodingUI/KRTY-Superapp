"use client"

import { AdminAttendanceHistoryList } from "@/app/(main)/attendance/components/AdminAttendanceHistoryList"
import { createClient } from "@/shared/api/supabase/client"
import { Database } from "@/shared/types/database.types"
import { Card, ConfirmDialog } from "@/shared/ui"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

// Join Profile
type AttendanceLogWithProfile = AttendanceLog & {
  profiles: {
    full_name: string
    avatar_url: string | null
    job_title: string | null
  } | null
}

function getLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

type PendingConfirm = {
  title: string
  description: string
  confirmText: string
  onConfirm: () => Promise<void>
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
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      refreshTimerRef.current = setTimeout(() => {
        router.refresh()
      }, 300)
    }

    const channel = supabase
      .channel("admin-attendance-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance_logs" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "attendance_logs" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "attendance_logs" },
        scheduleRefresh,
      )
      .subscribe()

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [supabase, router])

  // Hitung statistik Ringkas untuk Hari Ini
  const todayDateKey = getLocalDateString()
  const todaysLogs = logs.filter((l) => l.date === todayDateKey)

  const handleApproveDelete = async (logId: string) => {
    setPendingConfirm({
      title: "Approve delete attendance",
      description: "This attendance record will be permanently deleted.",
      confirmText: "Delete",
      onConfirm: async () => {
        const { error } = await supabase
          .from("attendance_logs")
          .delete()
          .eq("id", logId)

        if (error) {
          toast.error(error.message || "Failed to delete attendance")
          return
        }
        toast.success("Attendance deleted")
        router.refresh()
      },
    })
  }

  const handleConfirm = async () => {
    if (!pendingConfirm) return
    setConfirmLoading(true)
    try {
      await pendingConfirm.onConfirm()
    } finally {
      setConfirmLoading(false)
      setPendingConfirm(null)
    }
  }

  return (
    <>
      <div className="flex flex-col">
        {showHeader && (
          <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
            <RiCalendarLine className="size-4 text-foreground-secondary" />
            <p className="text-label-md text-foreground-primary">
              Attendance Overview
            </p>
          </div>
        )}

        <div className="flex flex-col rounded-xxl bg-surface-neutral-primary">
          <div className="space-y-4 p-5">
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

      <ConfirmDialog
        open={Boolean(pendingConfirm)}
        onOpenChange={(open) => {
          if (!open) setPendingConfirm(null)
        }}
        onConfirm={handleConfirm}
        title={pendingConfirm?.title || "Confirm action"}
        description={pendingConfirm?.description || ""}
        confirmText={pendingConfirm?.confirmText || "Confirm"}
        variant="destructive"
        loading={confirmLoading}
      />
    </>
  )
}

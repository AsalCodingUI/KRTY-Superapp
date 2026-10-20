"use client"

import { AdminAttendanceEditDialog } from "@/app/(main)/attendance/components/AdminAttendanceEditDialog"
import { AdminAttendanceHistoryList } from "@/app/(main)/attendance/components/AdminAttendanceHistoryList"
import { createClient } from "@/shared/api/supabase/client"
import {
  ATTENDANCE_NOTE_TAGS,
  mergeAttendanceNote,
} from "@/shared/lib/attendance"
import { Database } from "@/shared/types/database.types"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Card } from "@/components/ui/card"
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
}: StakeholderAttendancePageProps) {
  const supabase = createClient()
  const router = useRouter()
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  )
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

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

  const handleCloseSession = async (logId: string) => {
    setPendingConfirm({
      title: "Tutup sesi attendance",
      description:
        "Sesi attendance yang masih aktif akan ditutup dengan waktu saat ini.",
      confirmText: "Tutup sesi",
      onConfirm: async () => {
        const now = new Date().toISOString()
        const currentLog = logs.find((log) => log.id === logId)
        const { error } = await supabase
          .from("attendance_logs")
          .update({
            clock_out: now,
            is_break: false,
            break_start: null,
            notes: mergeAttendanceNote(
              currentLog?.notes,
              ATTENDANCE_NOTE_TAGS.adminClosedSession,
            ),
          })
          .eq("id", logId)

        if (error) {
          toast.error(error.message || "Failed to close attendance session")
          return
        }
        toast.success("Attendance session closed")
        router.refresh()
      },
    })
  }

  const handleEditSession = (logId: string) => {
    setEditingLogId(logId)
  }

  const editingLog = logs.find((log) => log.id === editingLogId) ?? null

  const handleUpdateSession = async (payload: {
    date: string
    clockIn: string
    clockOut: string
    status: string
  }) => {
    if (!editingLog) return

    setEditLoading(true)
    try {
      const { error } = await supabase
        .from("attendance_logs")
        .update({
          date: payload.date,
          clock_in: payload.clockIn,
          clock_out: payload.clockOut,
          status: payload.status,
          is_break: false,
          break_start: null,
          notes: mergeAttendanceNote(
            editingLog.notes,
            ATTENDANCE_NOTE_TAGS.adminEditedSession,
          ),
        })
        .eq("id", editingLog.id)

      if (error) {
        toast.error(error.message || "Failed to update attendance")
        return
      }

      toast.success("Attendance updated")
      setEditingLogId(null)
      router.refresh()
    } finally {
      setEditLoading(false)
    }
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
        <div className="flex flex-col">
          <div className="space-y-4 p-5">
            {/* Summary Cards (Fokus Hari Ini) */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="gap-0 px-4 py-3">
                <dt className="text-muted-foreground text-sm font-medium">
                  Present Today
                </dt>
                <dd className="text-foreground mt-2 text-lg font-semibold">
                  {todaysLogs.length}
                </dd>
              </Card>
              <Card className="gap-0 px-4 py-3">
                <dt className="text-muted-foreground text-sm font-medium">
                  Currently Active
                </dt>
                <dd className="text-foreground mt-2 text-lg font-semibold">
                  {todaysLogs.filter((l) => !l.clock_out).length}
                </dd>
              </Card>
            </div>

            {/* Accordion List */}
            <div className="space-y-4">
              <h3 className="text-foreground text-lg font-semibold">
                Attendance History
              </h3>
              <AdminAttendanceHistoryList
                logs={logs}
                onApproveDelete={handleApproveDelete}
                onCloseSession={handleCloseSession}
                onEditSession={handleEditSession}
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
      <AdminAttendanceEditDialog
        log={editingLog}
        open={Boolean(editingLog)}
        loading={editLoading}
        onOpenChange={(open) => {
          if (!open) setEditingLogId(null)
        }}
        onSubmit={handleUpdateSession}
      />
    </>
  )
}

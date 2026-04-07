import {
  ATTENDANCE_NOTE_TAGS,
  mergeAttendanceNote,
} from "@/shared/lib/attendance"
import { Database } from "@/shared/types/database.types"
import { differenceInMinutes } from "date-fns"
import { useCallback, useState } from "react"
import { toast } from "sonner"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

interface UseClockActionsProps {
  logs: AttendanceLog[]
  onLogsUpdate: (logs: AttendanceLog[]) => void
}

export function useClockActions({
  logs,
  onLogsUpdate,
}: UseClockActionsProps) {
  const [loading, setLoading] = useState(false)

  const handleClockIn = useCallback(
    async (status: string) => {
      setLoading(true)

      try {
        const response = await fetch("/api/attendance/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clock_in", status }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error || "Clock in gagal")
        const data = payload.data as AttendanceLog

        // Optimistic update
        onLogsUpdate([data, ...logs])
        toast.success("Clock in berhasil")
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Clock in gagal"
        toast.error(message)
      } finally {
        setLoading(false)
      }
    },
    [logs, onLogsUpdate],
  )

  const handleClockOut = useCallback(
    async (logId: string) => {
      setLoading(true)
      const now = new Date().toISOString()

      const oldLogs = logs

      // Optimistic update
      onLogsUpdate(
        logs.map((log) =>
          log.id === logId ? { ...log, clock_out: now, is_break: false } : log,
        ),
      )

      try {
        const response = await fetch("/api/attendance/logs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clock_out", logId }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error || "Clock out gagal")
        toast.success("Clock out berhasil")
      } catch (error: unknown) {
        // Rollback on error
        onLogsUpdate(oldLogs)
        const message =
          error instanceof Error ? error.message : "Clock out gagal"
        toast.error(message)
      } finally {
        setLoading(false)
      }
    },
    [logs, onLogsUpdate],
  )

  const handleToggleBreak = useCallback(
    async (logId: string, isBreak: boolean) => {
      setLoading(true)
      const now = new Date()
      const currentLog = logs.find((l) => l.id === logId)
      if (!currentLog) {
        setLoading(false)
        return
      }

      const oldLogs = logs

      try {
        if (isBreak) {
          // Ending break - calculate duration
          const breakStart = currentLog.break_start
            ? new Date(currentLog.break_start)
            : now
          const duration = differenceInMinutes(now, breakStart)
          const newTotalBreak = (currentLog.break_total || 0) + duration

          // Optimistic update
          onLogsUpdate(
            logs.map((log) =>
              log.id === logId
                ? {
                    ...log,
                    is_break: false,
                    break_start: null,
                    break_total: newTotalBreak,
                  }
                : log,
            ),
          )

          const response = await fetch("/api/attendance/logs", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "toggle_break",
              logId,
              isBreak: true,
            }),
          })
          const payload = await response.json().catch(() => ({}))
          if (!response.ok) throw new Error(payload?.error || "Break gagal")
          toast.success("Break selesai")
        } else {
          // Starting break
          const breakStartTime = now.toISOString()

          // Optimistic update
          onLogsUpdate(
            logs.map((log) =>
              log.id === logId
                ? { ...log, is_break: true, break_start: breakStartTime }
                : log,
            ),
          )

          const response = await fetch("/api/attendance/logs", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "toggle_break",
              logId,
              isBreak: false,
            }),
          })
          const payload = await response.json().catch(() => ({}))
          if (!response.ok) throw new Error(payload?.error || "Break gagal")
          toast.success("Break dimulai")
        }
      } catch (error: unknown) {
        // Rollback on error
        onLogsUpdate(oldLogs)
        toast.error("Break gagal")
      } finally {
        setLoading(false)
      }
    },
    [logs, onLogsUpdate],
  )

  const handleResolvePreviousSession = useCallback(
    async (logId: string) => {
      setLoading(true)
      const now = new Date().toISOString()
      const oldLogs = logs

      onLogsUpdate(
        logs.map((log) =>
          log.id === logId
            ? {
                ...log,
                clock_out: now,
                is_break: false,
                break_start: null,
                notes: mergeAttendanceNote(
                  log.notes,
                  ATTENDANCE_NOTE_TAGS.staleSessionResolved,
                ),
              }
            : log,
        ),
      )

      try {
        const response = await fetch("/api/attendance/logs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "resolve_previous_session",
            logId,
          }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload?.error || "Gagal menutup sesi sebelumnya")
        }
        toast.success("Sesi sebelumnya berhasil ditutup")
      } catch (error: unknown) {
        onLogsUpdate(oldLogs)
        const message =
          error instanceof Error ? error.message : "Gagal menutup sesi sebelumnya"
        toast.error(message)
      } finally {
        setLoading(false)
      }
    },
    [logs, onLogsUpdate],
  )

  return {
    loading,
    handleClockIn,
    handleClockOut,
    handleToggleBreak,
    handleResolvePreviousSession,
  }
}

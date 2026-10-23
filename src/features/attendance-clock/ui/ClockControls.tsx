"use client"

import { RollingValue } from "@/components/rolling-value"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getAttendanceLogLocalDate,
  getAttendanceSessionState,
} from "@/shared/lib/date"
import type { Database } from "@/shared/types/database.types"
import {
  RiCupLine,
  RiLoginBoxLine,
  RiLogoutBoxLine,
} from "@/shared/ui/lucide-icons"
import { format, parseISO } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"
import { useState } from "react"
import { useClockActions } from "../model/useClockActions"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

/** Stored values stay as before; only the labels are Indonesian. */
export const CLOCK_STATUSES = [
  { value: "Present", label: "Hadir" },
  { value: "Lembur", label: "Lembur" },
  { value: "Cuti Masuk", label: "Cuti Masuk" },
] as const

interface ClockControlsProps {
  logs: AttendanceLog[]
  onLogsUpdate: (logs: AttendanceLog[]) => void
  /** Approved leave today: default the status to "Cuti Masuk". */
  isOnLeave?: boolean
  now?: Date | null
}

/**
 * The one clock-in/out control, used on the dashboard and on Leave &
 * Attendance so both offer the same status choice, break and confirmations.
 */
export function ClockControls({
  logs,
  onLogsUpdate,
  isOnLeave = false,
  now,
}: ClockControlsProps) {
  const [status, setStatus] = useState<string>(
    isOnLeave ? "Cuti Masuk" : "Present",
  )
  const [confirmClockOut, setConfirmClockOut] = useState(false)
  const {
    loading,
    handleClockIn,
    handleClockOut,
    handleToggleBreak,
    handleResolvePreviousSession,
  } = useClockActions({ logs, onLogsUpdate })

  // The control group crossfades when the state changes (clock in → working
  // → clock out); nothing animates on first render.
  const swap = (key: string, node: React.ReactNode) => (
    <AnimatePresence initial={false} mode="popLayout">
      <m.div
        key={key}
        className="flex"
        initial={{ opacity: 0, y: 4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      >
        {node}
      </m.div>
    </AnimatePresence>
  )

  // SSR placeholder keeps the tree stable until the clock is known.
  if (!now) return <div className="h-8" />

  const { staleSession, activeSession } = getAttendanceSessionState(logs, now)

  if (staleSession && !activeSession) {
    return swap(
      "stale",
      <div className="flex items-center gap-3">
        <p className="text-destructive text-sm">
          Sesi{" "}
          {format(parseISO(getAttendanceLogLocalDate(staleSession)), "d MMM", {
            locale: idLocale,
          })}{" "}
          belum ditutup
        </p>
        <Button
          variant="destructive"
          disabled={loading}
          onClick={() => handleResolvePreviousSession(staleSession.id)}
        >
          Tutup sesi sebelumnya
        </Button>
      </div>,
    )
  }

  if (!activeSession) {
    return swap(
      "idle",
      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={(v) => v && setStatus(v)}>
          <SelectTrigger className="w-32" aria-label="Status kehadiran">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLOCK_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => handleClockIn(status)} disabled={loading}>
          <RiLoginBoxLine data-icon="inline-start" />
          Clock In
        </Button>
      </div>,
    )
  }

  return swap(
    "working",
    <div className="flex items-center gap-2">
      {/* Auto clock-out is set (and its time shown) next to these controls. */}
      <Button
        variant="outline"
        disabled={loading}
        onClick={() =>
          handleToggleBreak(activeSession.id, activeSession.is_break || false)
        }
      >
        <RiCupLine data-icon="inline-start" />
        <RollingValue>
          {activeSession.is_break ? "Selesai istirahat" : "Istirahat"}
        </RollingValue>
      </Button>
      <Button
        variant="destructive"
        disabled={loading}
        onClick={() => setConfirmClockOut(true)}
      >
        <RiLogoutBoxLine data-icon="inline-start" />
        Clock Out
      </Button>

      <Dialog open={confirmClockOut} onOpenChange={setConfirmClockOut}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clock out sekarang?</DialogTitle>
            <DialogDescription>
              Sesi hari ini akan ditutup pada {format(new Date(), "HH:mm")}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Batal
            </DialogClose>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={async () => {
                await handleClockOut(activeSession.id)
                setConfirmClockOut(false)
              }}
            >
              Clock Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>,
  )
}

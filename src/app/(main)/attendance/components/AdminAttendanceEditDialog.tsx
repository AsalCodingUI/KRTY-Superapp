"use client"

import { Database } from "@/shared/types/database.types"
import { DatePicker } from "@/components/date-picker"
import { TimeSelect } from "@/components/time-select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { format } from "date-fns"
import { useEffect, useMemo, useState } from "react"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

type AttendanceEditPayload = {
  date: string
  clockIn: string
  clockOut: string
  status: string
}

interface AdminAttendanceEditDialogProps {
  log: AttendanceLog | null
  open: boolean
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: AttendanceEditPayload) => Promise<void>
}

function combineLocalDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)

  return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0)
}

export function AdminAttendanceEditDialog({
  log,
  open,
  loading = false,
  onOpenChange,
  onSubmit,
}: AdminAttendanceEditDialogProps) {
  const [date, setDate] = useState("")
  const [clockIn, setClockIn] = useState("")
  const [clockOut, setClockOut] = useState("")
  const [status, setStatus] = useState("Present")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!log || !open) return

    setDate(log.date)
    setClockIn(format(new Date(log.clock_in), "HH:mm"))
    setClockOut(
      log.clock_out ? format(new Date(log.clock_out), "HH:mm") : "",
    )
    setStatus(log.status || "Present")
    setError(null)
  }, [log, open])

  const parsedDate = useMemo(() => {
    if (!date) return undefined
    const [year, month, day] = date.split("-").map(Number)
    if (!year || !month || !day) return undefined
    return new Date(year, month - 1, day)
  }, [date])

  const handleSubmit = async () => {
    setError(null)

    if (!date || !clockIn || !clockOut) {
      setError("Tanggal, clock in, dan clock out wajib diisi.")
      return
    }

    const clockInDate = combineLocalDateTime(date, clockIn)
    const clockOutDate = combineLocalDateTime(date, clockOut)

    if (Number.isNaN(clockInDate.getTime()) || Number.isNaN(clockOutDate.getTime())) {
      setError("Format tanggal atau jam tidak valid.")
      return
    }

    if (clockOutDate <= clockInDate) {
      setError("Clock out harus lebih besar dari clock in.")
      return
    }

    await onSubmit({
      date,
      clockIn: clockInDate.toISOString(),
      clockOut: clockOutDate.toISOString(),
      status,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Attendance</DialogTitle>
        </DialogHeader>
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2 sm:col-span-3">
              <Label>Tanggal</Label>
              <DatePicker
                value={parsedDate}
                onChange={(value) =>
                  setDate(value ? format(value, "yyyy-MM-dd") : "")
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Clock In</Label>
              <TimeSelect value={clockIn} onValueChange={setClockIn} step={5} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Clock Out</Label>
              <TimeSelect value={clockOut} onValueChange={setClockOut} step={5} />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-3">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Available</SelectItem>
                  <SelectItem value="Lembur">Lembur</SelectItem>
                  <SelectItem value="Cuti Masuk">Cuti Masuk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && (
            <p className="text-body-sm text-destructive mt-4">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Batal
            </Button>
          </DialogClose>
          <Button size="sm" disabled={loading} onClick={handleSubmit}>
            {loading && <Spinner data-icon="inline-start" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

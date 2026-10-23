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
import { useT } from "@/shared/i18n/client"
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
  const t = useT("leave")
  const tc = useT("common")
  const [date, setDate] = useState("")
  const [clockIn, setClockIn] = useState("")
  const [clockOut, setClockOut] = useState("")
  const [status, setStatus] = useState("Present")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!log || !open) return

    setDate(log.date)
    setClockIn(format(new Date(log.clock_in), "HH:mm"))
    setClockOut(log.clock_out ? format(new Date(log.clock_out), "HH:mm") : "")
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
      setError(t("errEditRequired"))
      return
    }

    const clockInDate = combineLocalDateTime(date, clockIn)
    const clockOutDate = combineLocalDateTime(date, clockOut)

    if (
      Number.isNaN(clockInDate.getTime()) ||
      Number.isNaN(clockOutDate.getTime())
    ) {
      setError(t("errEditInvalid"))
      return
    }

    if (clockOutDate <= clockInDate) {
      setError(t("errEditOrder"))
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
      <DialogContent className="sm:max-w-[35rem]">
        <DialogHeader>
          <DialogTitle>{t("editAttendanceTitle")}</DialogTitle>
        </DialogHeader>
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2 sm:col-span-3">
              <Label>{t("colDate")}</Label>
              <DatePicker
                value={parsedDate}
                onChange={(value) =>
                  setDate(value ? format(value, "yyyy-MM-dd") : "")
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("clockIn")}</Label>
              <TimeSelect value={clockIn} onValueChange={setClockIn} step={5} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("clockOut")}</Label>
              <TimeSelect
                value={clockOut}
                onValueChange={setClockOut}
                step={5}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-3">
              <Label>{t("colStatus")}</Label>
              <Select
                value={status}
                onValueChange={(v) => v !== null && setStatus(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">{t("statusPresent")}</SelectItem>
                  <SelectItem value="Lembur">{t("statusOvertime")}</SelectItem>
                  <SelectItem value="Cuti Masuk">
                    {t("statusLeaveCheckIn")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-destructive mt-4 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {tc("cancel")}
          </DialogClose>
          <Button disabled={loading} onClick={handleSubmit}>
            {loading && <Spinner data-icon="inline-start" />}
            {t("saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

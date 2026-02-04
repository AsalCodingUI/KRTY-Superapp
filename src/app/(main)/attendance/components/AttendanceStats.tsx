"use client"

import { Database } from "@/shared/types/database.types"
import {
  Button,
  Card,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui"
import {
  RiAlarmWarningLine,
  RiArrowDownSLine,
  RiCloseLine,
  RiCupLine,
  RiLoginBoxLine,
  RiLogoutBoxLine,
} from "@remixicon/react"
import { format } from "date-fns"
import { useEffect, useState } from "react"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface AttendanceStatsProps {
  profile: Profile
  logs: AttendanceLog[]
  isOnLeave: boolean
  loading: boolean
  onClockIn: (status: string) => void
  onClockOut: (logId: string) => void
  onToggleBreak: (logId: string, isBreak: boolean) => void
}

export function AttendanceStats({
  logs,
  isOnLeave,
  loading,
  onClockIn,
  onClockOut,
  onToggleBreak,
}: AttendanceStatsProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<
    "CLOCK_IN" | "CLOCK_OUT" | null
  >(null)

  // State Status Manual
  const [selectedStatus, setSelectedStatus] = useState<string>(
    isOnLeave ? "Cuti Masuk" : "Present",
  )

  // Cari sesi aktif hari ini dari props logs
  const todayStr = new Date().toISOString().split("T")[0]
  const activeSession = logs.find(
    (l) => l.date === todayStr && l.clock_out === null,
  )

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Reset status default jika tidak ada sesi aktif
  useEffect(() => {
    if (!activeSession) {
      setSelectedStatus(isOnLeave ? "Cuti Masuk" : "Present")
    }
  }, [isOnLeave, activeSession])

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "--:--"
    return format(new Date(dateString), "HH:mm")
  }

  // Wrapper Handler untuk Dialog
  const handleConfirm = () => {
    if (confirmAction === "CLOCK_IN") {
      onClockIn(selectedStatus)
    } else if (confirmAction === "CLOCK_OUT" && activeSession) {
      onClockOut(activeSession.id)
    }
    setIsConfirmOpen(false)
  }

  // Helper Label Dropdown
  const getStatusLabel = (val: string) => {
    if (val === "Present") return "Available"
    return val
  }

  return (
    <>
      {/* BANNER CUTI */}
      {isOnLeave && (
        <div className="bg-warning/10 border-warning/20 mb-6 rounded-md border p-4">
          <div className="flex">
            <RiAlarmWarningLine
              className="text-warning h-5 w-5"
              aria-hidden="true"
            />
            <div className="ml-3">
              <h3 className="text-label-md text-warning">
                Anda sedang cuti hari ini
              </h3>
              <div className="text-body-sm text-warning/80 mt-1">
                <p>
                  Silakan pilih status <b>Cuti Masuk</b> jika ingin bekerja,
                  atau sesuaikan kebutuhan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* CARD 1: CLOCK ACTION */}
        <Card className="flex h-full flex-col justify-between">
          <div>
            <dt className="text-label-md text-content-subtle dark:text-content-subtle">
              Current Time
            </dt>
            <dd className="mt-2 flex items-baseline gap-2">
              <span className="text-display-xxs text-content dark:text-content tabular-nums">
                {currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"}
              </span>
              <span className="text-body-sm text-content-subtle dark:text-content-subtle">
                {currentTime ? format(currentTime, "EEEE, dd MMM") : ""}
              </span>
            </dd>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!activeSession ? (
              <>
                {/* DROPDOWN STATUS */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="secondary">
                      {getStatusLabel(selectedStatus)}
                      <RiArrowDownSLine className="text-content-subtle ml-2 size-4 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("Present")}
                    >
                      Available
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("Lembur")}
                    >
                      Lembur
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("Cuti Masuk")}
                    >
                      Cuti Masuk
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  size="sm"
                  onClick={() => {
                    setConfirmAction("CLOCK_IN")
                    setIsConfirmOpen(true)
                  }}
                  disabled={loading}
                >
                  <RiLoginBoxLine className="mr-2 size-4" /> Clock In
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setConfirmAction("CLOCK_OUT")
                    setIsConfirmOpen(true)
                  }}
                  disabled={loading}
                >
                  <RiLogoutBoxLine className="mr-2 size-4" /> Clock Out
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    onToggleBreak(
                      activeSession.id,
                      activeSession.is_break || false,
                    )
                  }
                  disabled={loading}
                >
                  <RiCupLine className="mr-2 size-4" />
                  {activeSession.is_break ? "End Break" : "Break"}
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* CARD 2: SESSION INFO */}
        <Card className="h-full">
          <h3 className="text-label-md text-content-subtle dark:text-content-subtle">
            Session Info
          </h3>
          <dl className="text-body-sm mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
            <div className="flex items-center justify-between py-2">
              <dt className="text-content-subtle dark:text-content-subtle">
                First Clock In
              </dt>
              <dd className="text-content dark:text-content font-medium">
                {activeSession ? formatTime(activeSession.clock_in) : "--:--"}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="text-content-subtle dark:text-content-subtle">
                Working Duration
              </dt>
              <dd className="text-content dark:text-content font-medium tabular-nums">
                {activeSession && currentTime
                  ? (() => {
                      const start = new Date(activeSession.clock_in).getTime()
                      const now = currentTime.getTime()
                      let workingMs = now - start

                      // Subtract accumulated break time
                      workingMs -= (activeSession.break_total || 0) * 60 * 1000

                      // If currently on break, subtract current break duration too
                      if (activeSession.is_break && activeSession.break_start) {
                        const breakStart = new Date(
                          activeSession.break_start,
                        ).getTime()
                        const currentBreakMs = now - breakStart
                        workingMs -= currentBreakMs
                      }

                      const hours = Math.floor(workingMs / (1000 * 60 * 60))
                      const mins = Math.floor(
                        (workingMs % (1000 * 60 * 60)) / (1000 * 60),
                      )
                      const secs = Math.floor((workingMs % (1000 * 60)) / 1000)
                      return `${hours}h ${mins}m ${secs}s`
                    })()
                  : "--:--:--"}
              </dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="text-content-subtle dark:text-content-subtle">
                Activity
              </dt>
              <dd className="text-content dark:text-content font-medium">
                {activeSession
                  ? activeSession.is_break
                    ? "On Break"
                    : "Working"
                  : "-"}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* DIALOG */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogClose asChild>
            <Button
              className="!text-content-placeholder hover:text-content-subtle dark:!text-content-subtle hover:dark:text-content-subtle absolute top-3 right-3 p-2"
              variant="ghost"
              aria-label="close"
            >
              <RiCloseLine className="size-5 shrink-0" />
            </Button>
          </DialogClose>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "CLOCK_IN"
                ? "Confirm Clock In"
                : "Confirm Clock Out"}
            </DialogTitle>
            <DialogDescription className="mt-2">
              {confirmAction === "CLOCK_IN"
                ? `Anda akan masuk dengan status: ${getStatusLabel(selectedStatus)}. Lanjutkan?`
                : "Apakah Anda yakin ingin mengakhiri sesi kerja ini?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="secondary" className="w-full sm:w-fit">
                Cancel
              </Button>
            </DialogClose>
            <Button
              isLoading={loading}
              onClick={handleConfirm}
              className="w-full sm:w-fit"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

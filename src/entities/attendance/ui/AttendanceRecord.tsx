"use client"

import { differenceInSeconds, format } from "date-fns"
import type { AttendanceLog } from "./types"
import { Badge, Card } from "@/shared/ui"

export interface AttendanceRecordProps {
  log: AttendanceLog
  className?: string
  showDate?: boolean
  showDuration?: boolean
}

export function AttendanceRecord({
  log,
  className,
  showDate = true,
  showDuration = true,
}: AttendanceRecordProps) {
  const formatTime = (dateString: string | null) => {
    if (!dateString) return "--:--"
    return format(new Date(dateString), "HH:mm")
  }

  const getDuration = () => {
    if (!log.clock_out) return null
    const start = new Date(log.clock_in)
    const end = new Date(log.clock_out)
    const breakSeconds = (log.break_total || 0) * 60
    const totalSeconds = differenceInSeconds(end, start) - breakSeconds
    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  const isActive = !log.clock_out

  return (
    <Card className={className}>
      <div className="space-y-3 p-4">
        {showDate && (
          <div className="flex items-center justify-between">
            <span className="text-label-md text-content">
              {format(new Date(log.date), "dd MMM yyyy")}
            </span>
            {isActive && <Badge variant="success">Active</Badge>}
          </div>
        )}

        <div className="text-body-sm grid grid-cols-2 gap-4">
          <div>
            <p className="text-content-subtle">Clock In</p>
            <p className="text-content font-medium tabular-nums">
              {formatTime(log.clock_in)}
            </p>
          </div>
          <div>
            <p className="text-content-subtle">Clock Out</p>
            <p className="text-content font-medium tabular-nums">
              {formatTime(log.clock_out)}
            </p>
          </div>
        </div>

        {showDuration && !isActive && (
          <div className="border-border border-t pt-2">
            <div className="text-body-sm flex items-center justify-between">
              <span className="text-content-subtle">Duration</span>
              <span className="text-content font-medium tabular-nums">
                {getDuration()}
              </span>
            </div>
          </div>
        )}

        {log.status && (
          <div className="border-border border-t pt-2">
            <div className="text-body-sm flex items-center justify-between">
              <span className="text-content-subtle">Status</span>
              <Badge variant={log.status === "Present" ? "default" : "warning"}>
                {log.status}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

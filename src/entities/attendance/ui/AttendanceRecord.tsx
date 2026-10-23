"use client"

import { differenceInSeconds, format } from "date-fns"
import type { AttendanceLog } from "./types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { attendanceStatusLabel } from "@/shared/lib/attendance"

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
  const t = useT("leave")
  const dateLocale = useDateLocale()
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
    return `${hours}${t("hourShort")} ${mins}m`
  }

  const isActive = !log.clock_out

  return (
    <Card className={cn("gap-0 p-4", className)}>
      <div className="space-y-3 p-4">
        {showDate && (
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">
              {format(new Date(log.date), "dd MMM yyyy", {
                locale: dateLocale,
              })}
            </span>
            {isActive && <Badge variant="success">{t("active")}</Badge>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t("clockIn")}</p>
            <p className="text-foreground font-medium tabular-nums">
              {formatTime(log.clock_in)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("clockOut")}</p>
            <p className="text-foreground font-medium tabular-nums">
              {formatTime(log.clock_out)}
            </p>
          </div>
        </div>

        {showDuration && !isActive && (
          <div className="border-border border-t pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("colDuration")}</span>
              <span className="text-foreground font-medium tabular-nums">
                {getDuration()}
              </span>
            </div>
          </div>
        )}

        {log.status && (
          <div className="border-border border-t pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("colStatus")}</span>
              <Badge
                variant={log.status === "Present" ? "secondary" : "warning"}
              >
                {attendanceStatusLabel(log.status, t)}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

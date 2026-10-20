"use client"

import { Card } from "@/components/ui/card"
import React from "react"

interface AdminAttendanceOverviewProps {
  totalToday: number
  onTime: number
  late: number
  onLeave: number
  absent: number
}

export function AdminAttendanceOverview({
  totalToday,
  onTime,
  late,
  onLeave,
  absent,
}: AdminAttendanceOverviewProps) {
  const total = totalToday + onLeave + absent
  const onTimePercentage = total > 0 ? Math.round((onTime / total) * 100) : 0
  const items = [
    { label: "On Time", value: onTime },
    { label: "Late", value: late },
    { label: "On Leave", value: onLeave },
    { label: "Absent", value: absent },
  ]

  return (
    <Card className="gap-3">
      <p className="text-foreground text-sm font-medium">
        Today&apos;s Attendance Overview
      </p>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-2 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <p className="text-muted-foreground text-sm">{item.label}</p>
            <p className="text-foreground mt-1 text-lg font-medium tabular-nums">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm">
              Overall Attendance Rate
            </p>
            <p className="text-foreground mt-1 text-lg font-medium tabular-nums">
              {onTimePercentage}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-sm">Present Today</p>
            <p className="text-foreground mt-1 text-lg font-medium tabular-nums">
              {totalToday} / {total}
            </p>
          </div>
        </div>

        <div className="flex h-2 gap-1 overflow-hidden rounded-full">
          {total > 0 && (
            <>
              <div
                className="bg-success w-[var(--width)]"
                style={
                  {
                    "--width": `${(onTime / total) * 100}%`,
                  } as React.CSSProperties
                }
              />
              <div
                className="bg-warning w-[var(--width)]"
                style={
                  {
                    "--width": `${(late / total) * 100}%`,
                  } as React.CSSProperties
                }
              />
              <div
                className="bg-info w-[var(--width)]"
                style={
                  {
                    "--width": `${(onLeave / total) * 100}%`,
                  } as React.CSSProperties
                }
              />
              <div
                className="bg-destructive w-[var(--width)]"
                style={
                  {
                    "--width": `${(absent / total) * 100}%`,
                  } as React.CSSProperties
                }
              />
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

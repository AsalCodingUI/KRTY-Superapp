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
    <Card className="gap-0 p-4">
      <p className="text-label-md text-muted-foreground mb-3">
        Today&apos;s Attendance Overview
      </p>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-background md:bg-sidebar h-full px-3 py-3"
          >
            <p className="text-label-sm text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 text-heading-md text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-label-md text-muted-foreground">
              Overall Attendance Rate
            </p>
            <p className="mt-1 text-heading-md text-foreground">
              {onTimePercentage}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-label-md text-muted-foreground">
              Present Today
            </p>
            <p className="mt-1 text-heading-md text-foreground">
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

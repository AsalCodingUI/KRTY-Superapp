"use client"

import { Card } from "@/shared/ui"
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
    <Card>
      <p className="text-label-md text-foreground-secondary mb-3">
        Today&apos;s Attendance Overview
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="border-neutral-primary bg-surface-neutral-primary rounded-lg border px-3 py-3"
          >
            <p className="text-label-sm text-foreground-secondary">
              {item.label}
            </p>
            <p className="mt-1 text-heading-md text-foreground-primary">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="border-neutral-primary mt-4 space-y-4 rounded-lg border px-4 py-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-label-md text-foreground-secondary">
              Overall Attendance Rate
            </p>
            <p className="mt-1 text-heading-md text-foreground-primary">
              {onTimePercentage}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-label-md text-foreground-secondary">
              Present Today
            </p>
            <p className="mt-1 text-heading-md text-foreground-primary">
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
                className="bg-danger w-[var(--width)]"
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

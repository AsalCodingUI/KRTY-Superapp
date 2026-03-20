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

  return (
    <Card>
      <h3 className="text-foreground-primary text-label-md mb-4">
        Today&apos;s Attendance Overview
      </h3>

      {/* Main Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border-neutral-primary rounded-lg border p-3 text-center">
          <div className="text-foreground-primary text-heading-md">
            {onTime}
          </div>
          <div className="text-foreground-secondary text-label-xs mt-1">
            On Time
          </div>
        </div>

        <div className="border-neutral-primary rounded-lg border p-3 text-center">
          <div className="text-foreground-primary text-heading-md">{late}</div>
          <div className="text-foreground-secondary text-label-xs mt-1">
            Late
          </div>
        </div>

        <div className="border-neutral-primary rounded-lg border p-3 text-center">
          <div className="text-foreground-primary text-heading-md">
            {onLeave}
          </div>
          <div className="text-foreground-secondary text-label-xs mt-1">
            On Leave
          </div>
        </div>

        <div className="border-neutral-primary rounded-lg border p-3 text-center">
          <div className="text-foreground-primary text-heading-md">
            {absent}
          </div>
          <div className="text-foreground-secondary text-label-xs mt-1">
            Absent
          </div>
      </div>
      </div>

      {/* Summary */}
      <div className="border-neutral-primary rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-foreground-secondary text-label-md">
              Overall Attendance Rate
            </div>
            <div className="text-foreground-primary text-display-xxs mt-1">
              {onTimePercentage}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-foreground-secondary text-label-md">
              Present Today
            </div>
            <div className="text-foreground-primary text-heading-md mt-1">
              {totalToday} / {total}
            </div>
          </div>
        </div>

        {/* Visual breakdown */}
        <div className="mt-4 flex h-2 gap-1 overflow-hidden rounded-full">
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

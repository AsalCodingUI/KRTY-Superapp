"use client"

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
    <div className="border-neutral-primary rounded-lg border px-4 py-3">
      <p className="text-label-sm text-foreground-secondary mb-3">
        Today&apos;s Attendance Overview
      </p>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border-neutral-primary bg-surface-neutral-primary rounded-lg border p-3 text-center">
          <div className="text-foreground-primary text-heading-sm">
            {onTime}
          </div>
          <div className="text-foreground-secondary text-body-xs mt-1">
            On Time
          </div>
        </div>

        <div className="border-neutral-primary bg-surface-neutral-primary rounded-lg border p-3 text-center">
          <div className="text-foreground-primary text-heading-sm">{late}</div>
          <div className="text-foreground-secondary text-body-xs mt-1">
            Late
          </div>
        </div>

        <div className="border-neutral-primary bg-surface-neutral-primary rounded-lg border p-3 text-center">
          <div className="text-foreground-primary text-heading-sm">
            {onLeave}
          </div>
          <div className="text-foreground-secondary text-body-xs mt-1">
            On Leave
          </div>
        </div>

        <div className="border-neutral-primary bg-surface-neutral-primary rounded-lg border p-3 text-center">
          <div className="text-foreground-primary text-heading-sm">
            {absent}
          </div>
          <div className="text-foreground-secondary text-body-xs mt-1">
            Absent
          </div>
        </div>
      </div>

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
            <div className="text-foreground-primary text-heading-sm mt-1">
              {totalToday} / {total}
            </div>
          </div>
        </div>

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
    </div>
  )
}

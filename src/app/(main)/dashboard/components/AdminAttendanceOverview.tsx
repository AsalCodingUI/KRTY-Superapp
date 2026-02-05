"use client"

import { Card } from "@/shared/ui"
import { RiCheckboxCircleLine, RiTimeLine, RiUserLine } from "@/shared/ui/lucide-icons"
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
      <h3 className="text-content text-heading-md mb-4">
        Today&apos;s Attendance Overview
      </h3>

      {/* Main Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-success/10 rounded-lg p-4 text-center">
          <RiCheckboxCircleLine className="text-success mx-auto mb-2 size-6" />
          <div className="text-content text-display-xxs">{onTime}</div>
          <div className="text-content-subtle text-label-xs mt-1">On Time</div>
        </div>

        <div className="bg-warning/10 rounded-lg p-4 text-center">
          <RiTimeLine className="text-warning mx-auto mb-2 size-6" />
          <div className="text-content text-display-xxs">{late}</div>
          <div className="text-content-subtle text-label-xs mt-1">Late</div>
        </div>

        <div className="bg-info/10 rounded-lg p-4 text-center">
          <RiUserLine className="text-info mx-auto mb-2 size-6" />
          <div className="text-content text-display-xxs">{onLeave}</div>
          <div className="text-content-subtle text-label-xs mt-1">On Leave</div>
        </div>

        <div className="bg-danger/10 rounded-lg p-4 text-center">
          <RiUserLine className="text-danger mx-auto mb-2 size-6" />
          <div className="text-content text-display-xxs">{absent}</div>
          <div className="text-content-subtle text-label-xs mt-1">Absent</div>
        </div>
      </div>

      {/* Summary */}
      <div className="border-border bg-surface-secondary rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-content-subtle text-label-md">
              Overall Attendance Rate
            </div>
            <div className="text-content text-display-xxs mt-1">
              {onTimePercentage}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-content-subtle text-label-md">
              Present Today
            </div>
            <div className="text-content text-heading-md mt-1">
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

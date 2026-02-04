"use client"

import { Card } from "@/shared/ui"
import { RiCheckboxCircleLine, RiTimeLine, RiUserLine } from "@remixicon/react"
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
      <h3 className="text-content mb-4 text-lg font-semibold">
        Today&apos;s Attendance Overview
      </h3>

      {/* Main Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-success/10 rounded-lg p-4 text-center">
          <RiCheckboxCircleLine className="text-success mx-auto mb-2 size-6" />
          <div className="text-content text-2xl font-semibold">{onTime}</div>
          <div className="text-content-subtle mt-1 text-xs">On Time</div>
        </div>

        <div className="bg-warning/10 rounded-lg p-4 text-center">
          <RiTimeLine className="text-warning mx-auto mb-2 size-6" />
          <div className="text-content text-2xl font-semibold">{late}</div>
          <div className="text-content-subtle mt-1 text-xs">Late</div>
        </div>

        <div className="bg-info/10 rounded-lg p-4 text-center">
          <RiUserLine className="text-info mx-auto mb-2 size-6" />
          <div className="text-content text-2xl font-semibold">{onLeave}</div>
          <div className="text-content-subtle mt-1 text-xs">On Leave</div>
        </div>

        <div className="bg-danger/10 rounded-lg p-4 text-center">
          <RiUserLine className="text-danger mx-auto mb-2 size-6" />
          <div className="text-content text-2xl font-semibold">{absent}</div>
          <div className="text-content-subtle mt-1 text-xs">Absent</div>
        </div>
      </div>

      {/* Summary */}
      <div className="border-border bg-surface-secondary rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-content-subtle text-sm">
              Overall Attendance Rate
            </div>
            <div className="text-content mt-1 text-2xl font-semibold">
              {onTimePercentage}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-content-subtle text-sm">Present Today</div>
            <div className="text-content mt-1 text-lg font-medium">
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

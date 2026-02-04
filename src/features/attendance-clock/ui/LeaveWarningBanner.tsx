"use client"

import { RiAlarmWarningLine } from "@remixicon/react"

interface LeaveWarningBannerProps {
  isOnLeave: boolean
}

export function LeaveWarningBanner({ isOnLeave }: LeaveWarningBannerProps) {
  if (!isOnLeave) return null

  return (
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
              Silakan pilih status <b>Cuti Masuk</b> jika ingin bekerja, atau
              sesuaikan kebutuhan.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

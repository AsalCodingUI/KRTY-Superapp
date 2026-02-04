"use client"

import { RiAlarmWarningLine } from "@remixicon/react"

interface LeaveWarningBannerProps {
    isOnLeave: boolean
}

export function LeaveWarningBanner({ isOnLeave }: LeaveWarningBannerProps) {
    if (!isOnLeave) return null

    return (
        <div className="mb-6 rounded-md bg-warning/10 p-4 border border-warning/20">
            <div className="flex">
                <RiAlarmWarningLine className="h-5 w-5 text-warning" aria-hidden="true" />
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-warning">
                        Anda sedang cuti hari ini
                    </h3>
                    <div className="mt-1 text-sm text-warning/80">
                        <p>Silakan pilih status <b>Cuti Masuk</b> jika ingin bekerja, atau sesuaikan kebutuhan.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

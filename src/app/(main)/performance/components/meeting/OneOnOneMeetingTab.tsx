"use client"

import { RiCalendarScheduleLine } from "@remixicon/react"
import { EmptyState } from "@/shared/ui";

export function OneOnOneMeetingTab() {
    return (
        <div className="py-8">
            <EmptyState
                icon={<RiCalendarScheduleLine className="size-12 text-content-placeholder" />}
                title="Jadwal 1:1 Belum Tersedia"
                description="Fitur penjadwalan 1:1 meeting akan segera hadir. Saat ini Anda dapat menjadwalkan melalui kalender tim."
            />
        </div>
    )
}

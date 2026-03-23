"use client"

import type { CalendarEvent } from "../types"
import { BaseReadOnlyDialog } from "./BaseReadOnlyDialog"

interface PerformanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
  onDelete?: (eventId: string) => Promise<void>
}

export function PerformanceDialog({
  open,
  onOpenChange,
  event,
  onDelete,
}: PerformanceDialogProps) {
  return (
    <BaseReadOnlyDialog
      open={open}
      onOpenChange={onOpenChange}
      event={event}
      title="301 Meeting"
      badges={[
        { label: "301 Meeting", color: "amber" },
        { label: "Ulasan Performa", color: "blue" },
      ]}
      showLocation={true}
      infoMessage="Ini adalah meeting 301 yang dijadwalkan dari sistem ulasan performa. Data ini tidak dapat diubah dari kalender."
      onDelete={onDelete}
    />
  )
}

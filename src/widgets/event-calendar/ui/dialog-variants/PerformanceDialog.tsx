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
        { label: "Performance Review", color: "blue" },
      ]}
      showLocation={true}
      infoMessage="This is a 301 meeting scheduled from the performance review system. It cannot be edited from the calendar."
      onDelete={onDelete}
    />
  )
}

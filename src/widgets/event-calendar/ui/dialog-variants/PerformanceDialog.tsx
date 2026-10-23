"use client"

import { useT } from "@/shared/i18n/client"
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
  const t = useT("calendar")
  return (
    <BaseReadOnlyDialog
      open={open}
      onOpenChange={onOpenChange}
      event={event}
      title={t("eventType301Meeting")}
      badges={[
        { label: t("eventType301Meeting"), color: "amber" },
        { label: t("performanceBadgeReview"), color: "blue" },
      ]}
      showLocation={true}
      infoMessage={t("performanceInfo")}
      onDelete={onDelete}
    />
  )
}

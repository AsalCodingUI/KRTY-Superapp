"use client"

import { EmptyState as BaseEmptyState } from "@/components/empty-state"
import { useT } from "@/shared/i18n/client"
import { RiCalendar2Line } from "@/shared/ui/lucide-icons"

interface EmptyStateProps {
  onCreateEvent?: () => void
  filtered?: boolean
}

export function EmptyState({
  onCreateEvent,
  filtered = false,
}: EmptyStateProps) {
  const t = useT("calendar")
  if (filtered) {
    return (
      <BaseEmptyState
        className="h-full"
        title={t("emptyFilteredTitle")}
        description={t("emptyFilteredDescription")}
        icon={<RiCalendar2Line className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <BaseEmptyState
      className="h-full"
      title={t("emptyTitle")}
      description={t("emptyDescription")}
      icon={<RiCalendar2Line className="size-5" />}
      placement="inner"
      action={
        onCreateEvent
          ? {
              label: t("emptyAction"),
              onClick: onCreateEvent,
            }
          : undefined
      }
    />
  )
}

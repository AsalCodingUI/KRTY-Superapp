"use client"

import { EmptyState as BaseEmptyState } from "@/shared/ui"
import { RiCalendar2Line } from "@/shared/ui/lucide-icons"

interface EmptyStateProps {
  onCreateEvent?: () => void
  filtered?: boolean
}

export function EmptyState({
  onCreateEvent,
  filtered = false,
}: EmptyStateProps) {
  if (filtered) {
    return (
      <BaseEmptyState
        className="h-full"
        title="No events match your filters"
        description="Try changing your filters."
        icon={<RiCalendar2Line className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <BaseEmptyState
      className="h-full"
      title="No events yet"
      description="Create your first event."
      icon={<RiCalendar2Line className="size-5" />}
      placement="inner"
      action={
        onCreateEvent
          ? {
            label: "Create your first event",
            onClick: onCreateEvent,
          }
          : undefined
      }
    />
  )
}

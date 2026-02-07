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
        description="Try adjusting your filters or view settings to see more events."
        icon={<RiCalendar2Line className="size-5" />}
        variant="compact"
      />
    )
  }

  return (
    <BaseEmptyState
      className="h-full"
      title="No events yet"
      description="Get started by creating your first event. You can add meetings, tasks, or important dates."
      icon={<RiCalendar2Line className="size-5" />}
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

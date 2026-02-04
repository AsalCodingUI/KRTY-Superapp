"use client"

import { Button } from "@/components/ui"
import { RiAddLine, RiCalendar2Line } from "@remixicon/react"

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
      <div className="flex h-full flex-col items-center justify-center py-12">
        <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <RiCalendar2Line className="text-content-muted h-8 w-8" />
        </div>
        <h3 className="text-heading-md text-content mb-2">
          No events match your filters
        </h3>
        <p className="text-label-md text-content-muted mb-6 max-w-sm text-center">
          Try adjusting your filters or view settings to see more events.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center py-12">
      <div className="bg-surface-brand/10 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
        <RiCalendar2Line className="text-primary h-10 w-10" />
      </div>
      <h3 className="text-heading-md text-content mb-2">No events yet</h3>
      <p className="text-label-md text-content-muted mb-6 max-w-sm text-center">
        Get started by creating your first event. You can add meetings, tasks,
        or important dates.
      </p>
      {onCreateEvent && (
        <Button onClick={onCreateEvent}>
          <RiAddLine className="mr-2 h-4 w-4" />
          Create your first event
        </Button>
      )}
    </div>
  )
}

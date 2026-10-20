"use client"

import { EmptyState as BaseEmptyState } from "@/components/empty-state"
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
        title="Tidak ada jadwal yang cocok dengan filter"
        description="Coba ubah filter Anda."
        icon={<RiCalendar2Line className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <BaseEmptyState
      className="h-full"
      title="Belum ada jadwal"
      description="Buat jadwal pertama Anda."
      icon={<RiCalendar2Line className="size-5" />}
      placement="inner"
      action={
        onCreateEvent
          ? {
            label: "Buat jadwal pertama",
            onClick: onCreateEvent,
          }
          : undefined
      }
    />
  )
}

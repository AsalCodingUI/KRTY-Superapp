"use client"

import { cx } from "@/shared/lib/utils"
import {
  RiCheckLine,
  RiCloseLine,
  RiTimeLine,
  RiUserAddLine,
} from "@/shared/ui/lucide-icons"
import type { Guest } from "../types"

interface GuestListProps {
  guests: Guest[]
  onAddGuest?: () => void
  showAddButton?: boolean
}

export function GuestList({
  guests,
  onAddGuest,
  showAddButton = false,
}: GuestListProps) {
  const acceptedCount = guests.filter((g) => g.status === "accepted").length
  const pendingCount = guests.filter((g) => g.status === "pending").length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-label-md text-content flex items-center gap-2">
          <span>{guests.length} guests</span>
          {guests.length > 0 && (
            <span className="text-body-xs text-content-muted">
              {acceptedCount} yes, {pendingCount} awaiting
            </span>
          )}
        </h4>
        {showAddButton && onAddGuest && (
          <button
            onClick={onAddGuest}
            className="text-body-xs text-primary hover:text-primary-hover flex items-center gap-1"
          >
            <RiUserAddLine className="h-3.5 w-3.5" />
            Add guest
          </button>
        )}
      </div>

      <div className="space-y-2">
        {guests.map((guest, index) => (
          <div
            key={guest.email + index}
            className="hover:bg-muted/30 flex items-center gap-3 rounded-lg p-2 transition-colors"
          >
            {/* Avatar */}
            <div
              className={cx(
                "text-label-xs flex h-8 w-8 items-center justify-center rounded-full",
                guest.isOrganizer
                  ? "bg-surface-brand text-primary-fg"
                  : "bg-muted text-content",
              )}
            >
              {guest.name?.[0]?.toUpperCase() || guest.email[0].toUpperCase()}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-label-md text-content truncate">
                  {guest.name || guest.email}
                </p>
                {guest.isOrganizer && (
                  <span className="text-body-xs text-content-muted">
                    Organizer
                  </span>
                )}
              </div>
              {guest.name && (
                <p className="text-body-xs text-content-muted truncate">
                  {guest.email}
                </p>
              )}
            </div>

            {/* Status */}
            <div
              className={cx(
                "text-body-xs flex items-center gap-1 rounded-full px-2 py-1",
                guest.status === "accepted" &&
                  "bg-success-subtle text-success-text",
                guest.status === "pending" &&
                  "bg-warning-subtle text-warning-text",
                guest.status === "declined" &&
                  "bg-danger-subtle text-danger-text",
              )}
            >
              {guest.status === "accepted" && (
                <RiCheckLine className="h-3 w-3" />
              )}
              {guest.status === "pending" && <RiTimeLine className="h-3 w-3" />}
              {guest.status === "declined" && (
                <RiCloseLine className="h-3 w-3" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

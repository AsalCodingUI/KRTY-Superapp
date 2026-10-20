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
        <h4 className="text-foreground flex items-center gap-2 text-sm font-medium">
          <span>{guests.length} tamu</span>
          {guests.length > 0 && (
            <span className="text-muted-foreground/70 text-xs">
              {acceptedCount} ya, {pendingCount} menunggu
            </span>
          )}
        </h4>
        {showAddButton && onAddGuest && (
          <button
            onClick={onAddGuest}
            className="text-primary hover:text-primary/90 flex items-center gap-1 text-xs"
          >
            <RiUserAddLine className="h-3.5 w-3.5" />
            Tambah tamu
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
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                guest.isOrganizer
                  ? "bg-primary text-primary-fg"
                  : "bg-muted text-foreground",
              )}
            >
              {guest.name?.[0]?.toUpperCase() || guest.email[0].toUpperCase()}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-foreground truncate text-sm font-medium">
                  {guest.name || guest.email}
                </p>
                {guest.isOrganizer && (
                  <span className="text-muted-foreground/70 text-xs">
                    Penyelenggara
                  </span>
                )}
              </div>
              {guest.name && (
                <p className="text-muted-foreground/70 truncate text-xs">
                  {guest.email}
                </p>
              )}
            </div>

            {/* Status */}
            <div
              className={cx(
                "flex items-center gap-1 rounded-full px-2 py-1 text-xs",
                guest.status === "accepted" && "bg-success/10 text-success",
                guest.status === "pending" && "bg-warning/10 text-warning",
                guest.status === "declined" &&
                  "bg-destructive/10 text-destructive",
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

"use client"

import { Badge } from "@/components/ui/badge"
import { useT } from "@/shared/i18n/client"
import { cx } from "@/shared/lib/utils"
import {
  RiCheckLine,
  RiCloseLine,
  RiTimeLine,
  RiUserAddLine,
} from "@/shared/ui/lucide-icons"
import type { Guest } from "../types"

const RSVP = {
  accepted: {
    variant: "success",
    icon: RiCheckLine,
    label: "rsvpStatusAccepted",
  },
  pending: { variant: "warning", icon: RiTimeLine, label: "rsvpStatusPending" },
  declined: {
    variant: "destructive",
    icon: RiCloseLine,
    label: "rsvpStatusDeclined",
  },
} as const

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
  const t = useT("calendar")
  const acceptedCount = guests.filter((g) => g.status === "accepted").length
  const pendingCount = guests.filter((g) => g.status === "pending").length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-foreground flex items-center gap-2 text-sm font-medium">
          <span>
            {t(guests.length === 1 ? "guestsCountOne" : "guestsCountOther", {
              count: guests.length,
            })}
          </span>
          {guests.length > 0 && (
            <span className="text-tertiary-foreground text-xs">
              {t("guestsSummary", {
                accepted: acceptedCount,
                pending: pendingCount,
              })}
            </span>
          )}
        </h4>
        {showAddButton && onAddGuest && (
          <button
            onClick={onAddGuest}
            className="text-primary hover:text-primary/90 flex items-center gap-1 text-xs"
          >
            <RiUserAddLine className="h-3.5 w-3.5" />
            {t("guestsAdd")}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {guests.map((guest, index) => (
          <div
            key={guest.email + index}
            className="hover:bg-accent flex items-center gap-3 rounded-lg p-2 transition-colors"
          >
            {/* Avatar */}
            <div
              className={cx(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                guest.isOrganizer
                  ? "bg-primary text-primary-foreground"
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
                  <span className="text-tertiary-foreground text-xs">
                    {t("guestsOrganizer")}
                  </span>
                )}
              </div>
              {guest.name && (
                <p className="text-tertiary-foreground truncate text-xs">
                  {guest.email}
                </p>
              )}
            </div>

            {/* Status */}
            <RsvpBadge status={guest.status} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** RSVP as an icon-only Badge; the label is there for screen readers. */
function RsvpBadge({ status }: { status: Guest["status"] }) {
  const t = useT("calendar")
  const { variant, icon: Icon, label } = RSVP[status]
  return (
    <Badge variant={variant}>
      <Icon />
      <span className="sr-only">{t(label)}</span>
    </Badge>
  )
}

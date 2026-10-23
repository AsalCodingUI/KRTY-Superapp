"use client"

import {
  RiCheckLine,
  RiCloseLine,
  RiQuestionLine,
} from "@/shared/ui/lucide-icons"
import { Badge } from "@/components/ui/badge"
import { useT } from "@/shared/i18n/client"

export type RSVPStatus = "yes" | "no" | "maybe" | "pending"

interface EventStatusProps {
  status: RSVPStatus
  showIcon?: boolean
  className?: string
}

/**
 * EventStatus - Displays RSVP status for calendar events
 *
 * Shows the user's response status to an event invitation with
 * appropriate color coding and optional icon.
 */
export function EventStatus({
  status,
  showIcon = true,
  className,
}: EventStatusProps) {
  const t = useT("calendar")
  const getStatusConfig = (status: RSVPStatus) => {
    switch (status) {
      case "yes":
        return {
          label: t("rsvpStatusAccepted"),
          variant: "success" as const,
          icon: <RiCheckLine className="size-3" />,
        }
      case "no":
        return {
          label: t("rsvpStatusDeclined"),
          variant: "destructive" as const,
          icon: <RiCloseLine className="size-3" />,
        }
      case "maybe":
        return {
          label: t("rsvpStatusMaybe"),
          variant: "warning" as const,
          icon: <RiQuestionLine className="size-3" />,
        }
      case "pending":
      default:
        return {
          label: t("rsvpStatusPending"),
          variant: "secondary" as const,
          icon: <RiQuestionLine className="size-3" />,
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge variant={config.variant} className={className}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  )
}

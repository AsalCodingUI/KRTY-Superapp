"use client"

import { RiCheckLine, RiCloseLine, RiQuestionLine } from "@remixicon/react"
import { Badge } from "@/shared/ui"

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
  const getStatusConfig = (status: RSVPStatus) => {
    switch (status) {
      case "yes":
        return {
          label: "Accepted",
          variant: "success" as const,
          icon: <RiCheckLine className="size-3" />,
        }
      case "no":
        return {
          label: "Declined",
          variant: "error" as const,
          icon: <RiCloseLine className="size-3" />,
        }
      case "maybe":
        return {
          label: "Maybe",
          variant: "warning" as const,
          icon: <RiQuestionLine className="size-3" />,
        }
      case "pending":
      default:
        return {
          label: "Pending",
          variant: "zinc" as const,
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

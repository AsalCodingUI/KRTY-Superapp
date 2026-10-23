"use client"

import { RiCheckLine, RiCloseLine, RiTimeLine } from "@/shared/ui/lucide-icons"
import { Badge } from "@/components/ui/badge"
import { useT } from "@/shared/i18n/client"

interface LeaveStatusProps {
  status: "pending" | "approved" | "rejected"
  showIcon?: boolean
  size?: "sm" | "md" | "lg"
}

export function LeaveStatus({
  status,
  showIcon = true,
  size = "md",
}: LeaveStatusProps) {
  const t = useT("leave")
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return {
          variant: "success" as const,
          icon: RiCheckLine,
          label: t("statusApproved"),
        }
      case "rejected":
        return {
          variant: "destructive" as const,
          icon: RiCloseLine,
          label: t("statusRejected"),
        }
      case "pending":
        return {
          variant: "warning" as const,
          icon: RiTimeLine,
          label: t("statusPending"),
        }
      default:
        return {
          variant: "secondary" as const,
          icon: RiTimeLine,
          label: status,
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  const iconSizeClass = {
    sm: "size-3",
    md: "size-4",
    lg: "size-5",
  }[size]

  return (
    <Badge variant={config.variant}>
      {showIcon && <Icon className={iconSizeClass} />}
      <span>{config.label}</span>
    </Badge>
  )
}

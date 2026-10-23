"use client"

import {
  RiCheckLine,
  RiCloseLine,
  RiCupLine,
  RiTimeLine,
} from "@/shared/ui/lucide-icons"
import { cx } from "@/shared/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { MessageKey } from "@/shared/i18n/messages"
import { useT } from "@/shared/i18n/client"

export type AttendanceStatusType =
  | "present"
  | "absent"
  | "late"
  | "on_break"
  | "clocked_out"
  | "active"

export interface AttendanceStatusProps {
  status: AttendanceStatusType
  className?: string
  showIcon?: boolean
  size?: "sm" | "md" | "lg"
}

const statusConfig: Record<
  AttendanceStatusType,
  {
    labelKey: MessageKey<"leave">
    variant: "success" | "destructive" | "warning" | "secondary"
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  present: {
    labelKey: "statusPresent",
    variant: "success",
    icon: RiCheckLine,
  },
  absent: {
    labelKey: "statusAbsent",
    variant: "destructive",
    icon: RiCloseLine,
  },
  late: {
    labelKey: "statusLate",
    variant: "warning",
    icon: RiTimeLine,
  },
  on_break: {
    labelKey: "onBreak",
    variant: "secondary",
    icon: RiCupLine,
  },
  clocked_out: {
    labelKey: "statusClockedOut",
    variant: "secondary",
    icon: RiCheckLine,
  },
  active: {
    labelKey: "active",
    variant: "success",
    icon: RiCheckLine,
  },
}

export function AttendanceStatus({
  status,
  className,
  showIcon = true,
  size = "md",
}: AttendanceStatusProps) {
  const t = useT("leave")
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={cx(className)}>
      {showIcon && (
        <Icon className={cx("shrink-0", size === "sm" ? "size-3" : "size-4")} />
      )}
      <span className={cx(size === "sm" && "text-xs")}>
        {t(config.labelKey)}
      </span>
    </Badge>
  )
}

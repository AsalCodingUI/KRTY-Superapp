"use client"

import {
  RiCheckLine,
  RiCloseLine,
  RiCupLine,
  RiTimeLine,
} from "@/shared/ui/lucide-icons"
import { cx } from "@/shared/lib/utils"
import { Badge } from "@/shared/ui"

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
    label: string
    variant: "success" | "error" | "warning" | "default" | "zinc"
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  present: {
    label: "Present",
    variant: "success",
    icon: RiCheckLine,
  },
  absent: {
    label: "Absent",
    variant: "error",
    icon: RiCloseLine,
  },
  late: {
    label: "Late",
    variant: "warning",
    icon: RiTimeLine,
  },
  on_break: {
    label: "On Break",
    variant: "zinc",
    icon: RiCupLine,
  },
  clocked_out: {
    label: "Clocked Out",
    variant: "default",
    icon: RiCheckLine,
  },
  active: {
    label: "Active",
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
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={cx(className)}>
      {showIcon && (
        <Icon className={cx("shrink-0", size === "sm" ? "size-3" : "size-4")} />
      )}
      <span className={cx(size === "sm" && "text-body-xs")}>
        {config.label}
      </span>
    </Badge>
  )
}

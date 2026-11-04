"use client"

import { Badge, type BadgeVariant } from "@/components/ui/badge"
import { useT } from "@/shared/i18n/client"
import { leaveStatusLabel } from "@/shared/lib/leave"

/** Leave request status → Badge variant: the one map (docs/ui/badge.md). */
export const LEAVE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  approved: "success",
  pending: "warning",
  rejected: "destructive",
}

/** A leave request's status, coloured by meaning. Unknown statuses read
 *  neutral and show as stored. */
export function LeaveStatusBadge({ status }: { status: string }) {
  const t = useT("leave")
  return (
    <Badge variant={LEAVE_STATUS_VARIANT[status] ?? "secondary"}>
      {leaveStatusLabel(status, t)}
    </Badge>
  )
}

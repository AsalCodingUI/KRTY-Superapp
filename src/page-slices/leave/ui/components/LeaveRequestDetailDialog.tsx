"use client"

import { LeaveStatusBadge } from "@/entities/leave/ui/LeaveStatus"
import { ProofLink } from "@/entities/leave/ui/ProofLink"
import { EmptyValue } from "@/components/empty-value"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { daysKey, leaveTypeLabel } from "@/shared/lib/leave"
import { format } from "date-fns"
import { useState } from "react"
import type * as React from "react"
import {
  formatLeaveRange,
  leaveDays,
  type LeaveRequestWithProfile,
} from "./AdminLeaveList"

/**
 * One request, every field (the table truncates the reason): opened from
 * a row's right-click "Lihat detail".
 */
export function LeaveRequestDetailDialog({
  request,
  onOpenChange,
}: {
  request: LeaveRequestWithProfile | null
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("leave")
  const dateLocale = useDateLocale()
  // Keep the last one on screen while the dialog closes.
  const [last, setLast] = useState(request)
  if (request && request !== last) setLast(request)
  const req = request ?? last
  const days = req ? leaveDays(req.start_date, req.end_date) : 0

  const rows: [string, React.ReactNode][] = req
    ? [
        [t("colEmployee"), req.profiles?.full_name || t("unknownName")],
        [t("colType"), leaveTypeLabel(req.leave_type, t)],
        [
          t("colDate"),
          formatLeaveRange(req.start_date, req.end_date, dateLocale),
        ],
        [t("colDuration"), t(daysKey(days), { n: days })],
        [t("colStatus"), <LeaveStatusBadge key="status" status={req.status} />],
        [
          t("colReason"),
          req.reason ? (
            <span className="whitespace-pre-wrap">{req.reason}</span>
          ) : (
            <EmptyValue />
          ),
        ],
        ...(req.review_note
          ? ([
              [
                t("ctxReviewerNote"),
                <span key="note" className="whitespace-pre-wrap">
                  {req.review_note}
                </span>,
              ],
            ] as [string, React.ReactNode][])
          : []),
        ...(req.proof_url
          ? ([
              [t("proof"), <ProofLink key="proof" value={req.proof_url} />],
            ] as [string, React.ReactNode][])
          : []),
        [
          t("submittedDate"),
          req.created_at ? (
            format(new Date(req.created_at), "d MMM yyyy, HH:mm", {
              locale: dateLocale,
            })
          ) : (
            <EmptyValue />
          ),
        ],
      ]
    : []

  return (
    <Dialog open={request !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("ctxDetailTitle")}</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-foreground min-w-0 break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}

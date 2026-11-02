"use client"

import { ContextTarget, copyText, type CtxItem } from "@/shared/context-menu"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { employeeHref } from "@/shared/lib/url-params"
import { daysKey, leaveTypeLabel } from "@/shared/lib/leave"
import {
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiFilePaperLine,
  RiInboxLine,
} from "@/shared/ui/lucide-icons"
import {
  CalendarDays,
  CalendarRange,
  Eye,
  Pencil,
  Undo2,
  UserRound,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type * as React from "react"
import { formatLeaveRange, leaveDays } from "./AdminLeaveList"

/**
 * Copies from a menu item and says so ("Disalin"); a failure rejects,
 * which the menu shows as an error toast.
 */
export function useCopyWithToast() {
  const tm = useT("ctxmenu")
  return async (text: string) => {
    if (!(await copyText(text))) throw new Error(tm("copyFailed"))
    toast.success(tm("copied"))
  }
}

/** The fields a leave request's menu reads (every list has these). */
export type LeaveMenuRequest = {
  id: number | string
  user_id?: string | null
  leave_type: string
  start_date: string
  end_date: string
  status?: "pending" | "approved" | "rejected" | string | null
  proof_url?: string | null
}

/** What the viewer may do from this row (absent = not offered). */
export type LeaveMenuActions = {
  onDetail?: () => void
  /** Approvers, pending requests only. */
  onApprove?: () => void
  onReject?: () => void
  /** Opens the approval inbox on this request. */
  onReviewInInbox?: () => void
  /** The owner: change dates (pending) / resubmit (rejected). */
  onEdit?: () => void
  /** The owner, pending only (its dialog asks first). */
  onCancel?: () => void
  onViewProof?: (proof: string) => void
  /** Its dialog asks first. */
  onDelete?: () => void
}

/**
 * Right-click on a leave request (shared/context-menu): detail, decide
 * (approvers), change / cancel (the owner), copy the dates, see it on the
 * calendar, its proof, the person's profile. Only what the row's own
 * buttons allow is offered; the handlers are the rows' own.
 */
export function LeaveRequestContextMenu({
  req,
  person,
  actions,
  calendar = "personal",
  children,
}: {
  req: LeaveMenuRequest
  /** The requester's name (team lists); the group label. */
  person?: string | null
  actions: LeaveMenuActions
  /** Which calendar shows it: your own, or the team's (PM / stakeholder). */
  calendar?: "personal" | "team"
  children: React.ReactElement<Record<string, unknown>>
}) {
  const t = useT("leave")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const router = useRouter()
  const copy = useCopyWithToast()
  const type = leaveTypeLabel(req.leave_type, t)
  const range = formatLeaveRange(req.start_date, req.end_date, dateLocale)
  const pending = req.status === "pending"

  return (
    <ContextTarget
      type="leave-request"
      id={String(req.id)}
      label={person ? `${person} · ${type}` : `${type} · ${range}`}
      items={(): CtxItem[] => {
        const days = leaveDays(req.start_date, req.end_date)
        return [
          {
            id: "detail",
            label: t("ctxViewDetail"),
            icon: Eye,
            hidden: !actions.onDetail,
            onSelect: () => actions.onDetail?.(),
          },
          {
            id: "approve",
            label: t("approve"),
            icon: RiCheckLine,
            hidden: !pending || !actions.onApprove,
            onSelect: () => actions.onApprove?.(),
          },
          {
            id: "reject",
            label: t("ctxRejectWithNote"),
            icon: RiCloseLine,
            hidden: !pending || !actions.onReject,
            onSelect: () => actions.onReject?.(),
          },
          {
            id: "inbox",
            label: t("ctxReviewInInbox"),
            icon: RiInboxLine,
            hidden: !pending || !actions.onReviewInInbox,
            onSelect: () => actions.onReviewInInbox?.(),
          },
          {
            id: "edit",
            label: req.status === "rejected" ? t("resubmit") : t("changeDates"),
            icon: Pencil,
            hidden: req.status === "approved" || !actions.onEdit,
            onSelect: () => actions.onEdit?.(),
          },
          {
            id: "cancel",
            label: t("ctxCancelRequest"),
            icon: Undo2,
            destructive: true,
            hidden: !pending || !actions.onCancel,
            // Its dialog asks first.
            onSelect: () => actions.onCancel?.(),
          },
          {
            id: "copy-range",
            label: t("ctxCopyRange"),
            icon: CalendarRange,
            hint: t(daysKey(days), { n: days }),
            onSelect: () => copy(range),
          },
          {
            id: "calendar",
            label: t("ctxViewInCalendar"),
            icon: CalendarDays,
            // Only approved leave is on the calendar.
            hidden: req.status !== "approved",
            onSelect: () =>
              router.push(
                calendar === "team"
                  ? "/calendar/month"
                  : "/calendar/personal/month",
              ),
          },
          {
            id: "proof",
            label: t("viewProof"),
            icon: RiFilePaperLine,
            hidden: !req.proof_url || !actions.onViewProof,
            onSelect: () => actions.onViewProof?.(req.proof_url!),
          },
          {
            id: "profile",
            label: t("ctxOpenProfile"),
            icon: UserRound,
            // The KPI page is stakeholders'; team lists only (`person`).
            access: ["stakeholder"],
            hidden: !req.user_id || !person,
            onSelect: () =>
              router.push(
                employeeHref({ id: req.user_id!, full_name: person }),
              ),
          },
          {
            id: "delete",
            label: tc("delete"),
            icon: RiDeleteBinLine,
            destructive: true,
            hidden: !actions.onDelete,
            // The confirm dialog asks first.
            onSelect: () => actions.onDelete?.(),
          },
        ]
      }}
    >
      {children}
    </ContextTarget>
  )
}

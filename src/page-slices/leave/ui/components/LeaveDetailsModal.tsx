"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/empty-state"
import { SectionTitle } from "@/components/section-title"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { daysKey, leaveStatusLabel, leaveTypeLabel } from "@/shared/lib/leave"
import type { Database } from "@/shared/types/database.types"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { useMemo, useState } from "react"
import { formatLeaveRange, leaveDays } from "./AdminLeaveList"
import { EmployeeLeaveList } from "./EmployeeLeaveList"

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

const PAGE_SIZE = 6

const STATUS_VARIANT = {
  approved: "success",
  rejected: "destructive",
  pending: "warning",
} as const

/**
 * The request that still matters: a pending one, else an approved one that
 * hasn't ended yet (ongoing or upcoming). Soonest start wins.
 */
function currentRequest(requests: LeaveRequest[], today: string) {
  const live = requests.filter(
    (r) =>
      r.status === "pending" ||
      (r.status === "approved" && r.end_date >= today),
  )
  live.sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1
    return a.start_date.localeCompare(b.start_date)
  })
  return live[0] ?? null
}

/** "Detail cuti": the current request's progress, then every request. */
export function LeaveDetailsModal({
  open,
  onOpenChange,
  requests,
  today,
  onEdit,
  onCancel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** All of the member's requests, newest first. */
  requests: LeaveRequest[]
  today: string
  onEdit: (item: LeaveRequest) => void
  onCancel: (item: LeaveRequest) => void
}) {
  const t = useT("leave")
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(requests.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = requests.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  )
  const current = useMemo(
    () => (today ? currentRequest(requests, today) : null),
    [requests, today],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* No footer: trim the bottom so the last row isn't floating. */}
      <DialogContent className="sm:max-w-2xl [&>[data-slot=dialog-body]+div]:pb-3">
        <DialogHeader>
          <DialogTitle>{t("leaveDetails")}</DialogTitle>
        </DialogHeader>
        {requests.length === 0 ? (
          <EmptyState
            title={t("emptyRequestsTitle")}
            description={t("emptyRequestsSelfDesc")}
            icon={<RiCalendarLine className="size-5" />}
            placement="inner"
          />
        ) : (
          <div className="flex flex-col">
            <SectionTitle>{t("currentRequest")}</SectionTitle>
            {current ? (
              <CurrentRequestCard
                req={current}
                today={today}
                onEdit={onEdit}
                onCancel={onCancel}
              />
            ) : (
              <EmptyState
                title={t("noCurrentRequest")}
                icon={<RiCalendarLine className="size-5" />}
                className="py-8"
              />
            )}

            <SectionTitle
              extra={requests.length > 0 ? requests.length : undefined}
            >
              {t("requestHistory")}
            </SectionTitle>
            <EmployeeLeaveList
              requests={pageRows}
              onEdit={onEdit}
              onCancel={onCancel}
              // ListPager counts pages from 1.
              page={safePage + 1}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

type StepState = "done" | "current" | "failed" | "todo"

function CurrentRequestCard({
  req,
  today,
  onEdit,
  onCancel,
}: {
  req: LeaveRequest
  today: string
  onEdit: (item: LeaveRequest) => void
  onCancel: (item: LeaveRequest) => void
}) {
  const t = useT("leave")
  const dateLocale = useDateLocale()
  const days = leaveDays(req.start_date, req.end_date)
  const ongoing =
    req.status === "approved" &&
    req.start_date <= today &&
    req.end_date >= today
  const fmt = (value: string) =>
    format(new Date(value), "d MMM yyyy", { locale: dateLocale })

  const steps: { label: string; hint?: string; state: StepState }[] = [
    {
      label: t("stepSubmitted"),
      hint: req.created_at ? fmt(req.created_at) : undefined,
      state: "done",
    },
    {
      label:
        req.status === "pending"
          ? t("stepWaiting")
          : leaveStatusLabel(req.status, t),
      hint:
        req.status !== "pending" && req.updated_at
          ? fmt(req.updated_at)
          : undefined,
      state:
        req.status === "pending"
          ? "current"
          : req.status === "rejected"
            ? "failed"
            : "done",
    },
    {
      label: ongoing ? t("stepOngoing") : t("stepStarts"),
      hint: fmt(req.start_date),
      state: ongoing ? "current" : "todo",
    },
  ]

  return (
    <div className="border-border flex flex-col gap-4 rounded-2xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-foreground tabular-nums">
            {formatLeaveRange(req.start_date, req.end_date, dateLocale)}
          </span>
          <span className="text-muted-foreground text-[13px]">
            {leaveTypeLabel(req.leave_type, t)} ·{" "}
            {t(daysKey(days), { n: days })}
            {req.reason ? ` · ${req.reason}` : ""}
          </span>
        </div>
        <Badge variant={STATUS_VARIANT[req.status]}>
          {leaveStatusLabel(req.status, t)}
        </Badge>
      </div>

      <ol className="grid grid-cols-3 gap-2">
        {steps.map((step) => (
          <li key={step.label} className="flex flex-col gap-1.5">
            <span
              aria-hidden
              className={cn(
                "h-1 rounded-full",
                step.state === "done" && "bg-success-ink",
                step.state === "current" && "bg-warning",
                step.state === "failed" && "bg-destructive",
                step.state === "todo" && "bg-muted",
              )}
            />
            <span
              className={cn(
                "text-[13px]",
                step.state === "todo"
                  ? "text-tertiary-foreground"
                  : "text-foreground",
              )}
            >
              {step.label}
            </span>
            {step.hint && (
              <span className="text-tertiary-foreground text-xs tabular-nums">
                {step.hint}
              </span>
            )}
          </li>
        ))}
      </ol>

      {req.review_note && (
        <p className="text-muted-foreground text-[13px]">
          {t("reviewNote", { note: req.review_note })}
        </p>
      )}

      {req.status === "pending" && (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onCancel(req)}>
            {t("cancelAction")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(req)}>
            {t("changeDates")}
          </Button>
        </div>
      )}
    </div>
  )
}

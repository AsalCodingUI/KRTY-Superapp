"use client"

import { ProofLink, useProofViewer } from "@/entities/leave/ui/ProofLink"
import { AnimatePresence } from "motion/react"
import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  listHeaderClassName,
  ListRow,
} from "@/components/grouped-list"
import { ListPager } from "@/components/list-pager"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { daysKey, leaveStatusLabel, leaveTypeLabel } from "@/shared/lib/leave"
import type { Database } from "@/shared/types/database.types"
import { RiCalendarLine, RiMoreFill } from "@/shared/ui/lucide-icons"
import { formatLeaveRange, leaveDays } from "./AdminLeaveList"
import { LeaveRequestContextMenu } from "./leave-context-menu"

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

const STATUS_VARIANT = {
  approved: "success",
  rejected: "destructive",
  pending: "warning",
} as const

/** Shared column template so the header and every row line up. */
const ROW_GRID =
  // The last column is one small "more" button, so Status sits at the edge.
  "grid grid-cols-[minmax(0,1fr)_6.5rem_2rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_7.5rem_5rem_6.5rem_2rem]"

/** The employee's own requests as one flat list; status is a column. */
export function EmployeeLeaveList({
  requests,
  onEdit,
  onCancel,
  page,
  pageCount,
  onPageChange,
}: {
  requests: LeaveRequest[]
  onEdit: (item: LeaveRequest) => void
  onCancel: (item: LeaveRequest) => void
  page: number
  pageCount: number
  onPageChange: (pageIndex: number) => void
}) {
  const t = useT("leave")
  const proof = useProofViewer()
  if (requests.length === 0) {
    return (
      <EmptyState
        title={t("emptyRequestsTitle")}
        description={t("emptyRequestsSelfDesc")}
        icon={<RiCalendarLine className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <GroupedList>
        <div className={cn(ROW_GRID, listHeaderClassName)}>
          <span>{t("colDate")}</span>
          <span className="hidden md:block">{t("colType")}</span>
          <span className="hidden md:block">{t("colDuration")}</span>
          <span>{t("colStatus")}</span>
          <span />
        </div>
        <AnimatePresence initial={false} key={page}>
          {requests.map((req) => (
            <LeaveRow
              key={req.id}
              req={req}
              onEdit={onEdit}
              onCancel={onCancel}
              onViewProof={proof.open}
            />
          ))}
        </AnimatePresence>
      </GroupedList>
      {proof.viewer}
      <ListPager
        page={page}
        pageCount={pageCount}
        onPageChange={onPageChange}
      />
    </div>
  )
}

function LeaveRow({
  req,
  onEdit,
  onCancel,
  onViewProof,
}: {
  req: LeaveRequest
  onEdit: (item: LeaveRequest) => void
  onCancel: (item: LeaveRequest) => void
  onViewProof: (proof: string) => void
}) {
  const t = useT("leave")
  const dateLocale = useDateLocale()
  const type = leaveTypeLabel(req.leave_type, t)
  const days = leaveDays(req.start_date, req.end_date)
  const daysText = t(daysKey(days), { n: days })

  return (
    // Right-click: the "…" menu's actions, plus copy / calendar / proof.
    <LeaveRequestContextMenu
      req={req}
      actions={{
        onEdit: () => onEdit(req),
        onCancel: () => onCancel(req),
        onViewProof,
      }}
    >
      <ListRow desc className={ROW_GRID}>
        <div className="flex min-w-0 flex-col">
          <span className="text-foreground truncate tabular-nums">
            {formatLeaveRange(req.start_date, req.end_date, dateLocale)}
          </span>
          {/* Type and duration have their own columns from md up. */}
          <span className="text-muted-foreground truncate text-[13px] md:hidden">
            {type} · {daysText}
          </span>
          {(req.reason || req.review_note || req.proof_url) && (
            <span className="text-tertiary-foreground flex min-w-0 items-center gap-1.5 text-[13px]">
              {req.reason && (
                // Keeps its words when a long reviewer note follows.
                <span
                  className="max-w-[60%] shrink-0 truncate"
                  title={req.reason}
                >
                  {req.reason}
                </span>
              )}
              {req.review_note && (
                <span className="truncate" title={req.review_note}>
                  {req.reason ? "· " : ""}
                  {t("reviewNote", { note: req.review_note })}
                </span>
              )}
              {req.proof_url && <ProofLink value={req.proof_url} />}
            </span>
          )}
        </div>

        <div className="hidden md:block">
          <Badge variant="secondary">{type}</Badge>
        </div>
        <span className="text-muted-foreground hidden tabular-nums md:block">
          {daysText}
        </span>
        <div>
          <Badge variant={STATUS_VARIANT[req.status]}>
            {leaveStatusLabel(req.status, t)}
          </Badge>
        </div>

        <div className="flex justify-end">
          {req.status !== "approved" && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("requestActions")}
                    className="text-muted-foreground"
                  />
                }
              >
                <RiMoreFill />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuItem onClick={() => onEdit(req)}>
                  {req.status === "rejected" ? t("resubmit") : t("changeDates")}
                </DropdownMenuItem>
                {req.status === "pending" && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onCancel(req)}
                  >
                    {t("cancelAction")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </ListRow>
    </LeaveRequestContextMenu>
  )
}

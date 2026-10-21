"use client"

import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListChip,
  ListGroup,
  ListRow,
  ListRowActions,
  listChipClassName,
} from "@/components/grouped-list"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS } from "@/shared/lib/leave"
import type { Database } from "@/shared/types/database.types"
import { RiCalendarLine, RiFilePaperLine } from "@/shared/ui/lucide-icons"
import { formatLeaveRange, leaveDays } from "./AdminLeaveList"
import { ListPager } from "@/components/list-pager"
import { LeaveStatusIcon } from "./StatusIcon"

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

const GROUPS = ["pending", "approved", "rejected"] as const

/** The employee's own requests, grouped by outcome. */
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
  if (requests.length === 0) {
    return (
      <EmptyState
        title="Belum ada pengajuan"
        description="Pengajuan cuti, sakit, dan WFH kamu akan muncul di sini."
        icon={<RiCalendarLine className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <GroupedList>
        {GROUPS.map((status) => {
          const items = requests.filter((r) => r.status === status)
          if (items.length === 0) return null
          return (
            <ListGroup
              key={status}
              icon={<LeaveStatusIcon status={status} />}
              label={LEAVE_STATUS_LABELS[status]}
              count={items.length}
            >
              {items.map((req) => (
                <ListRow key={req.id}>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="shrink-0 font-medium">
                      {LEAVE_TYPE_LABELS[req.leave_type] ?? req.leave_type}
                    </span>
                    {req.reason && (
                      <span
                        className="text-muted-foreground truncate"
                        title={req.reason}
                      >
                        {req.reason}
                      </span>
                    )}
                  </div>

                  {status !== "approved" && (
                    <ListRowActions>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(req)}
                      >
                        {status === "rejected" ? "Ajukan ulang" : "Ubah"}
                      </Button>
                      {status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onCancel(req)}
                        >
                          Batalkan
                        </Button>
                      )}
                    </ListRowActions>
                  )}
                  {req.review_note && (
                    <ListChip className="max-w-56" title={req.review_note}>
                      <span className="truncate">{req.review_note}</span>
                    </ListChip>
                  )}
                  {req.proof_url && (
                    <a
                      href={req.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(listChipClassName, "hover:text-foreground")}
                    >
                      <RiFilePaperLine className="size-3.5" />
                      Bukti
                    </a>
                  )}
                  <ListChip>
                    <RiCalendarLine className="size-3.5" />
                    {formatLeaveRange(req.start_date, req.end_date)}
                  </ListChip>
                  <span className="text-muted-foreground w-12 shrink-0 text-right text-xs tabular-nums">
                    {leaveDays(req.start_date, req.end_date)} hari
                  </span>
                </ListRow>
              ))}
            </ListGroup>
          )
        })}
      </GroupedList>
      <ListPager
        page={page}
        pageCount={pageCount}
        onPageChange={onPageChange}
      />
    </div>
  )
}

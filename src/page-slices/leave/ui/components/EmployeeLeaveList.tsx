"use client"

import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
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
import { LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS } from "@/shared/lib/leave"
import type { Database } from "@/shared/types/database.types"
import {
  RiCalendarLine,
  RiFilePaperLine,
  RiMoreFill,
} from "@/shared/ui/lucide-icons"
import { formatLeaveRange, leaveDays } from "./AdminLeaveList"

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
        <div
          className={cn(
            ROW_GRID,
            "gutter-x text-muted-foreground border-border h-9 border-b text-[13px]",
          )}
        >
          <span>Tanggal</span>
          <span className="hidden md:block">Jenis</span>
          <span className="hidden text-right md:block">Durasi</span>
          <span>Status</span>
          <span />
        </div>
        {requests.map((req) => (
          <LeaveRow
            key={req.id}
            req={req}
            onEdit={onEdit}
            onCancel={onCancel}
          />
        ))}
      </GroupedList>
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
}: {
  req: LeaveRequest
  onEdit: (item: LeaveRequest) => void
  onCancel: (item: LeaveRequest) => void
}) {
  const type = LEAVE_TYPE_LABELS[req.leave_type] ?? req.leave_type

  return (
    <ListRow className={cn(ROW_GRID, "min-h-14")}>
      <div className="flex min-w-0 flex-col">
        <span className="text-foreground truncate tabular-nums">
          {formatLeaveRange(req.start_date, req.end_date)}
          {/* Type and duration have their own columns from md up. */}
          <span className="text-muted-foreground md:hidden">
            {" "}
            · {type} · {leaveDays(req.start_date, req.end_date)} hari
          </span>
        </span>
        {(req.reason || req.review_note || req.proof_url) && (
          <span className="text-tertiary-foreground flex min-w-0 items-center gap-1.5 text-[13px]">
            {req.reason && (
              <span className="truncate" title={req.reason}>
                {req.reason}
              </span>
            )}
            {req.review_note && (
              <span className="truncate" title={req.review_note}>
                {req.reason ? "· " : ""}Catatan: {req.review_note}
              </span>
            )}
            {req.proof_url && (
              <a
                href={req.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 transition-colors"
              >
                <RiFilePaperLine className="size-3.5" />
                Bukti
              </a>
            )}
          </span>
        )}
      </div>

      <div className="hidden md:block">
        <Badge variant="secondary">{type}</Badge>
      </div>
      <span className="text-muted-foreground hidden text-right tabular-nums md:block">
        {leaveDays(req.start_date, req.end_date)} hari
      </span>
      <div>
        <Badge variant={STATUS_VARIANT[req.status]}>
          {LEAVE_STATUS_LABELS[req.status] ?? req.status}
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
                  aria-label="Aksi pengajuan"
                  className="text-muted-foreground"
                />
              }
            >
              <RiMoreFill />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem onClick={() => onEdit(req)}>
                {req.status === "rejected" ? "Ajukan ulang" : "Ubah tanggal"}
              </DropdownMenuItem>
              {req.status === "pending" && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onCancel(req)}
                >
                  Batalkan
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </ListRow>
  )
}

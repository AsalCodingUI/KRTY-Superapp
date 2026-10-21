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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { calculateBusinessDays } from "@/shared/lib/date"
import { LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS } from "@/shared/lib/leave"
import {
  RiCalendarLine,
  RiDeleteBinLine,
  RiFilePaperLine,
} from "@/shared/ui/lucide-icons"
import type { Database } from "@/shared/types/database.types"
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
} from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { ListPager } from "./ListPager"
import { LeaveStatusIcon } from "./StatusIcon"

export type LeaveRequestWithProfile =
  Database["public"]["Tables"]["leave_requests"]["Row"] & {
    profiles: { full_name: string; avatar_url: string | null } | null
  }

const GROUPS = ["pending", "approved", "rejected"] as const

export function formatLeaveRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  if (start === end) return format(s, "d MMM yyyy", { locale: idLocale })
  const sameYear = s.getFullYear() === e.getFullYear()
  return `${format(s, sameYear ? "d MMM" : "d MMM yyyy", { locale: idLocale })} – ${format(e, "d MMM yyyy", { locale: idLocale })}`
}

/** "baru saja", "12 mnt", "3 jam", "5 hari", then the date. */
function shortAgo(date: Date, now = new Date()) {
  const mins = differenceInMinutes(now, date)
  if (mins < 1) return "baru saja"
  if (mins < 60) return `${mins} mnt`
  const hours = differenceInHours(now, date)
  if (hours < 24) return `${hours} jam`
  const days = differenceInDays(now, date)
  if (days < 7) return `${days} hari`
  return format(date, "d MMM", { locale: idLocale })
}

export function leaveDays(start: string, end: string) {
  return Math.max(1, calculateBusinessDays(new Date(start), new Date(end)))
}

/**
 * Persetujuan: every pending request (oldest start first), then this page of
 * reviewed history grouped by outcome.
 */
export function AdminLeaveList({
  requests,
  canManage,
  onApprove,
  onReject,
  onApproveMany,
  onDelete,
  page,
  pageCount,
  onPageChange,
}: {
  requests: LeaveRequestWithProfile[]
  canManage: boolean
  onApprove: (id: number) => void
  onReject: (id: number) => void
  onApproveMany: (ids: number[]) => void
  onDelete: (id: number) => void
  page: number
  pageCount: number
  onPageChange: (pageIndex: number) => void
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        title="Belum ada pengajuan"
        description="Pengajuan cuti dari tim akan muncul di sini."
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
          const pendingIds = items.map((r) => r.id)
          return (
            <ListGroup
              key={status}
              icon={<LeaveStatusIcon status={status} />}
              label={LEAVE_STATUS_LABELS[status]}
              count={items.length}
              action={
                canManage && status === "pending" && items.length > 1 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onApproveMany(pendingIds)}
                  >
                    Setujui semua
                  </Button>
                ) : undefined
              }
            >
              {items.map((req) => (
                <LeaveRow
                  key={req.id}
                  req={req}
                  canManage={canManage}
                  onApprove={onApprove}
                  onReject={onReject}
                  onDelete={onDelete}
                />
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

function LeaveRow({
  req,
  canManage,
  onApprove,
  onReject,
  onDelete,
}: {
  req: LeaveRequestWithProfile
  canManage: boolean
  onApprove: (id: number) => void
  onReject: (id: number) => void
  onDelete: (id: number) => void
}) {
  const name = req.profiles?.full_name || "Unknown"
  const days = leaveDays(req.start_date, req.end_date)
  const submitted = req.created_at ? new Date(req.created_at) : null

  return (
    <ListRow>
      <Avatar className="size-5">
        <AvatarImage src={req.profiles?.avatar_url || undefined} alt={name} />
        <AvatarFallback className="text-[10px]">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="shrink-0 font-medium">{name}</span>
        <span className="text-muted-foreground shrink-0">
          {LEAVE_TYPE_LABELS[req.leave_type] ?? req.leave_type}
        </span>
        {req.reason && (
          <span
            className="text-muted-foreground/70 truncate"
            title={req.reason}
          >
            · {req.reason}
          </span>
        )}
      </div>

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
        {days} hari
      </span>
      {submitted && (
        <span
          className="text-muted-foreground/70 hidden w-16 shrink-0 text-right text-xs whitespace-nowrap lg:inline"
          title={`Diajukan ${format(submitted, "d MMM yyyy, HH:mm", { locale: idLocale })}`}
          suppressHydrationWarning
        >
          {shortAgo(submitted)}
        </span>
      )}

      {canManage &&
        (req.status === "pending" ? (
          <div className="flex w-36 shrink-0 items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => onReject(req.id)}
            >
              Tolak
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onApprove(req.id)}
            >
              Setujui
            </Button>
          </div>
        ) : (
          <ListRowActions className="w-36 justify-end">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Hapus pengajuan"
              title="Hapus"
              onClick={() => onDelete(req.id)}
            >
              <RiDeleteBinLine />
            </Button>
          </ListRowActions>
        ))}
    </ListRow>
  )
}

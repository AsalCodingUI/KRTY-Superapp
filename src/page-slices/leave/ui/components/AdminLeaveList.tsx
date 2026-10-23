"use client"

import { ProofLink } from "@/entities/leave/ui/ProofLink"
import { EmptyValue } from "@/components/empty-value"
import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListGroup,
  ListRow,
  ListRowActions,
} from "@/components/grouped-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { calculateBusinessDays } from "@/shared/lib/date"
import { useDateLocale, useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"
import { daysKey, leaveStatusLabel, leaveTypeLabel } from "@/shared/lib/leave"
import { RiCalendarLine, RiDeleteBinLine } from "@/shared/ui/lucide-icons"
import type { Database } from "@/shared/types/database.types"
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  type Locale,
} from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { ListPager } from "@/components/list-pager"
import { LeaveStatusIcon } from "./StatusIcon"

export type LeaveRequestWithProfile =
  Database["public"]["Tables"]["leave_requests"]["Row"] & {
    profiles: { full_name: string; avatar_url: string | null } | null
  }

const GROUPS = ["pending", "approved", "rejected"] as const

export function formatLeaveRange(
  start: string,
  end: string,
  locale: Locale = idLocale,
) {
  const s = new Date(start)
  const e = new Date(end)
  if (start === end) return format(s, "d MMM yyyy", { locale })
  const sameYear = s.getFullYear() === e.getFullYear()
  return `${format(s, sameYear ? "d MMM" : "d MMM yyyy", { locale })} – ${format(e, "d MMM yyyy", { locale })}`
}

/** "baru saja", "12 mnt", "3 jam", "5 hari", then the date. */
function shortAgo(
  date: Date,
  t: (key: MessageKey<"leave">, vars?: Record<string, number>) => string,
  locale: Locale,
  now = new Date(),
) {
  const mins = differenceInMinutes(now, date)
  if (mins < 1) return t("agoJustNow")
  if (mins < 60) return t("agoMinutes", { n: mins })
  const hours = differenceInHours(now, date)
  if (hours < 24) return t("agoHours", { n: hours })
  const days = differenceInDays(now, date)
  if (days < 7) return t("agoDays", { n: days })
  return format(date, "d MMM", { locale })
}

/** Shared column template so rows line up across every status group. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_7.5rem_10rem_5rem] lg:grid-cols-[minmax(0,1fr)_7.5rem_10rem_5rem_5rem_9rem]"

const LEAVE_TYPE_BADGE: Record<string, "info" | "warning" | "secondary"> = {
  "Annual Leave": "info",
  "Sick Leave": "warning",
  WFH: "secondary",
  "Work From Home": "secondary",
}

function LeaveListHeader() {
  const t = useT("leave")
  return (
    <div
      className={cn(
        ROW_GRID,
        "gutter-x text-muted-foreground border-border h-9 border-b text-[13px]",
      )}
    >
      <span>{t("colEmployee")}</span>
      <span>{t("colType")}</span>
      <span className="hidden md:block">{t("colDate")}</span>
      <span className="hidden text-right md:block">{t("colDuration")}</span>
      <span className="hidden text-right lg:block">{t("colSubmitted")}</span>
      <span className="hidden lg:block" />
    </div>
  )
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
  const t = useT("leave")
  if (requests.length === 0) {
    return (
      <EmptyState
        title={t("emptyRequestsTitle")}
        description={t("emptyRequestsTeamDesc")}
        icon={<RiCalendarLine className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <GroupedList>
        <LeaveListHeader />
        {GROUPS.map((status) => {
          const items = requests.filter((r) => r.status === status)
          if (items.length === 0) return null
          const pendingIds = items.map((r) => r.id)
          return (
            <ListGroup
              key={status}
              icon={<LeaveStatusIcon status={status} />}
              label={leaveStatusLabel(status, t)}
              count={items.length}
              action={
                canManage && status === "pending" && items.length > 1 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onApproveMany(pendingIds)}
                  >
                    {t("approveAll")}
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
  const t = useT("leave")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const name = req.profiles?.full_name || t("unknownName")
  const days = leaveDays(req.start_date, req.end_date)
  const submitted = req.created_at ? new Date(req.created_at) : null

  const type = leaveTypeLabel(req.leave_type, t)

  return (
    <ListRow className={cn(ROW_GRID, "min-h-14")}>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-7">
          <AvatarImage src={req.profiles?.avatar_url || undefined} alt={name} />
          <AvatarFallback className="text-[11px]">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="text-foreground truncate">{name}</span>
          {(req.reason || req.review_note || req.proof_url) && (
            <span className="text-tertiary-foreground flex min-w-0 items-center gap-1.5 text-[13px]">
              {req.reason && (
                <span className="truncate" title={req.reason}>
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
      </div>

      <div>
        <Badge variant={LEAVE_TYPE_BADGE[req.leave_type] ?? "secondary"}>
          {type}
        </Badge>
      </div>
      <span className="text-foreground hidden truncate tabular-nums md:block">
        {formatLeaveRange(req.start_date, req.end_date, dateLocale)}
      </span>
      <span className="text-muted-foreground hidden text-right tabular-nums md:block">
        {t(daysKey(days), { n: days })}
      </span>
      <span
        className="text-tertiary-foreground hidden text-right text-[13px] whitespace-nowrap lg:block"
        title={
          submitted
            ? t("submittedAt", {
                date: format(submitted, "d MMM yyyy, HH:mm", {
                  locale: dateLocale,
                }),
              })
            : undefined
        }
        suppressHydrationWarning
      >
        {submitted ? shortAgo(submitted, t, dateLocale) : <EmptyValue />}
      </span>

      {/* Pending actions wrap under the row on narrow screens. */}
      <div
        className={cn(
          "justify-end",
          canManage && req.status === "pending"
            ? "col-span-full flex lg:col-span-1"
            : "hidden lg:flex",
        )}
      >
        {canManage &&
          (req.status === "pending" ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => onReject(req.id)}
              >
                {t("reject")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onApprove(req.id)}
              >
                {t("approve")}
              </Button>
            </div>
          ) : (
            <ListRowActions>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("deleteRequest")}
                title={tc("delete")}
                onClick={() => onDelete(req.id)}
              >
                <RiDeleteBinLine />
              </Button>
            </ListRowActions>
          ))}
      </div>
    </ListRow>
  )
}

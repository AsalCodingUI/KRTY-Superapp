"use client"

import { GroupedList, ListRow } from "@/components/grouped-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { ANNUAL_LEAVE_QUOTA, daysKey } from "@/shared/lib/leave"

type BalanceProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  job_title: string | null
  leave_used?: number | null
  leave_balance?: number | null
  leave_quota?: number
  leave_note?: string | null
}

/** Shared column template so the header and rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_10rem_6rem_8rem_6rem]"

/** Saldo Cuti: everyone's annual-leave balance as one flat list. */
export function RemainingLeaveList({ data }: { data: BalanceProfile[] }) {
  const t = useT("leave")
  const people = [...data].sort((a, b) =>
    (a.full_name || "").localeCompare(b.full_name || ""),
  )

  return (
    <GroupedList>
      <div
        className={cn(
          ROW_GRID,
          "gutter-x text-muted-foreground border-border h-9 border-b text-[13px]",
        )}
      >
        <span>{t("colEmployee")}</span>
        <span className="hidden md:block">{t("colJobTitle")}</span>
        <span className="hidden text-right md:block">{t("colUsed")}</span>
        <span className="hidden md:block" />
        <span className="text-right">{t("colRemaining")}</span>
      </div>
      {people.map((p) => {
        const name = p.full_name || t("unknownName")
        const quota = p.leave_quota ?? ANNUAL_LEAVE_QUOTA
        const used = p.leave_used ?? 0
        const remaining = p.leave_balance ?? quota
        return (
          <ListRow key={p.id} className={cn(ROW_GRID, "min-h-14")}>
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-7">
                <AvatarImage src={p.avatar_url || undefined} alt={name} />
                <AvatarFallback className="text-[11px]">
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="text-foreground truncate">{name}</span>
                {p.leave_note && (
                  <span className="text-tertiary-foreground truncate text-[13px]">
                    {p.leave_note}
                  </span>
                )}
              </div>
            </div>
            <div className="hidden min-w-0 md:block">
              <Badge variant="secondary" className="max-w-full">
                <span className="truncate">
                  {p.job_title || t("noJobTitle")}
                </span>
              </Badge>
            </div>
            <span className="text-muted-foreground hidden text-right tabular-nums md:block">
              {t(daysKey(used), { n: used })}
            </span>
            <div
              className="bg-muted hidden h-1.5 overflow-hidden rounded-full md:block"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={quota}
              aria-valuenow={used}
              aria-label={t("usedOfQuota", { used, quota })}
            >
              <div
                className="bar-grow bg-primary h-full rounded-full"
                style={
                  {
                    "--bar": `${quota ? Math.min(100, (used / quota) * 100) : 0}%`,
                  } as React.CSSProperties
                }
              />
            </div>
            <span className="text-right tabular-nums">
              {remaining}
              <span className="text-muted-foreground"> / {quota}</span>
            </span>
          </ListRow>
        )
      })}
    </GroupedList>
  )
}

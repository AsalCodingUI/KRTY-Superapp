"use client"

import { GroupedList, ListGroup, ListRow } from "@/components/grouped-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ANNUAL_LEAVE_QUOTA } from "@/shared/lib/leave"

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

/** Saldo Cuti: everyone's annual-leave balance, grouped by job title. */
export function RemainingLeaveList({ data }: { data: BalanceProfile[] }) {
  const groups = new Map<string, BalanceProfile[]>()
  for (const p of data) {
    const key = p.job_title || "Tanpa jabatan"
    groups.set(key, [...(groups.get(key) ?? []), p])
  }

  return (
    <GroupedList>
      {[...groups.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([title, people]) => (
          <ListGroup key={title} label={title} count={people.length}>
            {people.map((p) => {
              const name = p.full_name || "Unknown"
              const quota = p.leave_quota ?? ANNUAL_LEAVE_QUOTA
              const used = p.leave_used ?? 0
              const remaining = p.leave_balance ?? quota
              return (
                <ListRow key={p.id}>
                  <Avatar className="size-5">
                    <AvatarImage src={p.avatar_url || undefined} alt={name} />
                    <AvatarFallback className="text-[10px]">
                      {name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate font-medium">{name}</span>
                    {p.leave_note && (
                      <span className="text-muted-foreground/70 truncate text-xs">
                        {p.leave_note}
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground w-24 shrink-0 text-right text-xs tabular-nums">
                    {used} terpakai
                  </span>
                  <div
                    className="bg-muted h-1.5 w-32 shrink-0 overflow-hidden rounded-full"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={quota}
                    aria-valuenow={used}
                    aria-label={`${used} dari ${quota} hari terpakai`}
                  >
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{
                        width: `${quota ? Math.min(100, (used / quota) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs tabular-nums">
                    <span className="font-medium">{remaining}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      / {quota} hari
                    </span>
                  </span>
                </ListRow>
              )
            })}
          </ListGroup>
        ))}
    </GroupedList>
  )
}

"use client"

import { EmptyValue, orEmpty } from "@/components/empty-value"
import {
  getPeriodLock,
  getTeamKpi,
  lockPeriod,
  unlockPeriod,
  type TeamKpiRow,
} from "@/app/(main)/performance/actions/kpi-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { formatPercent, ratingFor } from "@/entities/performance/lib/kpi"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  RiArrowRightSLine,
  RiGroupLine,
  RiLockLine,
} from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { ListColumns, PersonCell, StatBand } from "../list"
import { isQuarter, periodLabel } from "./period"
import { RatingChip } from "./RatingChip"

/**
 * Closing a quarter: "Kunci periode" snapshots everyone's numbers; once
 * locked, a badge plus "Buka kunci". Both ask first.
 */
function PeriodLockControl({ period }: { period: string }) {
  const t = useT("performance")
  const dateLocale = useDateLocale()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  // Kept after closing so the dialog text doesn't flip while it fades out.
  const [confirm, setConfirm] = useState<"lock" | "unlock">("lock")
  const ask = (action: "lock" | "unlock") => {
    setConfirm(action)
    setOpen(true)
  }
  const { data: lock, isLoading } = useQuery({
    queryKey: ["kpi-lock", period],
    queryFn: () => getPeriodLock(period),
    staleTime: 30_000,
  })
  if (isLoading || !lock) return null

  const label = periodLabel(period, t)
  const run = async () => {
    const result =
      confirm === "unlock"
        ? await unlockPeriod(period)
        : await lockPeriod(period)
    if (!result.success) {
      toast.error(result.error ?? t("periodLockFailed"))
      return
    }
    toast.success(
      confirm === "unlock" ? t("kpiPeriodUnlocked") : t("kpiPeriodLocked"),
    )
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["kpi-lock"] }),
      queryClient.invalidateQueries({ queryKey: ["kpi-team"] }),
      queryClient.invalidateQueries({ queryKey: ["kpi"] }),
    ])
  }

  return (
    <>
      {lock.locked ? (
        <>
          <Badge variant="secondary" className="font-normal">
            <RiLockLine data-icon="inline-start" />
            {lock.lockedAt
              ? t("kpiLockedOn", {
                  date: format(parseISO(lock.lockedAt), "d MMM yyyy", {
                    locale: dateLocale,
                  }),
                })
              : t("kpiLocked")}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => ask("unlock")}>
            {t("kpiUnlockPeriod")}
          </Button>
        </>
      ) : (
        <Button variant="outline" size="sm" onClick={() => ask("lock")}>
          <RiLockLine data-icon="inline-start" />
          {t("kpiLockPeriod")}
        </Button>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={run}
        title={
          confirm === "unlock"
            ? t("kpiUnlockConfirmTitle", { period: label })
            : t("kpiLockConfirmTitle", { period: label })
        }
        description={
          confirm === "unlock"
            ? t("kpiUnlockConfirmDescription")
            : t("kpiLockConfirmDescription")
        }
        confirmText={
          confirm === "unlock" ? t("kpiUnlockPeriod") : t("kpiLockPeriod")
        }
        variant={confirm === "unlock" ? "destructive" : "default"}
      />
    </>
  )
}

/** Shared column template so the header and rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_3.5rem_1rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_4.5rem_3.5rem_9rem_1rem] lg:grid-cols-[minmax(0,1fr)_10rem_4.5rem_4.5rem_4.5rem_3.5rem_9rem_1rem]"

const projectsLabel = (
  row: TeamKpiRow,
  t: ReturnType<typeof useT<"performance">>,
) =>
  row.projectCount
    ? t("projectCount", { n: row.projectCount })
    : t("noProjects")

function Part({
  value,
  className,
}: {
  value: number | null
  className?: string
}) {
  return (
    <span
      className={cn(
        "text-right tabular-nums",
        value === null ? "text-tertiary-foreground" : "text-foreground",
        className,
      )}
    >
      {orEmpty(formatPercent(value))}
    </span>
  )
}

const kpiHref = (row: TeamKpiRow, scope: string) =>
  `/performance/employee/${row.id}?period=${encodeURIComponent(scope)}`

/** Everyone's KPI for the period, best first. */
export function TeamKpiList({ scope }: { scope: string }) {
  const t = useT("performance")
  const { data, isLoading } = useQuery({
    queryKey: ["kpi-team", scope],
    queryFn: () => getTeamKpi(scope),
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }
  if (!data?.success) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        {data?.error ?? t("teamKpiLoadFailed")}
      </p>
    )
  }
  const rows = data.data
  if (rows.length === 0) {
    return (
      <EmptyState
        title={t("noMembers")}
        icon={<RiGroupLine className="size-5" />}
        placement="inner"
      />
    )
  }

  const href = (row: TeamKpiRow) => kpiHref(row, scope)

  const scored = rows.filter((r) => r.final.score !== null)
  const stats = (
    <StatBand
      stats={[
        { label: t("member"), value: rows.length },
        {
          label: t("averageFinalScore"),
          value: scored.length ? (
            Math.round(
              scored.reduce((sum, r) => sum + (r.final.score ?? 0), 0) /
                scored.length,
            )
          ) : (
            <EmptyValue />
          ),
        },
        {
          label: t("ratingBelow"),
          value: scored.filter((r) =>
            ["warning", "destructive"].includes(
              ratingFor(r.final.score)?.tone ?? "",
            ),
          ).length,
        },
        { label: t("noData"), value: rows.length - scored.length },
      ]}
      aside={isQuarter(scope) ? <PeriodLockControl period={scope} /> : null}
    />
  )

  const sorted = [...rows].sort(
    (a, b) => (b.final.score ?? -1) - (a.final.score ?? -1),
  )

  return (
    <>
      {stats}
      <GroupedList>
        <ListColumns grid={ROW_GRID}>
          <span>{t("member")}</span>
          <span className="hidden lg:block">{t("jobTitle")}</span>
          <span className="hidden text-right md:block">{t("sla")}</span>
          <span className="hidden text-right md:block">
            {t("review360Short")}
          </span>
          <span className="hidden text-right md:block">{t("quality")}</span>
          <span className="text-right">{t("score")}</span>
          <span className="hidden md:block">{t("rating")}</span>
          <span />
        </ListColumns>
        {sorted.map((row) => (
          <ListRow key={row.id} className={cn(ROW_GRID, "min-h-14")}>
            <PersonCell
              name={row.full_name}
              avatarUrl={row.avatar_url}
              secondary={projectsLabel(row, t)}
            >
              <Link
                href={href(row)}
                prefetch={false}
                className="text-foreground truncate outline-none after:absolute after:inset-0 focus-visible:underline"
                aria-label={t("kpiOf", { name: row.full_name ?? "" })}
              >
                {row.full_name}
              </Link>
            </PersonCell>
            <div className="hidden min-w-0 lg:block">
              {row.job_title && (
                <Badge variant="secondary" className="max-w-full">
                  <span className="truncate">{row.job_title}</span>
                </Badge>
              )}
            </div>
            <Part value={row.parts.sla} className="hidden md:block" />
            <Part value={row.parts.review} className="hidden md:block" />
            <Part value={row.parts.quality} className="hidden md:block" />
            <span className="text-foreground text-right tabular-nums">
              {row.final.score === null ? (
                <EmptyValue />
              ) : (
                Math.round(row.final.score)
              )}
            </span>
            <div className="hidden md:block">
              <RatingChip score={row.final.score} />
            </div>
            <RiArrowRightSLine className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100" />
          </ListRow>
        ))}
      </GroupedList>
    </>
  )
}

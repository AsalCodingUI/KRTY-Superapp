"use client"

import { ArrowUpRight } from "@/components/icons"
import { EmptyValue } from "@/components/empty-value"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatPercent,
  KPI_PARTS,
  type KpiParts,
} from "@/entities/performance/lib/kpi"
import { useEmployeeKpi } from "@/page-slices/performance/ui/kpi/use-employee-kpi"
import { Ring } from "@/page-slices/performance/ui/kpi/MyKpiView"
import { periodLabel } from "@/page-slices/performance/ui/kpi/period"
import { RatingChip } from "@/page-slices/performance/ui/kpi/RatingChip"
import { useT } from "@/shared/i18n/client"
import { HomeCard, HomeIconLink } from "./home-card"

/**
 * The member's KPI on the home page, in the Kinerja page's language: the
 * final score with its rating and what to focus on, then the three parts
 * as small rings against their targets.
 */
export function HomeKpiCard({
  userId,
  period,
}: {
  userId: string
  /** "2026-Q4" or "2026-All", as the home page's filter. */
  period: string
}) {
  const t = useT("dashboard")
  const tp = useT("performance")
  const { data, isLoading } = useEmployeeKpi(userId, period)
  const kpi = data?.success ? data.data : null
  const score = kpi?.final.score ?? null

  // The part furthest under its target is the one to work on.
  const focus = kpi
    ? KPI_PARTS.map((p) => ({ ...p, value: kpi.parts[p.key] }))
        .filter((p) => p.value !== null && p.value < p.target)
        .sort((a, b) => b.target - b.value! - (a.target - a.value!))[0]
    : undefined

  return (
    <HomeCard
      title={t("performanceTitle")}
      badge={<Badge variant="secondary">{periodLabel(period, tp)}</Badge>}
      actions={
        <HomeIconLink
          href={`/performance?period=${encodeURIComponent(period)}`}
          label={t("openKpi")}
        >
          <ArrowUpRight />
        </HomeIconLink>
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-heading text-[1.75rem] leading-none font-normal tracking-tight tabular-nums">
                {score === null ? <EmptyValue /> : Math.round(score)}
              </span>
              <RatingChip score={score} />
            </div>
            <p className="text-muted-foreground text-[13px]">
              {score === null
                ? tp("myKpiEmpty")
                : focus
                  ? tp("myPerfFocus", {
                      part: tp(focus.label),
                      n: Math.ceil(focus.target - focus.value!),
                    })
                  : tp("myPerfAllOnTarget")}
            </p>
          </div>
          <dl className="border-border mt-auto grid grid-cols-3 gap-3 border-t pt-4">
            {KPI_PARTS.map((part) => {
              const value = kpi ? (kpi.parts as KpiParts)[part.key] : null
              return (
                <div
                  key={part.key}
                  className="flex min-w-0 items-center gap-2.5"
                >
                  <Ring value={value} target={part.target} />
                  {/* Label first for screen readers, value shown on top. */}
                  <div className="flex min-w-0 flex-col-reverse">
                    <dt className="text-muted-foreground truncate text-xs">
                      {tp(part.label)}
                    </dt>
                    <dd className="text-foreground text-base tabular-nums">
                      {value === null ? <EmptyValue /> : formatPercent(value)}
                    </dd>
                  </div>
                </div>
              )
            })}
          </dl>
        </>
      )}
    </HomeCard>
  )
}

"use client"

import { ArrowUpRight } from "@/components/icons"
import { EmptyValue } from "@/components/empty-value"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { RATINGS, type RatingTone } from "@/entities/performance/lib/kpi"
import { cn } from "@/lib/utils"
import { periodLabel } from "@/page-slices/performance/ui/kpi/period"
import { RatingChip } from "@/page-slices/performance/ui/kpi/RatingChip"
import { useT } from "@/shared/i18n/client"
import type { AdminDashboardData } from "../actions/dashboard-admin-actions"
import {
  HomeCard,
  HomeEmpty,
  HomeFooter,
  HomeIconLink,
  HomeRow,
} from "./home-card"

/** Segment colour per rating band (same tones as the rating chips). */
const BAND: Record<RatingTone, string> = {
  success: "bg-success",
  info: "bg-info",
  neutral: "bg-foreground/30",
  warning: "bg-warning",
  destructive: "bg-destructive",
}

const DIST_KEYS = [
  "outstanding",
  "aboveExpectation",
  "meetsExpectation",
  "belowExpectation",
  "needsImprovement",
] as const

/**
 * The team's KPI on the stakeholder home, in the Kinerja page's language:
 * the average with its rating, how the team spreads over the rating bands,
 * and who needs attention. Figures are from the latest quarter with scores.
 */
export function TeamKpiCard({ data }: { data: AdminDashboardData }) {
  const t = useT("dashboard")
  const tp = useT("performance")
  const avg = data.teamMetrics.avgTeamPerformance
  const quarter = data.teamMetrics.performanceQuarter
  const bands = RATINGS.map((r, i) => ({
    ...r,
    count: data.performanceDistribution[DIST_KEYS[i]],
  }))
  const rated = bands.reduce((s, b) => s + b.count, 0)
  const attention = data.employeesNeedingAttention

  return (
    <HomeCard
      title={t("adminTeamPerformanceTitle")}
      badge={<Badge variant="secondary">{periodLabel(quarter, tp)}</Badge>}
      actions={
        <HomeIconLink
          href={`/performance?period=${encodeURIComponent(quarter)}`}
          label={t("openPerformance")}
        >
          <ArrowUpRight />
        </HomeIconLink>
      }
    >
      <div className="flex flex-col gap-1.5">
        <p className="text-muted-foreground text-[13px]">
          {t("adminAvgScore")}
        </p>
        <div className="flex items-center gap-2.5">
          <span className="text-heading text-[1.75rem] leading-none font-normal tracking-tight tabular-nums">
            {avg === null ? <EmptyValue /> : Math.round(avg)}
          </span>
          <RatingChip score={avg} />
        </div>
      </div>

      {rated > 0 && (
        <div className="flex flex-col gap-2.5">
          {/* The team over the rating bands, best first. */}
          <div className="flex h-2 gap-0.5">
            {bands
              .filter((b) => b.count > 0)
              .map((b) => (
                <Tooltip key={b.label}>
                  <TooltipTrigger
                    render={
                      <div
                        className={cn("h-full rounded-full", BAND[b.tone])}
                        style={{ flexGrow: b.count }}
                      />
                    }
                  />
                  <TooltipContent>
                    {tp(b.label)} · {b.count}
                  </TooltipContent>
                </Tooltip>
              ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {bands
              .filter((b) => b.count > 0)
              .map((b) => (
                <span
                  key={b.label}
                  className="text-muted-foreground flex items-center gap-1.5 text-xs"
                >
                  <span
                    aria-hidden
                    className={cn("size-1.5 rounded-full", BAND[b.tone])}
                  />
                  {tp(b.label)}
                  <span className="text-foreground tabular-nums">
                    {b.count}
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}

      <div className="flex flex-col">
        <p className="text-muted-foreground pb-1 text-[13px]">
          {t("adminNeedsAttention")}
        </p>
        {rated === 0 ? (
          <HomeEmpty>{t("adminNoData")}</HomeEmpty>
        ) : attention.length === 0 ? (
          <p className="text-tertiary-foreground py-2 text-[13px]">
            {t("adminAllOnTrack")}
          </p>
        ) : (
          attention.slice(0, 3).map((e) => (
            <HomeRow
              key={e.employee_id}
              href={`/performance/employee/${e.employee_id}?period=${encodeURIComponent(quarter)}`}
              leading={
                <Avatar className="size-7">
                  <AvatarImage src={e.employee_avatar || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {e.employee_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              }
              title={e.employee_name}
              subtitle={e.employee_job_title}
              trailing={<RatingChip score={e.overall_percentage} />}
            />
          ))
        )}
      </div>

      <HomeFooter
        label={t("adminRated")}
        value={
          rated > 0
            ? t(rated === 1 ? "adminRatedCountOne" : "adminRatedCount", {
                n: rated,
              })
            : t("adminNoData")
        }
        href={`/performance?period=${encodeURIComponent(quarter)}`}
      />
    </HomeCard>
  )
}

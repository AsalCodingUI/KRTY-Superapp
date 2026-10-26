"use client"

import type {
  KpiProject,
  KpiTrendPoint,
} from "@/app/(main)/performance/actions/kpi-actions"
import {
  HomeCard,
  HomeEmpty,
  HomeRow,
} from "@/app/(main)/dashboard/components/home-card"
import { EmptyValue } from "@/components/empty-value"
import { ProjectAvatar } from "@/components/project-avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  formatPercent,
  KPI_PARTS,
  type KpiPart,
  type KpiParts,
} from "@/entities/performance/lib/kpi"
import {
  daysBetween,
  todayJakarta,
} from "@/entities/performance/lib/kpi-phases"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  RiCheckboxCircleFill,
  RiErrorWarningLine,
  RiLockLine,
  RiInformationLine,
} from "@/shared/ui/lucide-icons"
import { format, parseISO } from "date-fns"
import { MyOneOnOneCard } from "../meeting/MyOneOnOne"
import { My360Actions, Their360Actions } from "../review/MyReview"
import { AttentionList, upcomingMilestones } from "./KpiSections"
import { useEmployeeKpi } from "./use-employee-kpi"
import { isQuarter, quarterShort } from "./period"
import { RatingChip } from "./RatingChip"

const CARD =
  "bg-card border-field-border dark:border-border min-w-0 rounded-xl border"

/** "Q1" for the quarter before, when the trend has a score for it. */
function previousOf(trend: KpiTrendPoint[], scope: string) {
  const i = trend.findIndex((p) => p.quarter === scope)
  const prev = i > 0 ? trend[i - 1] : null
  return prev && prev.final !== null ? prev : null
}

const TICKS = 41

/**
 * The final score as a half-circle of ticks, lit up to the score (like
 * the 360 rating scale).
 */
function ScoreGauge({ score }: { score: number | null }) {
  const t = useT("performance")
  return (
    <div className="relative h-[128px] w-[232px] shrink-0">
      <svg viewBox="0 0 232 128" className="block size-full" aria-hidden>
        {Array.from({ length: TICKS }, (_, i) => {
          const at = i / (TICKS - 1)
          const angle = Math.PI * (1 - at)
          const [cos, sin] = [Math.cos(angle), Math.sin(angle)]
          const lit = score !== null && at * 100 <= score + 0.5
          return (
            <line
              key={i}
              x1={116 + cos * 96}
              y1={122 - sin * 96}
              x2={116 + cos * 110}
              y2={122 - sin * 110}
              strokeWidth={3}
              strokeLinecap="round"
              stroke="currentColor"
              className={cn(
                "transition-colors duration-500",
                lit ? "text-blue-9" : "text-foreground/10",
              )}
              style={{ transitionDelay: `${i * 12}ms` }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
        <span className="text-heading text-5xl leading-none font-normal tracking-tight tabular-nums">
          {score === null ? <EmptyValue /> : Math.round(score)}
        </span>
        <span className="text-muted-foreground mt-1.5 text-xs">
          {t("finalScore")}
        </span>
      </div>
    </div>
  )
}

/** Final score per quarter as slim bars on a baseline; the viewed quarter
 *  is solid, a quarter without a score is a dot. */
function TrendBars({
  trend,
  active,
}: {
  trend: KpiTrendPoint[]
  active: string
}) {
  const points = trend.slice(-4)
  if (points.length === 0) return null
  const refYear = active.slice(0, 4)
  return (
    <div className="flex shrink-0 flex-col">
      <div className="flex">
        {points.map((p) => {
          const on = p.quarter === active
          return (
            <div
              key={p.quarter}
              className="flex w-12 flex-col items-center gap-2"
            >
              <span
                className={cn(
                  "text-xs tabular-nums",
                  on ? "text-foreground" : "text-tertiary-foreground",
                )}
              >
                {p.final === null ? "–" : Math.round(p.final)}
              </span>
              <div className="flex h-14 items-end">
                {p.final === null ? (
                  <span className="bg-foreground/15 size-1.5 rounded-full" />
                ) : (
                  <div
                    className={cn(
                      "bar-grow-y bg-blue-9 w-1.5 rounded-full",
                      !on && "opacity-40",
                    )}
                    style={
                      {
                        // 50–100 fills the bar so small changes still show.
                        "--bar": `${Math.max(10, Math.min(100, ((p.final - 50) / 50) * 100))}%`,
                      } as React.CSSProperties
                    }
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] whitespace-nowrap",
                  on ? "text-foreground" : "text-tertiary-foreground",
                )}
              >
                {p.quarter.slice(5)}
                {p.quarter.slice(0, 4) !== refYear &&
                  ` ’${p.quarter.slice(2, 4)}`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Small ring: a part's score against 100, warning when under target. Also
 *  used on the home page's KPI card. */
export function Ring({
  value,
  target,
}: {
  value: number | null
  target: number
}) {
  const v = value === null ? 0 : Math.max(0, Math.min(100, value))
  const under = value !== null && value < target
  return (
    <svg
      viewBox="0 0 40 40"
      className="size-10 shrink-0 -rotate-90"
      aria-hidden
    >
      <circle
        cx={20}
        cy={20}
        r={17}
        fill="none"
        strokeWidth={3}
        className="stroke-foreground/10"
      />
      {value !== null && (
        <circle
          cx={20}
          cy={20}
          r={17}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          stroke="currentColor"
          pathLength={100}
          strokeDasharray={`${v} 100`}
          className={cn(
            "transition-[stroke-dasharray] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
            under ? "text-warning" : "text-blue-9",
          )}
        />
      )}
    </svg>
  )
}

/** One KPI part as a stat card: value and ring, then one quiet status line
 *  (weight and how it's counted in the tooltip). */
function PartCard({
  part,
  value,
  footer,
}: {
  part: KpiPart
  value: number | null
  footer?: React.ReactNode
}) {
  const t = useT("performance")
  const meta = KPI_PARTS.find((p) => p.key === part)!
  const gap = value === null ? null : Math.ceil(meta.target - value)
  return (
    <section className={cn(CARD, "flex flex-col gap-4 p-5")}>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground truncate text-[13px]">
          {t(meta.label)}
        </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label={t(meta.description)}
                className="text-tertiary-foreground hover:text-muted-foreground -m-1 p-1 outline-none"
              />
            }
          >
            <RiInformationLine className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent className="max-w-60">
            {t(meta.description)}.{" "}
            {t("myKpiWeight", { n: meta.weight, target: meta.target })}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-heading text-[2rem] leading-none font-normal tracking-tight tabular-nums">
          {value === null ? <EmptyValue /> : formatPercent(value)}
        </span>
        <Ring value={value} target={meta.target} />
      </div>
      <div className="text-muted-foreground flex items-center gap-1.5 text-[13px]">
        {gap !== null &&
          (gap <= 0 ? (
            <RiCheckboxCircleFill className="text-success-ink size-3.5 shrink-0" />
          ) : (
            <RiErrorWarningLine className="text-warning size-3.5 shrink-0" />
          ))}
        <span className="truncate">
          {gap === null
            ? t("myKpiNoScore")
            : gap <= 0
              ? t("myPerfOnTarget", { target: meta.target })
              : t("myPerfBelow", { n: gap, target: meta.target })}
        </span>
      </div>
      {footer}
    </section>
  )
}

function QualityValue({
  project,
  scope,
}: {
  project: KpiProject
  scope: string
}) {
  const t = useT("performance")
  if (project.qualityState === "counted")
    return (
      <span className="tabular-nums">{formatPercent(project.quality)}</span>
    )
  return (
    <span className="text-tertiary-foreground text-[13px]">
      {project.qualityState === "unscored"
        ? t("kpiQualityUnscored")
        : project.qualityState === "elsewhere" && project.qualityQuarter
          ? t("kpiQualityElsewhere", {
              q: quarterShort(project.qualityQuarter, scope.slice(0, 4)),
            })
          : t("kpiQualityPending")}
    </span>
  )
}

const PROJECT_COLS = "grid grid-cols-[4rem_5.5rem] gap-x-3 text-right"

/**
 * The member's performance on one page: a hero with the final score
 * (gauge, rating, what to focus on, the trend), the three parts as stat
 * cards (the 360 one opens its full result), then projects and deadlines
 * next to the 1:1. The
 * admin view (variant "stakeholder") adds the lock state and fixes.
 */
export function MyKpiView({
  userId,
  scope,
  hrefFor,
  variant = "self",
  name = "",
}: {
  userId: string
  scope: string
  hrefFor: (project: KpiProject) => string
  /** "self": the member's own page. "stakeholder": the same page for
   *  someone else, read-only, with the lock state and what needs fixing. */
  variant?: "self" | "stakeholder"
  /** The person's name (stakeholder variant). */
  name?: string
}) {
  const t = useT("performance")
  const staff = variant === "stakeholder"
  const dateLocale = useDateLocale()
  const { data, isLoading } = useEmployeeKpi(userId, scope)
  const kpi = data?.success ? data.data : null

  const score = kpi?.final.score ?? null
  const prev = kpi && isQuarter(scope) ? previousOf(kpi.trend, scope) : null
  const delta =
    score !== null && prev?.final != null
      ? Math.round(score - prev.final)
      : null
  const today = todayJakarta()
  const due = kpi ? upcomingMilestones(kpi.projects).slice(0, 3) : []

  // The part furthest under its target is the one to work on.
  const focus = kpi
    ? KPI_PARTS.map((p) => ({ ...p, value: kpi.parts[p.key] }))
        .filter((p) => p.value !== null && p.value < p.target)
        .sort((a, b) => b.target - b.value! - (a.target - a.value!))[0]
    : undefined

  const caption = !kpi
    ? null
    : score === null
      ? t("myKpiEmpty")
      : delta === null || !prev
        ? t("myKpiFromParts", {
            n: (Object.keys(kpi.parts) as KpiPart[]).filter(
              (k) => kpi.parts[k] !== null,
            ).length,
          })
        : t(delta > 0 ? "myKpiUp" : delta < 0 ? "myKpiDown" : "myKpiSame", {
            n: Math.abs(delta),
            q: quarterShort(prev.quarter, scope.slice(0, 4)),
          })

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* Hero: the final score and what to do about it. */}
      <section
        className={cn(
          CARD,
          "flex flex-col gap-6 p-6 md:flex-row md:items-center md:gap-10",
        )}
      >
        {isLoading ? (
          <Skeleton className="h-[104px] w-full" />
        ) : !kpi ? (
          <HomeEmpty>
            {(data && !data.success && data.error) || t("kpiLoadFailed")}
          </HomeEmpty>
        ) : (
          <>
            <ScoreGauge score={score} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <RatingChip score={score} />
                {delta !== null && delta !== 0 && (
                  <Badge variant={delta > 0 ? "success" : "warning"}>
                    {delta > 0 ? "+" : "−"}
                    {Math.abs(delta)}
                  </Badge>
                )}
              </div>
              <p className="text-heading text-lg leading-snug font-normal text-balance">
                {score === null
                  ? t("myKpiEmpty")
                  : focus
                    ? t(staff ? "theirPerfFocus" : "myPerfFocus", {
                        name,
                        part: t(focus.label),
                        n: Math.ceil(focus.target - focus.value!),
                      })
                    : t(staff ? "theirPerfAllOnTarget" : "myPerfAllOnTarget", {
                        name,
                      })}
              </p>
              {score !== null && (
                <p className="text-muted-foreground text-[13px]">{caption}</p>
              )}
              {/* Stakeholders: the period's lock, and drift since. */}
              {staff && kpi.lock && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant="secondary">
                    <RiLockLine data-icon="inline-start" />
                    {t("kpiLockedOn", {
                      date: format(parseISO(kpi.lock.lockedAt), "d MMM yyyy", {
                        locale: dateLocale,
                      }),
                    })}
                  </Badge>
                  {kpi.lock.changed && (
                    <span className="text-warning flex items-center gap-1.5 text-[13px]">
                      <RiErrorWarningLine className="size-3.5 shrink-0" />
                      {t("kpiChangedAfterLock", {
                        n:
                          kpi.lock.liveFinal === null
                            ? t("noData").toLowerCase()
                            : String(Math.round(kpi.lock.liveFinal)),
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>
            {isQuarter(scope) && <TrendBars trend={kpi.trend} active={scope} />}
          </>
        )}
      </section>

      {/* The three parts behind the score. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoading || !kpi
          ? [0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[150px] rounded-xl" />
            ))
          : KPI_PARTS.map(({ key }) => (
              <PartCard
                key={key}
                part={key}
                value={(kpi.parts as KpiParts)[key]}
                // The 360's state and result open from here (and, for the
                // member, the teammates to review).
                footer={
                  key === "review" &&
                  (staff ? (
                    <Their360Actions userId={userId} period={scope} />
                  ) : (
                    <My360Actions period={scope} />
                  ))
                }
              />
            ))}
      </div>

      {/* Stakeholders: what to fix for these numbers to be right. */}
      {staff && kpi && kpi.attention.length > 0 && (
        <HomeCard
          title={t("kpiNeedsAction")}
          badge={<Badge variant="warning">{kpi.attention.length}</Badge>}
          className="[--bleed:0.75rem] [--page-gutter:0.75rem]"
        >
          <AttentionList
            bare
            items={kpi.attention}
            projects={kpi.projects}
            hrefFor={hrefFor}
          />
        </HomeCard>
      )}

      {/* Work on the left, the 1:1 on the right. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <HomeCard
          className="lg:col-span-2"
          title={t("project")}
          actions={
            kpi && kpi.projects.length > 0 ? (
              <div
                className={cn(
                  PROJECT_COLS,
                  "text-muted-foreground pr-2 text-[13px]",
                )}
              >
                <span>{t("sla")}</span>
                <span>{t("quality")}</span>
              </div>
            ) : null
          }
        >
          {isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : !kpi || kpi.projects.length === 0 ? (
            <HomeEmpty>{t("noProjectsInPeriod")}</HomeEmpty>
          ) : (
            <div className="flex flex-col">
              {kpi.projects.map((project) => (
                <HomeRow
                  key={project.assignmentId}
                  href={hrefFor(project)}
                  leading={
                    <ProjectAvatar
                      id={project.projectId}
                      name={project.name}
                      className="size-8 shrink-0 rounded-lg text-xs"
                    />
                  }
                  title={
                    <span className={cn(project.excluded && "opacity-60")}>
                      {project.name}
                    </span>
                  }
                  subtitle={
                    project.excluded
                      ? t("kpiExcludedHint")
                      : project.running && project.overdueDays > 0
                        ? t("kpiOverdueDays", { n: project.overdueDays })
                        : project.role
                  }
                  trailing={
                    <div className={PROJECT_COLS}>
                      <span className="tabular-nums">
                        {project.sla === null ? (
                          <EmptyValue />
                        ) : (
                          formatPercent(project.sla)
                        )}
                      </span>
                      <QualityValue project={project} scope={scope} />
                    </div>
                  }
                />
              ))}
            </div>
          )}

          {/* What's due next, only when something is. */}
          {due.length > 0 && (
            <div className="border-border flex flex-col gap-1 border-t pt-4">
              <p className="text-muted-foreground pb-1 text-[13px]">
                {t("kpiUpcomingDue")}
              </p>
              {due.map(({ project, milestone, due: date }) => {
                const days = daysBetween(today, date)
                return (
                  <HomeRow
                    key={`${project.assignmentId}-${milestone.phaseId ?? milestone.name}`}
                    href={hrefFor(project)}
                    title={milestone.name}
                    subtitle={`${project.name} · ${format(parseISO(date), "d MMM", { locale: dateLocale })}`}
                    trailing={
                      days < 0 ? (
                        <Badge variant="warning">
                          {t("kpiOverdueBy", { n: -days })}
                        </Badge>
                      ) : (
                        <Badge variant={days <= 7 ? "info" : "secondary"}>
                          {days === 0
                            ? t("kpiDueToday")
                            : t("kpiDueIn", { n: days })}
                        </Badge>
                      )
                    }
                  />
                )
              })}
            </div>
          )}
        </HomeCard>

        <MyOneOnOneCard
          period={scope}
          subject={staff ? { id: userId, name } : undefined}
        />
      </div>
    </div>
  )
}

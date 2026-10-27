"use client"

import { useProjectHref } from "@/shared/hooks/useProjectHref"
import { EmptyValue, orEmpty } from "@/components/empty-value"
import {
  savePhaseOverride,
  saveProjectScores,
  type MilestoneInput,
  type PhaseOverride,
  type ProjectScoring,
} from "@/app/(main)/performance/actions/project-scoring-actions"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  formatPercent,
  qualityPercent,
  SLA_RESULT_LABELS,
  SLA_RESULT_PERCENT,
  slaPercent,
  type SLAResult,
} from "@/entities/performance/lib/kpi"
import {
  daysBetween,
  phaseResult,
  slaRows,
  type Milestone,
} from "@/entities/performance/lib/kpi-phases"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  RiArrowRightLine,
  RiCheckboxBlankCircleLine,
  RiCheckboxCircleFill,
  RiCheckLine,
  RiExternalLinkLine,
  RiFileList3Line,
  RiInformationLine,
  RiPencilLine,
} from "@/shared/ui/lucide-icons"
import { useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { m } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ListColumns } from "../list"
import { RatingChip } from "./RatingChip"

const RESULTS: SLAResult[] = ["Faster", "On Time", "Delay"]

/** Shared column templates so the headers and rows line up. */
const MILESTONE_GRID =
  "grid grid-cols-[minmax(0,1fr)_5rem_8.5rem] items-center gap-x-4 sm:grid-cols-[minmax(0,1fr)_5.5rem_9rem_3.5rem]"
const COMPETENCY_GRID =
  "grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-x-4"
const PHASE_GRID =
  "grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,9.5rem)] items-center gap-x-3 sm:grid-cols-[minmax(6rem,1fr)_3.5rem_6rem_6rem_minmax(0,1.6fr)_4.5rem]"
const PHASE_GRID_EDIT =
  "grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,9.5rem)_1.75rem] items-center gap-x-3 sm:grid-cols-[minmax(6rem,1fr)_3.5rem_6rem_6rem_minmax(0,1.6fr)_4.5rem_1.75rem]"
const CONTRIBUTION_GRID =
  "grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-x-4 sm:grid-cols-[6rem_minmax(0,1fr)_8rem_10rem]"

const RESULT_VARIANTS: Record<SLAResult, "success" | "secondary" | "warning"> =
  {
    Faster: "success",
    "On Time": "secondary",
    Delay: "warning",
  }

type T = ReturnType<typeof useT<"performance">>

/** "2026-Q3" → { year: 2026, q: 3 }. */
function splitQuarter(quarter: string) {
  const [year, q] = quarter.split("-Q").map(Number)
  return { year, q }
}

function quarterLabel(t: T, quarter: string) {
  const { year, q } = splitQuarter(quarter)
  if (!year || !q) return quarter
  return t("psQuarterLabel", { q, year })
}

/**
 * One member's scores on one project. Projects with phase due dates score
 * SLA automatically from the phases (editors can override a result for this
 * member, with a reason); older projects keep the manual milestone editor.
 * Competencies are scored by hand in both. The member sees it read-only.
 */
export function ProjectScoringView({
  assignmentId,
  employeeName,
  projectId,
  roleInProject,
  initial,
  canEdit,
  isStakeholder,
}: {
  assignmentId: string
  employeeName: string
  projectId: string
  roleInProject: string
  initial: ProjectScoring
  canEdit: boolean
  isStakeholder: boolean
}) {
  const t = useT("performance")
  const tc = useT("common")
  const router = useRouter()
  const queryClient = useQueryClient()
  const phaseMode = initial.mode === "phases"
  const [milestones, setMilestones] = useState<MilestoneInput[]>(
    initial.milestones,
  )
  const [competencies, setCompetencies] = useState(initial.competencies)
  const [dirty, setDirty] = useState(false)
  // A score only shows once something is checked: an unscored member
  // isn't "0%".
  const [qualityTouched, setQualityTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const totalWeight = milestones.reduce((s, m) => s + (m.weight || 0), 0)
  // Read-only members only see real numbers, never the defaults.
  const showSla = canEdit || initial.slaScored
  const showQuality = canEdit || initial.qualityScored
  const sla = useMemo(() => {
    if (phaseMode) return slaPercent(slaRows(initial.phaseMilestones))
    return showSla
      ? slaPercent(
          milestones.map((m) => ({
            weight_percentage: m.weight,
            actual_result: m.result,
          })),
        )
      : null
  }, [phaseMode, initial.phaseMilestones, milestones, showSla])
  const quality =
    showQuality && (initial.qualityScored || qualityTouched)
      ? qualityPercent(competencies.map((c) => ({ is_achieved: c.isAchieved })))
      : null

  const updateMilestone = (index: number, patch: Partial<MilestoneInput>) => {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    )
    setDirty(true)
  }

  const toggleCompetency = (id: string) => {
    setCompetencies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isAchieved: !c.isAchieved } : c)),
    )
    setQualityTouched(true)
    setDirty(true)
  }

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["kpi"] })
    queryClient.invalidateQueries({ queryKey: ["kpi-team"] })
    queryClient.invalidateQueries({ queryKey: ["project-sheet"] })
    queryClient.invalidateQueries({ queryKey: ["project-assessment"] })
    router.refresh()
  }

  const save = async () => {
    if (!phaseMode && totalWeight !== 100) {
      toast.error(t("weightMustBe100Now", { n: totalWeight }))
      return
    }
    setSaving(true)
    const result = await saveProjectScores(
      assignmentId,
      // Phase-based SLA comes from the phases; only competencies are saved.
      phaseMode ? null : milestones,
      competencies.map((c) => ({ id: c.id, isAchieved: c.isAchieved })),
    )
    setSaving(false)
    if (!result.success) {
      toast.error(result.error ?? t("scoresSaveFailed"))
      return
    }
    toast.success(t("scoresSaved"))
    setDirty(false)
    refresh()
  }

  return (
    <div className="flex flex-col">
      <SheetScores sla={sla} quality={quality} />

      {initial.project && (
        <SheetProperties
          scoring={initial}
          project={initial.project}
          scoredQuarters={scoredQuarters(initial, phaseMode)}
        />
      )}

      {phaseMode ? (
        <>
          <PhaseMilestones
            assignmentId={assignmentId}
            employeeName={employeeName}
            projectId={projectId}
            scoring={initial}
            canEdit={canEdit}
            isStakeholder={isStakeholder}
            onChanged={refresh}
          />
          <Contribution scoring={initial} quality={quality} />
        </>
      ) : (
        <section className="flex flex-col">
          <SectionHead title={t("milestoneSla")} hint={t("slaLegend")} />
          {!showSla ? (
            <NotScored>{t("milestonesNotScored")}</NotScored>
          ) : (
            <GroupedList hover={canEdit}>
              <ListColumns grid={MILESTONE_GRID}>
                <span>{t("milestone")}</span>
                <span className="text-right">{t("weight")}</span>
                <span>{t("result")}</span>
                <span className="hidden text-right sm:block">{t("score")}</span>
              </ListColumns>
              {milestones.map((m, index) => (
                <ListRow
                  key={`${m.name}-${index}`}
                  className={cn(MILESTONE_GRID, "min-h-14")}
                >
                  <span className="text-foreground truncate">{m.name}</span>
                  {canEdit ? (
                    <>
                      <div className="flex items-center justify-end gap-1.5">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="h-8 w-16 text-right tabular-nums"
                          value={m.weight}
                          aria-label={t("weightOf", { name: m.name })}
                          onChange={(e) =>
                            updateMilestone(index, {
                              weight: Number(e.target.value),
                            })
                          }
                        />
                        <span className="text-muted-foreground text-xs">%</span>
                      </div>
                      <Select
                        value={m.result}
                        onValueChange={(v) =>
                          v &&
                          updateMilestone(index, { result: v as SLAResult })
                        }
                      >
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue>
                            {(v: SLAResult) => t(SLA_RESULT_LABELS[v])}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent align="end">
                          {RESULTS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {t(SLA_RESULT_LABELS[r])}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground text-right tabular-nums">
                        {m.weight}%
                      </span>
                      <div>
                        <Badge variant={RESULT_VARIANTS[m.result]}>
                          {t(SLA_RESULT_LABELS[m.result])}
                        </Badge>
                      </div>
                    </>
                  )}
                  <span className="text-foreground hidden text-right tabular-nums sm:block">
                    {(m.weight * SLA_RESULT_PERCENT[m.result]) / 100}
                  </span>
                </ListRow>
              ))}
              {canEdit && totalWeight !== 100 && (
                <p className="text-warning gutter-x pt-2 text-xs">
                  {t("weightTotalMustBe100", { n: totalWeight })}
                </p>
              )}
            </GroupedList>
          )}
        </section>
      )}

      <section className="flex flex-col">
        <SectionHead
          title={t("competenciesForRole", { role: roleInProject })}
          extra={
            showQuality && competencies.length > 0
              ? t("achievedOfTotal", {
                  done: competencies.filter((c) => c.isAchieved).length,
                  total: competencies.length,
                })
              : undefined
          }
        />
        {competencies.length === 0 ? (
          <EmptyState
            placement="inner"
            title={t("noCompetencies")}
            description={t("addCompetenciesForRole", { role: roleInProject })}
            icon={<RiFileList3Line className="size-5" />}
          />
        ) : !showQuality ? (
          <NotScored>{t("competenciesNotScored")}</NotScored>
        ) : !canEdit ? (
          <ul className="flex flex-col">
            {competencies.map((c) => (
              <li
                key={c.id}
                className="border-border/60 flex gap-3 border-b py-3 last:border-b-0"
              >
                {c.isAchieved ? (
                  <RiCheckboxCircleFill
                    aria-label={t("achieved")}
                    className="text-success-ink mt-px size-[18px] shrink-0"
                  />
                ) : (
                  <RiCheckboxBlankCircleLine
                    aria-label={t("notYet")}
                    className="text-tertiary-foreground mt-px size-[18px] shrink-0"
                  />
                )}
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className={cn(
                      "text-sm",
                      c.isAchieved
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {c.name}
                  </span>
                  {c.description && (
                    <span
                      className="text-tertiary-foreground line-clamp-2 text-[13px]"
                      title={c.description}
                    >
                      {c.description}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <GroupedList hover={canEdit}>
            <ListColumns grid={COMPETENCY_GRID}>
              <span>{t("competency")}</span>
              <span className="text-right">{t("status")}</span>
            </ListColumns>
            {competencies.map((c) => (
              <ListRow key={c.id} className={cn(COMPETENCY_GRID, "min-h-14")}>
                <div className="flex min-w-0 flex-col">
                  <span className="text-foreground truncate">{c.name}</span>
                  {c.description && (
                    <span
                      className="text-tertiary-foreground line-clamp-2 text-[13px]"
                      title={c.description}
                    >
                      {c.description}
                    </span>
                  )}
                </div>
                <div className="flex justify-end">
                  {canEdit ? (
                    <Button
                      variant={c.isAchieved ? "secondary" : "ghost"}
                      size="sm"
                      aria-pressed={c.isAchieved}
                      onClick={() => toggleCompetency(c.id)}
                      className={cn(
                        "w-28 justify-center",
                        c.isAchieved
                          ? "text-success-ink"
                          : "text-muted-foreground",
                      )}
                    >
                      {c.isAchieved && <RiCheckLine data-icon="inline-start" />}
                      {c.isAchieved ? t("achieved") : t("notYet")}
                    </Button>
                  ) : (
                    <Badge variant={c.isAchieved ? "success" : "secondary"}>
                      {c.isAchieved ? t("achieved") : t("notYet")}
                    </Badge>
                  )}
                </div>
              </ListRow>
            ))}
          </GroupedList>
        )}
      </section>

      {canEdit && (
        <div className="bg-popover border-border sticky bottom-0 mt-4 flex justify-end gap-2 border-t py-3">
          <Button onClick={save} disabled={saving || !dirty}>
            {saving ? tc("saving") : dirty ? t("saveScores") : t("saved")}
          </Button>
        </div>
      )}
    </div>
  )
}

/** A section title, its count or note on the right, and the long legend
 *  behind an info icon instead of a line of small print. */
function SectionHead({
  title,
  hint,
  extra,
}: {
  title: string
  hint?: string
  extra?: string
}) {
  return (
    <div className="flex items-center justify-between gap-x-4 pt-6 pb-3">
      <div className="flex min-w-0 items-center gap-1.5">
        <h2 className="text-foreground truncate text-sm">{title}</h2>
        {hint && (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={hint}
                  className="text-tertiary-foreground hover:text-muted-foreground -m-1 p-1 outline-none"
                />
              }
            >
              <RiInformationLine className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent className="max-w-64">{hint}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {extra && (
        <p className="text-muted-foreground shrink-0 text-[13px] tabular-nums">
          {extra}
        </p>
      )}
    </div>
  )
}

/** The sheet's two scores side by side, each with a thin bar; a dash and
 *  "not scored" while there's nothing yet. */
function SheetScores({
  sla,
  quality,
}: {
  sla: number | null
  quality: number | null
}) {
  const t = useT("performance")
  return (
    <div className="border-border grid grid-cols-2 gap-6 border-b py-5">
      {[
        { label: t("partSla"), value: sla },
        { label: t("partQuality"), value: quality },
      ].map(({ label, value }) => (
        <div key={label} className="flex min-w-0 flex-col gap-2">
          <span className="text-muted-foreground text-sm">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-foreground text-2xl font-normal tracking-tight tabular-nums">
              {value === null ? <EmptyValue /> : formatPercent(value, 1)}
            </span>
            <RatingChip score={value} />
          </div>
          <div className="bg-foreground/8 h-1 overflow-hidden rounded-full">
            {value !== null && (
              <div
                className="bg-blue-9 h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
              />
            )}
          </div>
          {value === null && (
            <span className="text-tertiary-foreground text-xs">
              {t("notScored")}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/** The project's facts as label / value rows (status, span, scored
 *  quarters, join day, tasks) instead of a wrap of chips. */
function SheetProperties({
  scoring,
  project,
  scoredQuarters,
}: {
  scoring: ProjectScoring
  project: NonNullable<ProjectScoring["project"]>
  scoredQuarters: Set<string>
}) {
  const t = useT("performance")
  const locale = useDateLocale()
  const today = scoring.today
  const archived = project.status === "Archived"
  const completed = project.status === "Completed"
  const running = !archived && !completed
  const pastEnd =
    running && today > project.end ? daysBetween(project.end, today) : 0
  const month = (d: string) => format(parseISO(d), "MMM yyyy", { locale })
  const tasks = scoring.tasks
  const scored = [...scoredQuarters].sort()

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: t("status"),
      value: (
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant={archived ? "outline" : completed ? "success" : "info"}
          >
            {archived
              ? t("statusArchived")
              : completed
                ? t("statusCompleted")
                : t("statusActive")}
          </Badge>
          {pastEnd > 0 && (
            <Badge variant="warning">{t("psPastEnd", { n: pastEnd })}</Badge>
          )}
        </span>
      ),
    },
    {
      label: t("psSpan"),
      value: (
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          {month(project.start)}
          <RiArrowRightLine className="text-tertiary-foreground size-3.5" />
          {month(project.end)}
        </span>
      ),
    },
    ...(scored.length > 0
      ? [
          {
            label: t("psScoredIn"),
            value: scored.map((q) => quarterLabel(t, q)).join(", "),
          },
        ]
      : []),
    ...(project.client
      ? [{ label: t("psClient"), value: project.client }]
      : []),
    ...(scoring.joinedOn
      ? [
          {
            label: t("psJoined"),
            value: format(parseISO(scoring.joinedOn), "d MMM yyyy", { locale }),
          },
        ]
      : []),
    ...(tasks
      ? [
          {
            label: t("psTasksShort"),
            value:
              tasks.total === 0 ? (
                <span className="text-tertiary-foreground">
                  {t("psNoTasks")}
                </span>
              ) : (
                <span className="tabular-nums">
                  {t("psTasksDone", { done: tasks.done, total: tasks.total })}
                  {tasks.openOverdue > 0 && (
                    <span className="text-warning">
                      {" · "}
                      {t("psTasksOverdue", { n: tasks.openOverdue })}
                    </span>
                  )}
                </span>
              ),
          },
        ]
      : []),
  ]

  return (
    <dl className="border-border grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 border-b py-5 text-sm">
      {rows.map(({ label, value }) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-foreground min-w-0">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** "Not scored yet" for a section: a quiet line. */
function NotScored({ children }: { children: React.ReactNode }) {
  return <p className="text-tertiary-foreground pb-1 text-[13px]">{children}</p>
}

/** Quarters that receive a score from this project for this member. */
function scoredQuarters(scoring: ProjectScoring, phaseMode: boolean) {
  const set = new Set<string>()
  if (phaseMode) {
    for (const ms of scoring.phaseMilestones)
      if (ms.state === "scored" && ms.quarter) set.add(ms.quarter)
  } else if (scoring.slaScored && scoring.project?.quarter) {
    set.add(scoring.project.quarter)
  }
  if (scoring.qualityQuarter && scoring.qualityScored)
    set.add(scoring.qualityQuarter)
  return set
}

/** The project's phases as this member's milestones. */
function PhaseMilestones({
  assignmentId,
  employeeName,
  projectId,
  scoring,
  canEdit,
  isStakeholder,
  onChanged,
}: {
  assignmentId: string
  employeeName: string
  projectId: string
  scoring: ProjectScoring
  canEdit: boolean
  isStakeholder: boolean
  onChanged: () => void
}) {
  const t = useT("performance")
  const projectLink = useProjectHref(projectId)
  const locale = useDateLocale()
  const grid = canEdit ? PHASE_GRID_EDIT : PHASE_GRID
  const day = (d: string | null) =>
    d ? format(parseISO(d), "d MMM yyyy", { locale }) : null
  const overrides = new Map(scoring.overrides.map((o) => [o.phaseId, o]))

  return (
    <section className="flex flex-col">
      <SectionHead title={t("psPhaseMilestones")} hint={t("psPhaseLegend")} />
      <GroupedList hover={canEdit}>
        <ListColumns grid={grid}>
          <span>{t("psPhase")}</span>
          <span className="text-right">{t("weight")}</span>
          <span className="hidden sm:block">{t("psDue")}</span>
          <span className="hidden sm:block">{t("psDone")}</span>
          <span>{t("result")}</span>
          <span className="hidden sm:block">{t("psCountsIn")}</span>
          {canEdit && <span className="sr-only">{t("psAdjust")}</span>}
        </ListColumns>
        {scoring.phaseMilestones.map((ms) => (
          <ListRow
            key={ms.phaseId ?? ms.name}
            className={cn(grid, "min-h-12 text-[13px]")}
          >
            <div className="flex min-w-0 flex-col">
              <span className="text-foreground truncate">{ms.name}</span>
              <span className="text-tertiary-foreground truncate tabular-nums sm:hidden">
                {[day(ms.due), ms.done && `✓ ${day(ms.done)}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <span className="text-muted-foreground text-right tabular-nums">
              {Math.round(ms.weight * 10) / 10}%
            </span>
            <span className="text-muted-foreground hidden tabular-nums sm:block">
              {orEmpty(day(ms.due))}
            </span>
            <span className="text-muted-foreground hidden tabular-nums sm:block">
              {orEmpty(day(ms.done))}
            </span>
            <ResultCell milestone={ms} />
            <span className="text-foreground hidden tabular-nums sm:block">
              {ms.quarter ? quarterLabel(t, ms.quarter) : <EmptyValue />}
            </span>
            {canEdit &&
              (ms.phaseId && ms.state !== "beforeJoin" ? (
                <OverrideEditor
                  assignmentId={assignmentId}
                  employeeName={employeeName}
                  milestone={ms}
                  override={overrides.get(ms.phaseId) ?? null}
                  today={scoring.today}
                  onChanged={onChanged}
                />
              ) : (
                <span />
              ))}
          </ListRow>
        ))}
        {/* A div: the link's animated icon renders a div. */}
        <div className="text-muted-foreground gutter-x flex flex-wrap items-center gap-x-2 pt-2 text-xs">
          {t("psWeightNote")}
          {isStakeholder && (
            <Link
              href={projectLink}
              className="text-primary inline-flex items-center gap-1 hover:underline"
            >
              {t("psEditPhases")}
              <RiExternalLinkLine className="size-3" />
            </Link>
          )}
        </div>
      </GroupedList>
    </section>
  )
}

/** Result chip with automatic / adjusted marker, or the milestone's state. */
function ResultCell({ milestone: ms }: { milestone: Milestone }) {
  const t = useT("performance")
  if (ms.state === "pending")
    return (
      <span className="text-tertiary-foreground truncate">
        {t("psPending")}
      </span>
    )
  if (ms.state === "noDue")
    return (
      <span className="text-tertiary-foreground truncate">{t("psNoDue")}</span>
    )
  if (ms.state === "beforeJoin")
    return (
      <span className="text-tertiary-foreground truncate">
        {t("psBeforeJoin")}
      </span>
    )
  if (!ms.result) return <EmptyValue />

  const chip = (
    <Badge variant={RESULT_VARIANTS[ms.result]}>
      {t(SLA_RESULT_LABELS[ms.result])}
    </Badge>
  )
  if (ms.source === "override")
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        {chip}
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="text-info decoration-info/40 cursor-help truncate underline decoration-dotted underline-offset-2" />
            }
          >
            {t("psAdjusted")}
          </TooltipTrigger>
          <TooltipContent className="whitespace-pre-wrap">
            {t("psAdjustedReason", { reason: ms.reason ?? "" })}
          </TooltipContent>
        </Tooltip>
      </div>
    )
  if (ms.overdueDays > 0 && !ms.done)
    return (
      <span className="text-warning truncate tabular-nums">
        {t("psOverdueAuto", {
          n: ms.overdueDays,
          result: t(SLA_RESULT_LABELS.Delay),
        })}
      </span>
    )
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {chip}
      <span className="text-tertiary-foreground truncate">{t("psAuto")}</span>
    </div>
  )
}

/** Popover to set or remove this member's result for one phase. */
function OverrideEditor({
  assignmentId,
  employeeName,
  milestone: ms,
  override,
  today,
  onChanged,
}: {
  assignmentId: string
  employeeName: string
  milestone: Milestone
  override: PhaseOverride | null
  today: string
  onChanged: () => void
}) {
  const t = useT("performance")
  const tc = useT("common")
  const auto = phaseResult(ms.due, ms.done, today)
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<SLAResult>(
    override?.result ?? auto ?? "On Time",
  )
  const [reason, setReason] = useState(override?.reason ?? "")
  const [busy, setBusy] = useState(false)

  const onOpenChange = (next: boolean) => {
    if (next) {
      setResult(override?.result ?? auto ?? "On Time")
      setReason(override?.reason ?? "")
    }
    setOpen(next)
  }

  const submit = async (remove: boolean) => {
    if (!ms.phaseId) return
    if (!remove && !reason.trim()) {
      toast.error(t("psReasonRequired"))
      return
    }
    setBusy(true)
    const res = await savePhaseOverride(
      assignmentId,
      ms.phaseId,
      remove ? null : { result, reason },
    )
    setBusy(false)
    if (!res.success) {
      toast.error(res.error ?? t("psOverrideFailed"))
      return
    }
    toast.success(t(remove ? "psOverrideRemoved" : "psOverrideSaved"))
    setOpen(false)
    onChanged()
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              "rounded-full",
              override ? "text-info" : "text-muted-foreground",
            )}
            aria-label={t("psAdjustOf", { name: ms.name })}
          />
        }
      >
        <RiPencilLine className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle className="text-sm">
            {t("psAdjustOf", { name: ms.name })}
          </PopoverTitle>
          <PopoverDescription className="text-[13px]">
            {auto
              ? t("psAdjustDescription", {
                  member: employeeName,
                  auto: t(SLA_RESULT_LABELS[auto]),
                })
              : t("psAdjustDescriptionNoAuto", { member: employeeName })}
          </PopoverDescription>
        </PopoverHeader>
        <div
          role="radiogroup"
          aria-label={t("result")}
          className="bg-muted flex gap-1 rounded-full p-1"
        >
          {RESULTS.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={result === r}
              onClick={() => setResult(r)}
              className={cn(
                "h-7 flex-1 rounded-full text-[13px] transition-colors",
                result === r
                  ? "bg-background text-foreground shadow-(--elev-1)"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(SLA_RESULT_LABELS[r])}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-[13px]">
            {t("psReason")}
          </span>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("psReasonPlaceholder")}
            rows={3}
            className="text-[13px]"
          />
        </label>
        <div className="flex items-center justify-between gap-2">
          {override ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => submit(true)}
            >
              {t("psRemoveOverride")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button
              size="sm"
              disabled={busy || !reason.trim()}
              onClick={() => submit(false)}
            >
              {busy ? tc("saving") : tc("save")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Per quarter: the SLA this project adds and whether quality counts there. */
function Contribution({
  scoring,
  quality,
}: {
  scoring: ProjectScoring
  quality: number | null
}) {
  const t = useT("performance")
  const qq = scoring.qualityQuarter
  const rows = useMemo(() => {
    const byQuarter = new Map<string, Milestone[]>()
    for (const ms of scoring.phaseMilestones) {
      if (ms.state !== "scored" || !ms.quarter) continue
      byQuarter.set(ms.quarter, [...(byQuarter.get(ms.quarter) ?? []), ms])
    }
    if (qq && !byQuarter.has(qq)) byQuarter.set(qq, [])
    return [...byQuarter.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, list]) => ({
        quarter,
        count: list.length,
        sla: slaPercent(slaRows(list)),
      }))
  }, [scoring.phaseMilestones, qq])
  const archived = scoring.project?.status === "Archived"

  return (
    <section className="flex flex-col">
      <SectionHead
        title={t("psContribution")}
        hint={t("psContributionLegend")}
      />
      {rows.length === 0 ? (
        <p className="text-muted-foreground border-t py-6 text-[13px]">
          {t("psNothingScored")} {t("psQualityAtHandover")}
        </p>
      ) : (
        <GroupedList hover={false}>
          <ListColumns grid={CONTRIBUTION_GRID}>
            <span>{t("quarter")}</span>
            <span>{t("partSla")}</span>
            <span className="hidden sm:block">{t("milestone")}</span>
            <span className="text-right sm:text-left">{t("partQuality")}</span>
          </ListColumns>
          {rows.map((row) => (
            <ListRow
              key={row.quarter}
              className={cn(
                CONTRIBUTION_GRID,
                "min-h-11 text-[13px]",
                archived && "opacity-60",
              )}
            >
              <span className="text-foreground tabular-nums">
                {quarterLabel(t, row.quarter)}
              </span>
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-foreground w-14 tabular-nums">
                  {orEmpty(row.sla === null ? null : formatPercent(row.sla, 1))}
                </span>
                {row.sla !== null && (
                  <div className="bg-muted hidden h-1.5 max-w-40 flex-1 overflow-hidden rounded-full sm:block">
                    <m.div
                      className="bg-blue-9/70 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, row.sla / 1.2)}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>
              <span className="text-muted-foreground hidden tabular-nums sm:block">
                {row.count ? (
                  t("psMilestoneCount", { n: row.count })
                ) : (
                  <EmptyValue />
                )}
              </span>
              <span className="text-right sm:text-left">
                {row.quarter === qq ? (
                  <span className="text-foreground inline-flex items-center gap-1.5 tabular-nums">
                    <RiCheckLine className="text-success-ink size-3.5" />
                    {quality === null
                      ? t("psQualityCounts")
                      : formatPercent(quality, 1)}
                  </span>
                ) : (
                  <EmptyValue />
                )}
              </span>
            </ListRow>
          ))}
          <p className="text-muted-foreground gutter-x pt-2 text-xs">
            {archived
              ? t("psArchivedExcluded")
              : qq
                ? t("psQualityIn", { quarter: quarterLabel(t, qq) })
                : t("psQualityAtHandover")}
          </p>
        </GroupedList>
      )}
    </section>
  )
}

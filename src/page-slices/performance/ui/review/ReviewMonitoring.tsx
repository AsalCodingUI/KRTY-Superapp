"use client"

import { DateField } from "@/components/date-field"
import { orEmpty } from "@/components/empty-value"
import {
  closeReviewCycle,
  getReviewMonitoring,
  getReviewSummary,
  saveReviewCycle,
  type MonitoringRow,
} from "@/app/(main)/performance/actions/review-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { formatPercent } from "@/entities/performance/lib/kpi"
import {
  daysLeft,
  latestCloseDay,
  quarterBounds,
  wibDay,
} from "@/entities/performance/lib/review-cycle"
import { RiGroupLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"
import { useState } from "react"
import { toast } from "sonner"
import { isQuarter, periodLabel } from "../kpi/period"
import { GridGroup, ListColumns, PersonCell, StatBand } from "../list"
import { CycleStatusBadge, useCycleRange } from "./cycle-status"
import { ReviewResult } from "./ReviewResult"

/** Shared column template so the header, group summaries and rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_3.5rem_5.5rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_12rem_4.5rem_5.5rem]"

const MAX_FACES = 5

/**
 * Who reviews this person, as faces: the ones who are done in full colour,
 * the ones still to review faded. Names and status on hover.
 */
function ReviewerStack({
  reviewers,
}: {
  reviewers: MonitoringRow["reviewers"]
}) {
  const t = useT("performance")
  const sorted = [...reviewers].sort((a, b) => Number(b.done) - Number(a.done))
  // A few faces, then "+N", so a big team doesn't push the count over.
  const shown = sorted.slice(0, MAX_FACES)
  const more = sorted.length - shown.length
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            aria-label={t("reviewers")}
            className="avatar-stack hidden items-center -space-x-1 [--avatar-overlap:4px] md:flex"
          />
        }
      >
        {shown.map((r) => (
          <Avatar
            key={r.id}
            className={cn("size-6", !r.done && "opacity-50 grayscale")}
          >
            <AvatarImage src={r.avatar_url || undefined} alt="" />
            <AvatarFallback className="text-[10px]">
              {(r.full_name || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {more > 0 && (
          <span className="text-muted-foreground pl-2 text-[11px] tabular-nums">
            +{more}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent className="flex flex-col gap-0.5">
        {sorted.map((r) => (
          <span key={r.id} className="flex justify-between gap-4">
            <span>{r.full_name || t("unknown")}</span>
            <span className="opacity-60">
              {t(r.done ? "reviewerDone" : "reviewerPending")}
            </span>
          </span>
        ))}
      </TooltipContent>
    </Tooltip>
  )
}

type Status = "processed" | "complete" | "progress" | "waiting"

const STATUS_GROUPS: { key: Status; label: MessageKey<"performance"> }[] = [
  { key: "complete", label: "groupReady" },
  { key: "progress", label: "groupInProgress" },
  { key: "waiting", label: "groupWaiting" },
  { key: "processed", label: "groupProcessed" },
]

function statusOf(row: MonitoringRow): Status {
  if (row.summary) return "processed"
  const done = row.reviewers.filter((r) => r.done).length
  if (done === 0) return "waiting"
  return done >= row.reviewers.length ? "complete" : "progress"
}

/** Admin 360: the period for this quarter and everyone's progress. */
export function ReviewMonitoring({ period }: { period: string }) {
  const t = useT("performance")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const cycleRange = useCycleRange()
  const queryClient = useQueryClient()
  const quarter = isQuarter(period)
  const { data, isLoading } = useQuery({
    queryKey: ["review-monitoring", period],
    queryFn: () => getReviewMonitoring(period),
    enabled: quarter,
  })
  const [periodOpen, setPeriodOpen] = useState(false)
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [processingAll, setProcessingAll] = useState(false)
  const [closing, setClosing] = useState(false)
  const [processing, setProcessing] = useState<MonitoringRow | null>(null)
  const [viewing, setViewing] = useState<MonitoringRow | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["review-monitoring", period] })

  const { data: viewingSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["review-summary", viewing?.id, period],
    queryFn: () => getReviewSummary(viewing!.id, period),
    enabled: Boolean(viewing),
  })

  if (!quarter) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        {t("review360ManagedPerQuarter")}
      </p>
    )
  }
  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }

  const { cycle, rows, unpaired } = data

  // The admin sets both dates (WIB days): the start inside the quarter, the
  // close inside it or a little after (reopening for late reviewers).
  const bounds = quarterBounds(period)
  const lastClose = latestCloseDay(period)
  const clampToQuarter = (day: string) =>
    day < bounds.start ? bounds.start : day > bounds.end ? bounds.end : day

  const openPeriodForm = () => {
    // A new period: from today (in the quarter) to the quarter's last day.
    setStart(
      clampToQuarter(cycle ? wibDay(cycle.start_date) : wibDay(new Date())),
    )
    setEnd(cycle ? wibDay(cycle.end_date) : bounds.end)
    setPeriodOpen(true)
  }
  const periodInvalid = !start || !end || end < start

  const savePeriod = async () => {
    if (periodInvalid) {
      toast.error(t("errEndBeforeStart360"))
      return
    }
    setBusy(true)
    const result = await saveReviewCycle(period, start, end)
    setBusy(false)
    if (!result.success) {
      toast.error(result.error ?? t("periodSaveFailed"))
      return
    }
    toast.success(
      cycle
        ? t("periodUpdated")
        : start > wibDay(new Date())
          ? t("period360Scheduled")
          : t("period360Opened"),
    )
    setPeriodOpen(false)
    refresh()
  }

  const closePeriod = async () => {
    const result = await closeReviewCycle(period)
    if (!result.success) {
      toast.error(result.error ?? t("periodCloseFailed"))
      return
    }
    toast.success(t("period360Closed"))
    refresh()
  }

  /** Process one person: the AI (n8n) writes the feedback and the result is
   *  saved; the scores are computed from the reviews in the database. Waits
   *  for the answer (about 30 seconds), so a failure shows right away. */
  const processOne = async (row: MonitoringRow) => {
    if (!cycle) return { ok: false, error: t("aiSendFailed") }
    const res = await fetch("/api/trigger-n8n", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewee_id: row.id, cycle_id: cycle.id }),
    }).catch(() => null)
    if (res?.ok) return { ok: true }
    const body = (await res?.json().catch(() => null)) as {
      error?: string
    } | null
    return { ok: false, error: body?.error ?? t("aiSendFailed") }
  }

  const process = async () => {
    const row = processing
    if (!row) return
    const id = toast.loading(t("processingOne", { name: row.full_name ?? "" }))
    const result = await processOne(row)
    if (result.ok) toast.success(t("resultReady"), { id })
    else toast.error(result.error, { id })
    refresh()
  }

  const processAll = async () => {
    const ready = rows.filter((r) => statusOf(r) === "complete")
    const id = toast.loading(t("processingMany", { done: 0, n: ready.length }))
    let failed = 0
    // One at a time: each AI call takes a while, and results show as they land.
    for (const [i, row] of ready.entries()) {
      if (!(await processOne(row)).ok) failed++
      toast.loading(t("processingMany", { done: i + 1, n: ready.length }), {
        id,
      })
      refresh()
    }
    if (failed) toast.error(t("processAllFailed", { n: failed }), { id })
    else toast.success(t("resultsReady", { n: ready.length }), { id })
  }

  const reviewsDone = rows.reduce(
    (n, r) => n + r.reviewers.filter((x) => x.done).length,
    0,
  )
  const reviewsTotal = rows.reduce((n, r) => n + r.reviewers.length, 0)

  const countOf = (status: Status) =>
    rows.filter((r) => statusOf(r) === status).length

  return (
    <div className="flex flex-col">
      {/* The period: what it is and when it runs, with its controls. */}
      <div className="bleed gutter-x border-border flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b py-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-foreground text-base font-medium">
              {t("periodOf", { period: periodLabel(period, t) })}
            </h2>
            {cycle && <CycleStatusBadge status={cycle.status} />}
          </div>
          <p className="text-muted-foreground text-sm">
            {cycle ? (
              <>
                <span className="tabular-nums">{cycleRange(cycle)}</span>
                {cycle.status === "running" && (
                  <>
                    {" · "}
                    {daysLeft(cycle.end_date) === 0
                      ? t("cycleClosesToday")
                      : t("cycleDaysLeft", { n: daysLeft(cycle.end_date) })}
                  </>
                )}
              </>
            ) : (
              t("cycleNotOpened")
            )}
            {" · "}
            {t("everyoneReviewsNote")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(cycle?.status === "scheduled" || cycle?.status === "running") && (
            <Button variant="ghost" onClick={() => setClosing(true)}>
              {t("closeNow")}
            </Button>
          )}
          <Button
            variant={cycle ? "outline" : "default"}
            onClick={openPeriodForm}
          >
            {cycle
              ? cycle.status === "closed"
                ? t("reopen")
                : t("changePeriod")
              : t("openPeriod")}
          </Button>
        </div>
      </div>

      <StatBand
        stats={[
          {
            label: t("reviewsReceived"),
            value: `${reviewsDone} / ${reviewsTotal}`,
          },
          { label: t("groupReady"), value: countOf("complete") },
          { label: t("groupProcessed"), value: countOf("processed") },
        ]}
        aside={
          countOf("complete") > 0 && (
            <Button variant="outline" onClick={() => setProcessingAll(true)}>
              {t("processAll", { n: countOf("complete") })}
            </Button>
          )
        }
      />

      {rows.length === 0 && unpaired.length === 0 ? (
        <EmptyState
          title={t("noEmployees")}
          icon={<RiGroupLine className="size-5" />}
          placement="inner"
        />
      ) : (
        <GroupedList>
          <ListColumns grid={ROW_GRID}>
            <span>{t("employee")}</span>
            <span className="text-right">{t("reviewers")}</span>
            <span className="hidden text-right md:block">{t("result")}</span>
            <span />
          </ListColumns>
          {STATUS_GROUPS.map(({ key, label }) => {
            const items = rows.filter((r) => statusOf(r) === key)
            if (items.length === 0) return null
            const groupDone = items.reduce(
              (n, r) => n + r.reviewers.filter((x) => x.done).length,
              0,
            )
            const groupTotal = items.reduce((n, r) => n + r.reviewers.length, 0)
            return (
              <GridGroup
                key={key}
                grid={ROW_GRID}
                label={t(label)}
                extra={
                  <span className="text-tertiary-foreground tabular-nums">
                    {items.length}
                  </span>
                }
                defaultOpen={
                  key !== "processed" || items.length === rows.length
                }
                summary={
                  <>
                    <span className="text-muted-foreground text-right text-[13px] tabular-nums">
                      {groupDone}/{groupTotal}
                    </span>
                    <span className="hidden md:block" />
                    <span />
                  </>
                }
              >
                {items.map((row) => {
                  const done = row.reviewers.filter((r) => r.done).length
                  return (
                    <ListRow key={row.id} className={cn(ROW_GRID, "min-h-14")}>
                      <PersonCell
                        name={row.full_name}
                        avatarUrl={row.avatar_url}
                      />
                      <div className="flex items-center justify-end gap-3">
                        <ReviewerStack reviewers={row.reviewers} />
                        <span className="whitespace-nowrap tabular-nums">
                          {done}
                          <span className="text-muted-foreground">
                            {" "}
                            / {row.reviewers.length}
                          </span>
                        </span>
                      </div>
                      <span className="hidden text-right tabular-nums md:block">
                        {orEmpty(
                          row.summary
                            ? formatPercent(row.summary.overall_percentage)
                            : null,
                        )}
                      </span>
                      <div className="flex justify-end">
                        {row.summary ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewing(row)}
                          >
                            {t("view")}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={key === "complete" ? "secondary" : "ghost"}
                            disabled={done === 0 || !cycle}
                            onClick={() => setProcessing(row)}
                          >
                            {t("process")}
                          </Button>
                        )}
                      </div>
                    </ListRow>
                  )
                })}
              </GridGroup>
            )
          })}
          {unpaired.length > 0 && (
            <GridGroup
              grid={ROW_GRID}
              label={t("unpairedGroup")}
              extra={
                <span className="text-tertiary-foreground tabular-nums">
                  {unpaired.length}
                </span>
              }
              summary={
                <span className="text-tertiary-foreground col-span-2 hidden text-right text-[13px] sm:block md:col-span-3">
                  {t("needTwoEmployees")}
                </span>
              }
            >
              {unpaired.map((person) => (
                <ListRow key={person.id} className={cn(ROW_GRID, "min-h-14")}>
                  <PersonCell
                    name={person.full_name}
                    avatarUrl={person.avatar_url}
                    secondary={person.job_title}
                  />
                </ListRow>
              ))}
            </GridGroup>
          )}
        </GroupedList>
      )}

      <Dialog open={periodOpen} onOpenChange={setPeriodOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {cycle ? t("period360") : t("openPeriod360")} ·{" "}
              {periodLabel(period, t)}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cycle-start">{t("startDate")}</Label>
                <DateField
                  id="cycle-start"
                  value={start}
                  min={bounds.start}
                  max={bounds.end}
                  onChange={(day) => {
                    setStart(day)
                    if (end && day > end) setEnd(day)
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cycle-end">{t("closeDate")}</Label>
                <DateField
                  id="cycle-end"
                  value={end}
                  min={start || bounds.start}
                  max={lastClose}
                  onChange={setEnd}
                />
              </div>
            </div>
            {start && end && (
              <p
                className={cn(
                  "text-xs",
                  periodInvalid ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {periodInvalid
                  ? t("errEndBeforeStart360")
                  : t("periodWindowHint", {
                      start: format(parseISO(start), "d MMM", {
                        locale: dateLocale,
                      }),
                      end: format(parseISO(end), "d MMM yyyy", {
                        locale: dateLocale,
                      }),
                    })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button onClick={savePeriod} disabled={busy || periodInvalid}>
              {busy ? tc("saving") : cycle ? tc("save") : t("openPeriod")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={closing}
        onOpenChange={setClosing}
        title={t("closePeriod360Title")}
        description={t("closePeriod360Description")}
        confirmText={t("closePeriod")}
        cancelText={tc("cancel")}
        onConfirm={closePeriod}
      />

      <ConfirmDialog
        open={Boolean(processing)}
        onOpenChange={(open) => !open && setProcessing(null)}
        title={t("processResultOf", { name: processing?.full_name ?? "" })}
        description={
          processing
            ? t("processDescription", {
                done: processing.reviewers.filter((r) => r.done).length,
                total: processing.reviewers.length,
              })
            : ""
        }
        confirmText={t("process")}
        cancelText={tc("cancel")}
        onConfirm={process}
      />

      <ConfirmDialog
        open={processingAll}
        onOpenChange={setProcessingAll}
        title={t("processAllTitle", { n: countOf("complete") })}
        description={t("processAllDescription")}
        confirmText={t("process")}
        cancelText={tc("cancel")}
        onConfirm={processAll}
      />

      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
      >
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {t("result360Of", {
                name: viewing?.full_name ?? "",
                period: periodLabel(period, t),
              })}
            </DialogTitle>
          </DialogHeader>
          {summaryLoading ? (
            <div className="flex justify-center py-10">
              <Spinner className="size-6" />
            </div>
          ) : viewingSummary ? (
            <ReviewResult summary={viewingSummary} />
          ) : (
            <p className="text-muted-foreground text-sm">{t("noResult")}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

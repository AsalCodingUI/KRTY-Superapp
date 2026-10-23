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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { formatPercent } from "@/entities/performance/lib/kpi"
import { RiGroupLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"
import { useState } from "react"
import { toast } from "sonner"
import { isQuarter, periodLabel } from "../kpi/period"
import { GridGroup, ListColumns, PersonCell, StatBand } from "../list"
import { ReviewResult } from "./ReviewResult"

/** Shared column template so the header, group summaries and rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_3.5rem_5.5rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_5.5rem]"

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

/** Quarter dates in WIB as yyyy-MM-dd for the period form. */
function quarterDates(quarter: string) {
  const [year, q] = quarter.split("-Q").map(Number)
  const start = new Date(year, (q - 1) * 3, 1)
  const end = new Date(year, q * 3, 0)
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  }
}

/** Admin 360: the period for this quarter and everyone's progress. */
export function ReviewMonitoring({ period }: { period: string }) {
  const t = useT("performance")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const queryClient = useQueryClient()
  const quarter = isQuarter(period)
  const { data, isLoading } = useQuery({
    queryKey: ["review-monitoring", period],
    queryFn: () => getReviewMonitoring(period),
    enabled: quarter,
  })
  const [periodOpen, setPeriodOpen] = useState(false)
  const [dates, setDates] = useState({ start: "", end: "" })
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

  const openPeriodForm = () => {
    setDates(
      cycle
        ? {
            start: format(new Date(cycle.start_date), "yyyy-MM-dd"),
            end: format(new Date(cycle.end_date), "yyyy-MM-dd"),
          }
        : {
            start: format(new Date(), "yyyy-MM-dd"),
            end: quarterDates(period).end,
          },
    )
    setPeriodOpen(true)
  }

  const savePeriod = async () => {
    setBusy(true)
    const result = await saveReviewCycle(period, dates.start, dates.end)
    setBusy(false)
    if (!result.success) {
      toast.error(result.error ?? t("periodSaveFailed"))
      return
    }
    toast.success(cycle ? t("periodUpdated") : t("period360Opened"))
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

  const process = async () => {
    if (!processing || !cycle) return
    const res = await fetch("/api/trigger-n8n", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewee_id: processing.id, cycle_id: cycle.id }),
    }).catch(() => null)
    if (!res?.ok) {
      toast.error(t("aiSendFailed"))
      return
    }
    toast.success(t("processingStarted"))
    setTimeout(refresh, 8000)
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
      <StatBand
        stats={[
          {
            label: t("periodOf", { period: periodLabel(period, t) }),
            value: cycle
              ? cycle.isOpen
                ? t("cycleOpen")
                : t("cycleClosed")
              : t("cycleNotOpened"),
          },
          {
            label: t("dates"),
            value: cycle
              ? `${format(new Date(cycle.start_date), "d MMM", { locale: dateLocale })} – ${format(new Date(cycle.end_date), "d MMM yyyy", { locale: dateLocale })}`
              : "—",
          },
          {
            label: t("reviewsReceived"),
            value: `${reviewsDone} / ${reviewsTotal}`,
          },
          { label: t("groupReady"), value: countOf("complete") },
          { label: t("groupProcessed"), value: countOf("processed") },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
        <p className="text-muted-foreground text-sm">
          {t("everyoneReviewsNote")}
        </p>
        <div className="flex items-center gap-2">
          {cycle?.is_active && (
            <Button variant="ghost" onClick={() => setClosing(true)}>
              {t("closePeriod")}
            </Button>
          )}
          <Button
            variant={cycle ? "outline" : "default"}
            onClick={openPeriodForm}
          >
            {cycle
              ? cycle.is_active
                ? t("changeDates")
                : t("reopen")
              : t("openPeriod")}
          </Button>
        </div>
      </div>

      {rows.length === 0 && unpaired.length === 0 ? (
        <EmptyState
          title={t("noEmployees")}
          description={t("noEmployeesDescription")}
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
                  const pending = row.reviewers.filter((r) => !r.done)
                  return (
                    <ListRow key={row.id} className={cn(ROW_GRID, "min-h-14")}>
                      <div
                        className="min-w-0"
                        title={row.reviewers
                          .map((r) => `${r.full_name}${r.done ? " ✓" : ""}`)
                          .join(", ")}
                      >
                        <PersonCell
                          name={row.full_name}
                          avatarUrl={row.avatar_url}
                          secondary={
                            pending.length
                              ? t("waitingFor", {
                                  names: pending
                                    .map((r) => r.full_name)
                                    .join(", "),
                                })
                              : t("reviewedBy", {
                                  names: row.reviewers
                                    .map((r) => r.full_name)
                                    .join(", "),
                                })
                          }
                        />
                      </div>
                      <span className="text-right tabular-nums">
                        {done}
                        <span className="text-muted-foreground">
                          {" "}
                          / {row.reviewers.length}
                        </span>
                      </span>
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
            <DialogDescription>
              {t("periodDialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cycle-start">{t("start")}</Label>
              <DateField
                id="cycle-start"
                value={dates.start}
                onChange={(value) => setDates((d) => ({ ...d, start: value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cycle-end">{t("end")}</Label>
              <DateField
                id="cycle-end"
                value={dates.end}
                min={dates.start}
                onChange={(value) => setDates((d) => ({ ...d, end: value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button onClick={savePeriod} disabled={busy}>
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

      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
      >
        <DialogContent className="sm:max-w-3xl">
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

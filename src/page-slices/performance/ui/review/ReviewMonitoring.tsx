"use client"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { formatPercent } from "@/entities/performance/lib/kpi"
import { RiGroupLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useState } from "react"
import { toast } from "sonner"
import { isQuarter, periodLabel } from "../kpi/period"
import { GridGroup, ListColumns, PersonCell, StatBand } from "../list"
import { ReviewResult } from "./ReviewResult"

/** Shared column template so the header, group summaries and rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_3.5rem_5.5rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_5.5rem]"

type Status = "processed" | "complete" | "progress" | "waiting"

const STATUS_GROUPS: { key: Status; label: string }[] = [
  { key: "complete", label: "Siap diproses" },
  { key: "progress", label: "Masih berjalan" },
  { key: "waiting", label: "Belum ada penilaian" },
  { key: "processed", label: "Sudah diproses" },
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
        360 review dikelola per kuartal. Pilih salah satu kuartal di atas.
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
      toast.error(result.error ?? "Gagal menyimpan periode.")
      return
    }
    toast.success(cycle ? "Periode diperbarui" : "Periode 360 dibuka")
    setPeriodOpen(false)
    refresh()
  }

  const closePeriod = async () => {
    const result = await closeReviewCycle(period)
    if (!result.success) {
      toast.error(result.error ?? "Gagal menutup periode.")
      return
    }
    toast.success("Periode 360 ditutup")
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
      toast.error("Gagal mengirim ke AI. Coba lagi.")
      return
    }
    toast.success("Sedang diproses. Hasil muncul beberapa saat lagi.")
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
            label: `Periode ${periodLabel(period)}`,
            value: cycle
              ? cycle.isOpen
                ? "Dibuka"
                : "Ditutup"
              : "Belum dibuka",
          },
          {
            label: "Tanggal",
            value: cycle
              ? `${format(new Date(cycle.start_date), "d MMM", { locale: idLocale })} – ${format(new Date(cycle.end_date), "d MMM yyyy", { locale: idLocale })}`
              : "—",
          },
          {
            label: "Penilaian masuk",
            value: `${reviewsDone} / ${reviewsTotal}`,
          },
          { label: "Siap diproses", value: countOf("complete") },
          { label: "Sudah diproses", value: countOf("processed") },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
        <p className="text-muted-foreground text-sm">
          Semua karyawan saling menilai; admin tidak ikut.
        </p>
        <div className="flex items-center gap-2">
          {cycle?.is_active && (
            <Button variant="ghost" onClick={() => setClosing(true)}>
              Tutup periode
            </Button>
          )}
          <Button
            variant={cycle ? "outline" : "default"}
            onClick={openPeriodForm}
          >
            {cycle
              ? cycle.is_active
                ? "Ubah tanggal"
                : "Buka lagi"
              : "Buka periode"}
          </Button>
        </div>
      </div>

      {rows.length === 0 && unpaired.length === 0 ? (
        <EmptyState
          title="Belum ada karyawan"
          description="Karyawan akan muncul di sini."
          icon={<RiGroupLine className="size-5" />}
          placement="inner"
        />
      ) : (
        <GroupedList>
          <ListColumns grid={ROW_GRID}>
            <span>Karyawan</span>
            <span className="text-right">Penilai</span>
            <span className="hidden text-right md:block">Hasil</span>
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
                label={label}
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
                              ? `Menunggu ${pending.map((r) => r.full_name).join(", ")}`
                              : `Dinilai ${row.reviewers.map((r) => r.full_name).join(", ")}`
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
                            Lihat
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={key === "complete" ? "secondary" : "ghost"}
                            disabled={done === 0 || !cycle}
                            onClick={() => setProcessing(row)}
                          >
                            Proses
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
              label="Belum punya rekan untuk dinilai"
              extra={
                <span className="text-tertiary-foreground tabular-nums">
                  {unpaired.length}
                </span>
              }
              summary={
                <span className="text-tertiary-foreground col-span-2 hidden text-right text-[13px] sm:block md:col-span-3">
                  Butuh minimal dua karyawan
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
              {cycle ? "Periode 360" : "Buka periode 360"} ·{" "}
              {periodLabel(period)}
            </DialogTitle>
            <DialogDescription>
              Semua karyawan saling menilai (admin tidak ikut). Periode lain
              yang masih terbuka akan ditutup.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cycle-start">Mulai</Label>
              <Input
                id="cycle-start"
                type="date"
                value={dates.start}
                onChange={(e) =>
                  setDates((d) => ({ ...d, start: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cycle-end">Selesai</Label>
              <Input
                id="cycle-end"
                type="date"
                value={dates.end}
                min={dates.start}
                onChange={(e) =>
                  setDates((d) => ({ ...d, end: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodOpen(false)}>
              Batal
            </Button>
            <Button onClick={savePeriod} disabled={busy}>
              {busy ? "Menyimpan…" : cycle ? "Simpan" : "Buka periode"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={closing}
        onOpenChange={setClosing}
        title="Tutup periode 360?"
        description="Karyawan tidak bisa mengirim penilaian lagi sampai periode dibuka kembali."
        confirmText="Tutup periode"
        cancelText="Batal"
        onConfirm={closePeriod}
      />

      <ConfirmDialog
        open={Boolean(processing)}
        onOpenChange={(open) => !open && setProcessing(null)}
        title={`Proses hasil ${processing?.full_name ?? ""}?`}
        description={
          processing
            ? `${processing.reviewers.filter((r) => r.done).length} dari ${processing.reviewers.length} rekan sudah menilai. Hasil dirangkum AI dan langsung terlihat oleh karyawan; proses ini hanya bisa dilakukan sekali.`
            : ""
        }
        confirmText="Proses"
        cancelText="Batal"
        onConfirm={process}
      />

      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Hasil 360 · {viewing?.full_name} · {periodLabel(period)}
            </DialogTitle>
          </DialogHeader>
          {summaryLoading ? (
            <div className="flex justify-center py-10">
              <Spinner className="size-6" />
            </div>
          ) : viewingSummary ? (
            <ReviewResult summary={viewingSummary} />
          ) : (
            <p className="text-muted-foreground text-sm">Belum ada hasil.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

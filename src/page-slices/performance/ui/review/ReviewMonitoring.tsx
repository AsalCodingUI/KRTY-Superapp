"use client"

import {
  closeReviewCycle,
  getReviewMonitoring,
  getReviewSummary,
  saveReviewCycle,
  type MonitoringRow,
} from "@/app/(main)/performance/actions/review-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListChip,
  ListGroup,
  ListRow,
} from "@/components/grouped-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { formatPercent } from "@/entities/performance/lib/kpi"
import { RiGroupLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useState } from "react"
import { toast } from "sonner"
import { isQuarter, periodLabel } from "../kpi/period"
import { ReviewResult } from "./ReviewResult"

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

  const { cycle, rows } = data

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

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">
            Periode {periodLabel(period)}
            {cycle?.isOpen && (
              <span className="text-success ml-2 text-xs font-normal">
                Sedang dibuka
              </span>
            )}
            {cycle && !cycle.isOpen && (
              <span className="text-muted-foreground ml-2 text-xs font-normal">
                Ditutup
              </span>
            )}
          </p>
          <p className="text-muted-foreground text-xs">
            {cycle
              ? `${format(new Date(cycle.start_date), "d MMM", { locale: idLocale })} – ${format(new Date(cycle.end_date), "d MMM yyyy", { locale: idLocale })} · ${reviewsDone} dari ${reviewsTotal} penilaian masuk`
              : "Belum dibuka. Karyawan menilai rekan yang satu project di kuartal ini."}
          </p>
        </div>
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
      </section>

      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada pasangan penilai"
          description={`Belum ada karyawan yang satu project di ${periodLabel(period)}.`}
          icon={<RiGroupLine className="size-5" />}
          placement="inner"
        />
      ) : (
        <GroupedList>
          {STATUS_GROUPS.map(({ key, label }) => {
            const items = rows.filter((r) => statusOf(r) === key)
            if (items.length === 0) return null
            return (
              <ListGroup
                key={key}
                label={label}
                count={items.length}
                defaultOpen={
                  key !== "processed" || items.length === rows.length
                }
              >
                {items.map((row) => {
                  const done = row.reviewers.filter((r) => r.done).length
                  const pending = row.reviewers.filter((r) => !r.done)
                  return (
                    <ListRow key={row.id}>
                      <Avatar className="size-5">
                        <AvatarImage src={row.avatar_url || undefined} alt="" />
                        <AvatarFallback className="text-[10px]">
                          {(row.full_name || "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate font-medium">
                        {row.full_name}
                      </span>
                      <span
                        className="text-muted-foreground min-w-0 flex-1 truncate text-xs"
                        title={row.reviewers
                          .map((r) => `${r.full_name}${r.done ? " ✓" : ""}`)
                          .join(", ")}
                      >
                        {pending.length
                          ? `Menunggu ${pending.map((r) => r.full_name).join(", ")}`
                          : `Dinilai ${row.reviewers.map((r) => r.full_name).join(", ")}`}
                      </span>
                      <ListChip className="tabular-nums">
                        {done}/{row.reviewers.length}
                      </ListChip>
                      {row.summary ? (
                        <>
                          <span className="w-12 text-right text-sm font-medium tabular-nums">
                            {formatPercent(row.summary.overall_percentage)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewing(row)}
                          >
                            Lihat
                          </Button>
                        </>
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
                    </ListRow>
                  )
                })}
              </ListGroup>
            )
          })}
        </GroupedList>
      )}

      <Dialog open={periodOpen} onOpenChange={setPeriodOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {cycle ? "Periode 360" : "Buka periode 360"} ·{" "}
              {periodLabel(period)}
            </DialogTitle>
            <DialogDescription>
              Karyawan menilai rekan yang satu project di kuartal ini. Periode
              lain yang masih terbuka akan ditutup.
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
            <Button variant="ghost" onClick={() => setPeriodOpen(false)}>
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
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

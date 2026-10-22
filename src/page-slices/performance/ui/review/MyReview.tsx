"use client"

import { getMyReview } from "@/app/(main)/performance/actions/review-actions"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { RiBarChartBoxLine } from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { isQuarter, periodLabel } from "../kpi/period"
import { ListColumns, PersonCell, StatBand } from "../list"
import { ReviewResult } from "./ReviewResult"

/** Shared column template so the header and rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_12rem_6rem]"

/** Employee 360: teammates to review while the cycle is open, then the result. */
export function MyReview({ period }: { period: string }) {
  const quarter = isQuarter(period)
  const { data, isLoading } = useQuery({
    queryKey: ["my-review", period],
    queryFn: () => getMyReview(period),
    enabled: quarter,
  })

  if (!quarter) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        360 review dihitung per kuartal. Pilih salah satu kuartal di atas.
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

  const { cycle, targets, summary } = data
  const todo = targets.filter((t) => !t.done)
  const done = targets.filter((t) => t.done)

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
          ...(cycle?.isOpen
            ? [
                {
                  label: "Dibuka sampai",
                  value: format(new Date(cycle.end_date), "d MMM yyyy", {
                    locale: idLocale,
                  }),
                },
                {
                  label: "Rekan dinilai",
                  value: `${done.length} / ${targets.length}`,
                },
              ]
            : []),
          {
            label: "Hasil",
            value: summary ? "Tersedia" : "Belum ada",
          },
        ]}
      />

      {cycle?.isOpen && (
        <section className="flex flex-col">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
            <h2 className="text-foreground text-sm">Nilai rekan kerja</h2>
            <p className="text-muted-foreground text-[13px]">
              Nama kamu tidak ditampilkan ke rekan yang kamu nilai.
            </p>
          </div>
          {targets.length === 0 ? (
            <div className="flex flex-col gap-1 border-t py-6 text-sm">
              <p>Belum ada rekan untuk kamu nilai di {periodLabel(period)}.</p>
              <p className="text-muted-foreground">
                Semua karyawan saling menilai (admin tidak ikut). Kalau namamu
                atau rekanmu belum muncul, hubungi admin.
              </p>
            </div>
          ) : (
            <GroupedList>
              <ListColumns grid={ROW_GRID}>
                <span>Rekan</span>
                <span className="hidden md:block">Jabatan</span>
                <span className="text-right">Status</span>
              </ListColumns>
              {[...todo, ...done].map((t) => (
                <ListRow key={t.id} className={cn(ROW_GRID, "min-h-14")}>
                  <PersonCell name={t.full_name} avatarUrl={t.avatar_url} />
                  <div className="hidden min-w-0 md:block">
                    {t.job_title && (
                      <Badge variant="secondary" className="max-w-full">
                        <span className="truncate">{t.job_title}</span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-end">
                    {t.done ? (
                      <Badge variant="success">Terkirim</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        nativeButton={false}
                        render={
                          <Link
                            href={`/performance-review/new?untuk=${t.id}`}
                            prefetch={false}
                          />
                        }
                      >
                        Nilai
                      </Button>
                    )}
                  </div>
                </ListRow>
              ))}
            </GroupedList>
          )}
        </section>
      )}

      <section className="flex flex-col">
        <h2 className="text-foreground pt-6 pb-3 text-sm">Hasil 360 kamu</h2>
        {summary ? (
          <ReviewResult summary={summary} />
        ) : (
          <EmptyState
            title={`Belum ada hasil untuk ${periodLabel(period)}`}
            description={
              cycle
                ? "Hasil muncul setelah admin memproses penilaian dari rekanmu."
                : "Belum ada periode 360 review di kuartal ini."
            }
            icon={<RiBarChartBoxLine className="size-5" />}
            placement="inner"
          />
        )}
      </section>
    </div>
  )
}

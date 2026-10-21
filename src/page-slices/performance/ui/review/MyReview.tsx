"use client"

import { getMyReview } from "@/app/(main)/performance/actions/review-actions"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListGroup, ListRow } from "@/components/grouped-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { RiBarChartBoxLine, RiCheckLine } from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { isQuarter, periodLabel } from "../kpi/period"
import { ReviewResult } from "./ReviewResult"

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
    <div className="flex flex-col gap-8">
      {cycle?.isOpen && (
        <section className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium">Nilai rekan satu project</h2>
            <p className="text-muted-foreground text-xs">
              Periode dibuka sampai{" "}
              {format(new Date(cycle.end_date), "d MMMM", { locale: idLocale })}
              . Nama kamu tidak ditampilkan ke rekan yang kamu nilai.
            </p>
          </div>
          {targets.length === 0 ? (
            <p className="text-muted-foreground border-t py-6 text-sm">
              Kamu belum satu project dengan karyawan lain di{" "}
              {periodLabel(period)}.
            </p>
          ) : (
            <GroupedList>
              {[
                { label: "Belum dinilai", items: todo },
                { label: "Sudah dinilai", items: done },
              ].map(({ label, items }) =>
                items.length === 0 ? null : (
                  <ListGroup key={label} label={label} count={items.length}>
                    {items.map((t) => (
                      <ListRow key={t.id}>
                        <Avatar className="size-5">
                          <AvatarImage src={t.avatar_url || undefined} alt="" />
                          <AvatarFallback className="text-[10px]">
                            {(t.full_name || "U").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate font-medium">
                          {t.full_name}
                        </span>
                        <span className="text-muted-foreground min-w-0 flex-1 truncate">
                          {t.job_title}
                        </span>
                        {t.done ? (
                          <span className="text-success flex items-center gap-1 text-xs">
                            <RiCheckLine className="size-3.5" />
                            Terkirim
                          </span>
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
                      </ListRow>
                    ))}
                  </ListGroup>
                ),
              )}
            </GroupedList>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Hasil 360 kamu</h2>
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

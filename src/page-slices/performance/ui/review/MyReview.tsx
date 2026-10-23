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
import { useDateLocale, useT } from "@/shared/i18n/client"
import Link from "next/link"
import { isQuarter, periodLabel } from "../kpi/period"
import { ListColumns, PersonCell, StatBand } from "../list"
import { ReviewResult } from "./ReviewResult"

/** Shared column template so the header and rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_12rem_6rem]"

/** Employee 360: teammates to review while the cycle is open, then the result. */
export function MyReview({ period }: { period: string }) {
  const t = useT("performance")
  const dateLocale = useDateLocale()
  const quarter = isQuarter(period)
  const { data, isLoading } = useQuery({
    queryKey: ["my-review", period],
    queryFn: () => getMyReview(period),
    enabled: quarter,
  })

  if (!quarter) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        {t("review360PerQuarter")}
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
  const todo = targets.filter((p) => !p.done)
  const done = targets.filter((p) => p.done)

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
          ...(cycle?.isOpen
            ? [
                {
                  label: t("openUntil"),
                  value: format(new Date(cycle.end_date), "d MMM yyyy", {
                    locale: dateLocale,
                  }),
                },
                {
                  label: t("peersReviewed"),
                  value: `${done.length} / ${targets.length}`,
                },
              ]
            : []),
          {
            label: t("result"),
            value: summary ? t("resultAvailable") : t("resultNone"),
          },
        ]}
      />

      {cycle?.isOpen && (
        <section className="flex flex-col">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
            <h2 className="text-foreground text-sm">{t("reviewTeammates")}</h2>
            <p className="text-muted-foreground text-[13px]">
              {t("anonymousNote")}
            </p>
          </div>
          {targets.length === 0 ? (
            <div className="flex flex-col gap-1 border-t py-6 text-sm">
              <p>{t("noPeersToReview", { period: periodLabel(period, t) })}</p>
              <p className="text-muted-foreground">
                {t("noPeersToReviewHint")}
              </p>
            </div>
          ) : (
            <GroupedList>
              <ListColumns grid={ROW_GRID}>
                <span>{t("peer")}</span>
                <span className="hidden md:block">{t("jobTitle")}</span>
                <span className="text-right">{t("status")}</span>
              </ListColumns>
              {[...todo, ...done].map((p) => (
                <ListRow key={p.id} className={cn(ROW_GRID, "min-h-14")}>
                  <PersonCell name={p.full_name} avatarUrl={p.avatar_url} />
                  <div className="hidden min-w-0 md:block">
                    {p.job_title && (
                      <Badge variant="secondary" className="max-w-full">
                        <span className="truncate">{p.job_title}</span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-end">
                    {p.done ? (
                      <Badge variant="success">{t("sent")}</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        nativeButton={false}
                        render={
                          <Link
                            href={`/performance-review/new?untuk=${p.id}`}
                            prefetch={false}
                          />
                        }
                      >
                        {t("reviewAction")}
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
        <h2 className="text-foreground pt-6 pb-3 text-sm">
          {t("your360Result")}
        </h2>
        {summary ? (
          <ReviewResult summary={summary} />
        ) : (
          <EmptyState
            title={t("noResultFor", { period: periodLabel(period, t) })}
            description={
              cycle ? t("resultAfterProcessing") : t("noCycleThisQuarter")
            }
            icon={<RiBarChartBoxLine className="size-5" />}
            placement="inner"
          />
        )}
      </section>
    </div>
  )
}

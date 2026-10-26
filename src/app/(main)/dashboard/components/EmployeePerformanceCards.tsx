"use client"

import { Badge } from "@/components/ui/badge"
import { ArrowUpRight } from "@/components/icons"
import { periodLabel, isQuarter } from "@/page-slices/performance/ui/kpi/period"
import { My360Actions } from "@/page-slices/performance/ui/review/MyReview"
import { RiCalendarLine, RiGroupLine } from "@/shared/ui/lucide-icons"
import { HomeCard, HomeEmpty, HomeIconLink, HomeRow } from "./home-card"
import { format } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"

/** A small tile in front of a row, like a project avatar. */
function RowIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4">
      {children}
    </span>
  )
}

interface EmployeePerformanceCardsProps {
  /** The home page's period ("2026-Q4"): the 360 actions follow it. */
  period: string
  upcomingReviews?: Array<{
    cycle_id: string
    cycle_name: string
    end_date: string
    has_submitted: boolean
  }>
  upcomingOneOnOne?: Array<{
    id: string
    start_at: string
    end_at: string
    mode: string
    location: string | null
    meeting_url: string | null
    status: string
    organizer_name: string | null
  }>
}

/** Upcoming 360 reviews and 1:1 sessions (the KPI is HomeKpiCard). */
export function EmployeePerformanceCards({
  period,
  upcomingReviews = [],
  upcomingOneOnOne = [],
}: EmployeePerformanceCardsProps) {
  const t = useT("dashboard")
  const tp = useT("performance")
  const dateLocale = useDateLocale()
  const reviews = upcomingReviews.slice(0, 3)
  const slots = upcomingOneOnOne.slice(0, 3)

  return (
    <>
      <HomeCard
        title={t("reviewOneOnOneTitle")}
        actions={
          <HomeIconLink href="/performance" label={t("openReview")}>
            <ArrowUpRight />
          </HomeIconLink>
        }
      >
        <div className="flex flex-1 flex-col">
          {reviews.length === 0 && slots.length === 0 ? (
            <HomeEmpty>{t("reviewOneOnOneEmpty")}</HomeEmpty>
          ) : (
            <>
              {reviews.map((review) => (
                <HomeRow
                  key={review.cycle_id}
                  href="/performance"
                  leading={
                    <RowIcon>
                      <RiGroupLine />
                    </RowIcon>
                  }
                  title={t("review360Label", {
                    period: isQuarter(review.cycle_name)
                      ? periodLabel(review.cycle_name, tp)
                      : review.cycle_name,
                  })}
                  subtitle={t("reviewDue", {
                    date: format(new Date(review.end_date), "d MMM yyyy", {
                      locale: dateLocale,
                    }),
                  })}
                  trailing={
                    <Badge
                      variant={review.has_submitted ? "success" : "warning"}
                    >
                      {review.has_submitted
                        ? t("reviewSubmitted")
                        : t("reviewNotFilled")}
                    </Badge>
                  }
                />
              ))}
              {slots.map((slot) => (
                <HomeRow
                  key={slot.id}
                  leading={
                    <RowIcon>
                      <RiCalendarLine />
                    </RowIcon>
                  }
                  title={`1:1 · ${format(new Date(slot.start_at), "EEE, d MMM · HH:mm", { locale: dateLocale })}`}
                  subtitle={
                    (slot.organizer_name
                      ? t("oneOnOneWith", { name: slot.organizer_name })
                      : t("oneOnOneSession")) +
                    (slot.mode === "offline" && slot.location
                      ? ` · ${slot.location}`
                      : ` · ${
                          slot.mode === "online"
                            ? t("oneOnOneModeOnline")
                            : slot.mode === "offline"
                              ? t("oneOnOneModeOffline")
                              : slot.mode
                        }`)
                  }
                  trailing={
                    slot.meeting_url ? (
                      <a
                        href={slot.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-info text-[13px] hover:underline"
                      >
                        {t("oneOnOneJoin")}
                      </a>
                    ) : null
                  }
                />
              ))}
            </>
          )}
        </div>
        {/* Review teammates / read the result, as on the Kinerja page. */}
        <My360Actions period={period} />
      </HomeCard>
    </>
  )
}

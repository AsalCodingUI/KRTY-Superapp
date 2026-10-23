"use client"

import { Badge } from "@/components/ui/badge"
import { ArrowUpRight } from "lucide-react"
import {
  HomeCard,
  HomeEmpty,
  HomeIconLink,
  HomeRow,
  HomeStats,
} from "./home-card"
import { format } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"

interface EmployeePerformanceCardsProps {
  slaScore: number | null
  reviewScore: number | null
  workQualityScore: number | null
  quarter: string
  competencyScores?: {
    leadership: number
    quality: number
    reliability: number
    communication: number
    initiative: number
  } | null
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

export function EmployeePerformanceCards({
  slaScore,
  reviewScore,
  workQualityScore,
  quarter,
  competencyScores,
  upcomingReviews = [],
  upcomingOneOnOne = [],
}: EmployeePerformanceCardsProps) {
  const t = useT("dashboard")
  const dateLocale = useDateLocale()
  const pct = (v: number | null) =>
    v !== null ? `${Number(v).toFixed(1)}%` : "–"
  const competencyItems = competencyScores
    ? [
        {
          label: t("competencyLeadership"),
          value: competencyScores.leadership,
        },
        { label: t("competencyQuality"), value: competencyScores.quality },
        {
          label: t("competencyReliability"),
          value: competencyScores.reliability,
        },
        {
          label: t("competencyCommunication"),
          value: competencyScores.communication,
        },
        {
          label: t("competencyInitiative"),
          value: competencyScores.initiative,
        },
      ]
    : []
  const reviews = upcomingReviews.slice(0, 3)
  const slots = upcomingOneOnOne.slice(0, 3)

  return (
    <>
      <HomeCard
        title={t("performanceTitle")}
        badge={<Badge variant="secondary">{quarter}</Badge>}
        actions={
          <HomeIconLink href="/performance" label={t("openKpi")}>
            <ArrowUpRight />
          </HomeIconLink>
        }
      >
        <HomeStats
          items={[
            { label: t("statSlaOnTime"), value: pct(slaScore) },
            { label: t("statReview360"), value: pct(reviewScore) },
            { label: t("statWorkQuality"), value: pct(workQualityScore) },
          ]}
        />
        {competencyItems.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {competencyItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 text-[13px]"
              >
                <span className="text-muted-foreground w-28 shrink-0">
                  {item.label}
                </span>
                <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                  <div
                    className="bar-grow bg-primary h-full rounded-full"
                    style={
                      {
                        "--bar": `${Math.max(0, Math.min(100, item.value))}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-medium tabular-nums">
                  {Math.round(item.value)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <HomeEmpty>{t("competencyEmpty")}</HomeEmpty>
        )}
      </HomeCard>

      <HomeCard
        title={t("reviewOneOnOneTitle")}
        actions={
          <HomeIconLink
            href="/performance?tab=360review"
            label={t("openReview")}
          >
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
                  href="/performance?tab=360review"
                  title={review.cycle_name}
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
                        className="text-primary text-[13px] font-medium hover:underline"
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
      </HomeCard>
    </>
  )
}

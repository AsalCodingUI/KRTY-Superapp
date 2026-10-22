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
import { id as idLocale } from "date-fns/locale"

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
  const pct = (v: number | null) =>
    v !== null ? `${Number(v).toFixed(1)}%` : "–"
  const competencyItems = competencyScores
    ? [
        { label: "Leadership", value: competencyScores.leadership },
        { label: "Quality", value: competencyScores.quality },
        { label: "Reliability", value: competencyScores.reliability },
        { label: "Communication", value: competencyScores.communication },
        { label: "Initiative", value: competencyScores.initiative },
      ]
    : []
  const reviews = upcomingReviews.slice(0, 3)
  const slots = upcomingOneOnOne.slice(0, 3)

  return (
    <>
      <HomeCard
        title="Performa"
        badge={<Badge variant="secondary">{quarter}</Badge>}
        actions={
          <HomeIconLink href="/performance" label="Buka KPI">
            <ArrowUpRight />
          </HomeIconLink>
        }
      >
        <HomeStats
          items={[
            { label: "SLA tepat waktu", value: pct(slaScore) },
            { label: "Review 360", value: pct(reviewScore) },
            { label: "Kualitas kerja", value: pct(workQualityScore) },
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
                    className="bg-primary h-full rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, item.value))}%`,
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-medium tabular-nums">
                  {Math.round(item.value)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <HomeEmpty>
            Nilai kompetensi muncul setelah review kuartal ini.
          </HomeEmpty>
        )}
      </HomeCard>

      <HomeCard
        title="Review & 1:1"
        actions={
          <HomeIconLink href="/performance?tab=360review" label="Buka review">
            <ArrowUpRight />
          </HomeIconLink>
        }
      >
        <div className="flex flex-1 flex-col">
          {reviews.length === 0 && slots.length === 0 ? (
            <HomeEmpty>Belum ada review atau sesi 1:1 terjadwal.</HomeEmpty>
          ) : (
            <>
              {reviews.map((review) => (
                <HomeRow
                  key={review.cycle_id}
                  href="/performance?tab=360review"
                  title={review.cycle_name}
                  subtitle={`Tenggat ${format(new Date(review.end_date), "d MMM yyyy", { locale: idLocale })}`}
                  trailing={
                    <Badge
                      variant={review.has_submitted ? "success" : "warning"}
                    >
                      {review.has_submitted ? "Terkirim" : "Belum diisi"}
                    </Badge>
                  }
                />
              ))}
              {slots.map((slot) => (
                <HomeRow
                  key={slot.id}
                  title={`1:1 · ${format(new Date(slot.start_at), "EEE, d MMM · HH:mm", { locale: idLocale })}`}
                  subtitle={
                    (slot.organizer_name
                      ? `Dengan ${slot.organizer_name}`
                      : "Sesi 1:1") +
                    (slot.mode === "offline" && slot.location
                      ? ` · ${slot.location}`
                      : ` · ${slot.mode}`)
                  }
                  trailing={
                    slot.meeting_url ? (
                      <a
                        href={slot.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-[13px] font-medium hover:underline"
                      >
                        Gabung
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

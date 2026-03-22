"use client"

import { Badge } from "@/shared/ui"
import { format } from "date-fns"

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
  quarter,
  competencyScores,
  upcomingReviews = [],
  upcomingOneOnOne = [],
}: EmployeePerformanceCardsProps) {
  const competencyItems = competencyScores
    ? [
      { label: "Leadership", value: competencyScores.leadership },
      { label: "Quality", value: competencyScores.quality },
      { label: "Reliability", value: competencyScores.reliability },
      { label: "Communication", value: competencyScores.communication },
      { label: "Initiative", value: competencyScores.initiative },
    ]
    : []

  return (
    <div className="space-y-4">

      {competencyItems.length > 0 && (
        <div className="border-neutral-primary bg-surface-neutral-primary rounded-lg border px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-label-sm text-foreground-secondary">
              Competency Snapshot
            </p>
            <span className="text-body-xs text-foreground-tertiary">{quarter}</span>
          </div>
          <div className="space-y-2">
            {competencyItems.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-body-xs text-foreground-secondary">
                    {item.label}
                  </span>
                  <span className="text-body-xs text-foreground-primary tabular-nums">
                    {Math.round(item.value)}%
                  </span>
                </div>
                <div className="bg-surface-neutral-secondary h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-foreground-brand-primary h-full rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingReviews.length === 0 ? (
        <p className="text-body-xs text-foreground-tertiary">
          No active review cycle.
        </p>
      ) : (
        <div className="border-neutral-primary divide-neutral-primary overflow-hidden rounded-lg border divide-y">
          {upcomingReviews.slice(0, 2).map((review) => (
            <div
              key={review.cycle_id}
              className="flex items-center justify-between px-3 py-2"
            >
              <div>
                <p className="text-body-sm text-foreground-primary">
                  {review.cycle_name}
                </p>
                <p className="text-body-xs text-foreground-secondary">
                  Due {format(new Date(review.end_date), "dd MMM yyyy")}
                </p>
              </div>
              <Badge variant={review.has_submitted ? "success" : "warning"}>
                {review.has_submitted ? "Submitted" : "Pending"}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <div className="border-neutral-primary rounded-lg border px-4 py-3">
        <p className="text-label-sm text-foreground-secondary mb-2">Jadwal 1:1</p>
        {upcomingOneOnOne.length === 0 ? (
          <p className="text-body-xs text-foreground-tertiary">
            Belum ada jadwal 1:1 terdekat.
          </p>
        ) : (
          <div className="border-neutral-primary divide-neutral-primary overflow-hidden rounded-lg border divide-y">
            {upcomingOneOnOne.slice(0, 2).map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-body-sm text-foreground-primary">
                    {format(new Date(slot.start_at), "dd MMM yyyy · HH:mm")} -{" "}
                    {format(new Date(slot.end_at), "HH:mm")}
                  </p>
                  <p className="text-body-xs text-foreground-secondary truncate">
                    {slot.organizer_name ? `With ${slot.organizer_name}` : "1:1 Session"}
                    {slot.mode === "offline" && slot.location
                      ? ` • ${slot.location}`
                      : ` • ${slot.mode}`}
                  </p>
                </div>
                {slot.meeting_url ? (
                  <a
                    href={slot.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-body-xs text-foreground-brand-primary hover:underline whitespace-nowrap"
                  >
                    Join
                  </a>
                ) : (
                  <Badge variant="zinc">Scheduled</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

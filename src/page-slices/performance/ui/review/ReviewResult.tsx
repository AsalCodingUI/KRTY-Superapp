"use client"

import { EmptyValue, orEmpty } from "@/components/empty-value"
import type { ReviewSummary } from "@/app/(main)/performance/actions/review-actions"
import { formatPercent } from "@/entities/performance/lib/kpi"
import { useT } from "@/shared/i18n/client"
import { RatingChip, ScoreBar } from "../kpi/RatingChip"

export const CRITERIA = [
  { key: "score_quality", label: "criterionQuality" },
  { key: "score_reliability", label: "criterionReliability" },
  { key: "score_communication", label: "criterionCommunication" },
  { key: "score_initiative", label: "criterionInitiative" },
  { key: "score_leadership", label: "criterionLeadership" },
] as const

const SECTIONS = [
  { key: "additional_feedback", label: "sectionSummary" },
  { key: "feedback_continue", label: "sectionContinue" },
  { key: "feedback_start", label: "sectionStart" },
  { key: "feedback_stop", label: "sectionStop" },
] as const

/** A 360 result: overall, the five criteria (1-5) and the written summary. */
export function ReviewResult({ summary }: { summary: ReviewSummary }) {
  const t = useT("performance")
  const overall =
    summary.overall_percentage === null
      ? null
      : Number(summary.overall_percentage)

  return (
    <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm">{t("score360")}</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-semibold tabular-nums">
              {orEmpty(formatPercent(overall))}
            </span>
            <RatingChip score={overall} />
          </div>
          {summary.total_user ? (
            <p className="text-muted-foreground/80 text-xs">
              {t("fromPeers", { n: Number(summary.total_user) })}
            </p>
          ) : null}
        </div>
        <dl className="flex flex-col gap-3">
          {CRITERIA.map(({ key, label }) => {
            const value = summary[key] === null ? null : Number(summary[key])
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <dt className="text-muted-foreground">{t(label)}</dt>
                  <dd className="font-medium tabular-nums">
                    {value === null ? <EmptyValue /> : value.toFixed(1)}
                    <span className="text-tertiary-foreground text-xs font-normal">
                      {" "}
                      / 5
                    </span>
                  </dd>
                </div>
                <ScoreBar value={value === null ? null : (value / 5) * 100} />
              </div>
            )
          })}
        </dl>
      </div>

      <div className="flex flex-col gap-6">
        {SECTIONS.map(({ key, label }) =>
          summary[key] ? (
            <section key={key} className="flex flex-col gap-1.5">
              <h3 className="text-sm font-medium">{t(label)}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                {summary[key]}
              </p>
            </section>
          ) : null,
        )}
      </div>
    </div>
  )
}

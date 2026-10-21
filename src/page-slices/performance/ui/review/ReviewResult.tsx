import type { ReviewSummary } from "@/app/(main)/performance/actions/review-actions"
import { formatPercent } from "@/entities/performance/lib/kpi"
import { RatingChip, ScoreBar } from "../kpi/RatingChip"

export const CRITERIA = [
  { key: "score_quality", label: "Kualitas kerja" },
  { key: "score_reliability", label: "Keandalan" },
  { key: "score_communication", label: "Komunikasi" },
  { key: "score_initiative", label: "Inisiatif" },
  { key: "score_leadership", label: "Kepemimpinan" },
] as const

const SECTIONS = [
  { key: "additional_feedback", label: "Ringkasan" },
  { key: "feedback_continue", label: "Pertahankan" },
  { key: "feedback_start", label: "Mulai lakukan" },
  { key: "feedback_stop", label: "Kurangi" },
] as const

/** A 360 result: overall, the five criteria (1-5) and the written summary. */
export function ReviewResult({ summary }: { summary: ReviewSummary }) {
  const overall =
    summary.overall_percentage === null
      ? null
      : Number(summary.overall_percentage)

  return (
    <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm">Nilai 360</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-semibold tabular-nums">
              {formatPercent(overall)}
            </span>
            <RatingChip score={overall} />
          </div>
          {summary.total_user ? (
            <p className="text-muted-foreground/80 text-xs">
              Dari {Number(summary.total_user)} rekan
            </p>
          ) : null}
        </div>
        <dl className="flex flex-col gap-3">
          {CRITERIA.map(({ key, label }) => {
            const value = summary[key] === null ? null : Number(summary[key])
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium tabular-nums">
                    {value === null ? "—" : value.toFixed(1)}
                    <span className="text-muted-foreground/70 text-xs font-normal">
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
              <h3 className="text-sm font-medium">{label}</h3>
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

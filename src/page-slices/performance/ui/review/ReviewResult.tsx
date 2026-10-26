"use client"

import { EmptyValue } from "@/components/empty-value"
import type { ReviewSummary } from "@/app/(main)/performance/actions/review-actions"
import { RATINGS, ratingFor } from "@/entities/performance/lib/kpi"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { RatingChip } from "../kpi/RatingChip"

export const CRITERIA = [
  { key: "score_quality", label: "criterionQuality" },
  { key: "score_reliability", label: "criterionReliability" },
  { key: "score_communication", label: "criterionCommunication" },
  { key: "score_initiative", label: "criterionInitiative" },
  { key: "score_leadership", label: "criterionLeadership" },
] as const

/** Keep / start / stop, each with its own accent dot. */
const ACTIONS = [
  { key: "feedback_continue", label: "sectionContinue", dot: "bg-success" },
  { key: "feedback_start", label: "sectionStart", dot: "bg-info" },
  { key: "feedback_stop", label: "sectionStop", dot: "bg-warning" },
] as const

/** Dot colour per rating band on the overall scale. */
const BAND_DOT: Record<(typeof RATINGS)[number]["tone"], string> = {
  success: "bg-success",
  info: "bg-info",
  neutral: "bg-foreground/45",
  warning: "bg-warning",
  destructive: "bg-destructive",
}

/** The overall scale runs 50–100%: below 50 sits at the left end. */
const SCALE_MIN = 50
const SCALE_DOTS = 41

const CARD = "border-border rounded-2xl border p-5"

/** Paragraphs and "- " bullets as one flat list of items. */
function itemsOf(text: string) {
  return text
    .split(/\n\s*\n|\n(?=- )/)
    .map((b) => b.trim().replace(/^- /, ""))
    .filter(Boolean)
}

/** Paragraphs of the written summary. */
function paragraphsOf(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((b) => b.trim().replace(/^- /, ""))
    .filter(Boolean)
}

/**
 * Where the overall score sits: dots coloured by rating band, lit up to the
 * score (the chip next to the number names the rating).
 */
function RatingScale({ value }: { value: number | null }) {
  const clamp = (v: number) => Math.max(SCALE_MIN, Math.min(100, v))
  const step = (100 - SCALE_MIN) / (SCALE_DOTS - 1)

  return (
    <div className="w-full">
      <div
        role="img"
        aria-label={`${value ?? "–"}%`}
        className="flex items-center justify-between"
      >
        {Array.from({ length: SCALE_DOTS }, (_, i) => {
          const v = SCALE_MIN + i * step
          const lit = value !== null && v <= clamp(value) + step / 2
          const current =
            value !== null && Math.abs(v - clamp(value)) < step / 2
          return (
            <span
              key={i}
              aria-hidden
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                BAND_DOT[ratingFor(v)!.tone],
                lit ? "opacity-100" : "opacity-15",
                current && "ring-popover scale-[1.8] ring-2",
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

/**
 * A 360 result, kept calm: the score on its rating scale, the five
 * criteria as a short list, then the written feedback.
 */
export function ReviewResult({ summary }: { summary: ReviewSummary }) {
  const t = useT("performance")
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v))
  const raw = num(summary.overall_percentage)
  const overall = raw === null ? null : Math.round(raw)
  const team = num(summary.benchmark?.overall_percentage)

  // One line of context under the number.
  const meta = [
    summary.total_user
      ? t("fromPeersShort", { n: Number(summary.total_user) })
      : null,
    team !== null ? t("rvTeamInline", { n: Math.round(team) }) : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cn(CARD, "flex flex-col justify-between gap-6")}>
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">{t("score360")}</p>
            <div className="flex items-center gap-3">
              <span className="text-foreground text-5xl leading-none font-normal tracking-tight tabular-nums">
                {overall === null ? <EmptyValue /> : `${overall}%`}
              </span>
              <RatingChip score={overall} />
            </div>
            {meta && (
              <p className="text-muted-foreground text-[13px]">{meta}</p>
            )}
          </div>
          <RatingScale value={overall} />
        </section>

        <section className={cn(CARD, "flex flex-col justify-between gap-4")}>
          <p className="text-muted-foreground text-sm">{t("rvCriteria")}</p>
          <dl className="flex flex-col gap-3">
            {CRITERIA.map(({ key, label }) => {
              const value = num(summary[key])
              return (
                <div
                  key={key}
                  className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)_auto] items-center gap-x-3"
                >
                  <dt className="text-foreground truncate text-sm">
                    {t(label)}
                  </dt>
                  <div className="bg-foreground/8 h-1.5 overflow-hidden rounded-full">
                    {value !== null && (
                      <div
                        className="bg-blue-9 h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                        // 1–5 scale: 1 is empty, 5 is full.
                        style={{ width: `${((value - 1) / 4) * 100}%` }}
                      />
                    )}
                  </div>
                  <dd className="text-foreground text-right text-sm tabular-nums">
                    {value === null ? <EmptyValue /> : value.toFixed(1)}
                  </dd>
                </div>
              )
            })}
          </dl>
        </section>
      </div>

      {/* Written feedback in one card: the summary, then keep / start /
          stop, one under the other in the same style. */}
      {(summary.additional_feedback ||
        ACTIONS.some(({ key }) => summary[key])) && (
        <section className="border-border flex flex-col rounded-2xl border">
          {summary.additional_feedback ? (
            <div className="flex flex-col gap-3 p-6">
              <p className="text-muted-foreground text-sm">
                {t("sectionSummary")}
              </p>
              <div className="text-foreground flex flex-col gap-3 text-[15px] leading-[1.75]">
                {paragraphsOf(summary.additional_feedback).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          ) : null}

          {/* Keep / start / stop under it, styled like the summary. */}
          {ACTIONS.map(({ key, label, dot }) => {
            const text = summary[key]
            if (!text) return null
            return (
              <div
                key={key}
                className="border-border flex flex-col gap-3 border-t p-6 first:border-t-0"
              >
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <span
                    aria-hidden
                    className={cn("size-2 rounded-full", dot)}
                  />
                  {t(label)}
                </p>
                <div className="text-foreground flex flex-col gap-3 text-[15px] leading-[1.75]">
                  {itemsOf(text).map((item, i) => (
                    <p key={i}>{item}</p>
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}

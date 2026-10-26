"use client"

import type { MyReviewOf } from "@/app/(main)/performance/actions/review-actions"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { RiStarFill } from "@/shared/ui/lucide-icons"
import { useState } from "react"
import { toast } from "sonner"

const CRITERIA = [
  {
    key: "quality",
    label: "formCriterionQuality",
    hint: "formCriterionQualityHint",
  },
  {
    key: "reliability",
    label: "formCriterionReliability",
    hint: "formCriterionReliabilityHint",
  },
  {
    key: "communication",
    label: "formCriterionCommunication",
    hint: "formCriterionCommunicationHint",
  },
  {
    key: "initiative",
    label: "formCriterionInitiative",
    hint: "formCriterionInitiativeHint",
  },
  {
    key: "leadership",
    label: "formCriterionLeadership",
    hint: "formCriterionLeadershipHint",
  },
] as const

type CriterionKey = (typeof CRITERIA)[number]["key"]

const FEEDBACK = [
  {
    key: "feedback_continue",
    label: "sectionContinue",
    hint: "feedbackContinueHint",
    placeholder: "feedbackContinuePlaceholder",
  },
  {
    key: "feedback_start",
    label: "sectionStart",
    hint: "feedbackStartHint",
    placeholder: "feedbackStartPlaceholder",
  },
  {
    key: "feedback_stop",
    label: "sectionStop",
    hint: "feedbackStopHint",
    placeholder: "feedbackStopPlaceholder",
  },
] as const

type FeedbackKey = (typeof FEEDBACK)[number]["key"]

const MIN_REASON = 10
/** Caps the API also enforces. */
const MAX_REASON = 1000
const MAX_NOTE = 2000
/** Very low or perfect scores need a short reason. */
const needsReason = (score: number) => score > 0 && (score <= 2 || score === 5)

function Stars({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const t = useT("performance")
  return (
    <div className="flex gap-0.5" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={t("starsOf5", { n: star })}
          onClick={() => onChange(star)}
          className={cn(
            "focus-visible:ring-primary/40 rounded p-1 transition-colors outline-none focus-visible:ring-2",
            star <= value
              ? "text-warning"
              : "text-muted-foreground/40 hover:text-muted-foreground",
          )}
        >
          <RiStarFill
            className="size-5"
            fill={star <= value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  )
}

/**
 * State of one 360 review (five criteria, reasons where needed, three
 * notes) and its submit; shared by the full-page form and the modal.
 */
export function useReviewForm(
  cycleId: string,
  revieweeId: string,
  /** A sent review to change (its one edit) instead of a new one. */
  initial?: MyReviewOf,
) {
  const t = useT("performance")
  const edit = Boolean(initial)
  const [scores, setScores] = useState<Record<CriterionKey, number>>(
    initial?.scores ?? {
      quality: 0,
      reliability: 0,
      communication: 0,
      initiative: 0,
      leadership: 0,
    },
  )
  const [reasons, setReasons] = useState<Record<CriterionKey, string>>(
    initial?.reasons ?? {
      quality: "",
      reliability: "",
      communication: "",
      initiative: "",
      leadership: "",
    },
  )
  const [feedback, setFeedback] = useState<Record<FeedbackKey, string>>(
    initial?.feedback ?? {
      feedback_continue: "",
      feedback_start: "",
      feedback_stop: "",
    },
  )
  const [loading, setLoading] = useState(false)

  const touched =
    Object.values(scores).some(Boolean) ||
    Object.values(feedback).some((v) => v.trim())
  const allRated = Object.values(scores).every((s) => s > 0)
  const reasonsOk = CRITERIA.every(
    ({ key }) =>
      !needsReason(scores[key]) || reasons[key].trim().length >= MIN_REASON,
  )
  const feedbackOk = Object.values(feedback).every((v) => v.trim())
  const canSubmit = Boolean(revieweeId) && allRated && reasonsOk && feedbackOk

  /** Sends the review; true when it was saved. */
  const submit = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/performance/reviews", {
        method: edit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycle_id: cycleId,
          reviewee_id: revieweeId,
          ...Object.fromEntries(
            CRITERIA.map(({ key }) => [`score_${key}`, scores[key]]),
          ),
          ...Object.fromEntries(
            CRITERIA.map(({ key }) => [
              `justification_${key}`,
              needsReason(scores[key]) ? reasons[key].trim() : "",
            ]),
          ),
          ...feedback,
        }),
      })
      const result = (await response.json().catch(() => null)) as {
        success?: boolean
        error?: string
      } | null
      if (!response.ok || !result?.success) {
        toast.error(result?.error || t("submitReviewFailed"))
        return false
      }
      toast.success(t(edit ? "reviewUpdated" : "reviewSubmitted"))
      return true
    } catch {
      toast.error(t("submitReviewFailed"))
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    scores,
    setScores,
    reasons,
    setReasons,
    feedback,
    setFeedback,
    touched,
    canSubmit,
    loading,
    submit,
  }
}

export type ReviewFormState = ReturnType<typeof useReviewForm>

/** The criteria and notes of a review (no reviewee picker, no buttons). */
export function ReviewFormFields({ form }: { form: ReviewFormState }) {
  const t = useT("performance")
  const { scores, setScores, reasons, setReasons, feedback, setFeedback } = form
  return (
    <>
      <section className="flex flex-col">
        <div className="flex items-baseline justify-between pb-2">
          <h2 className="text-sm font-medium">{t("ratings")}</h2>
          <p className="text-muted-foreground text-xs">
            {t("reasonRequiredNote")}
          </p>
        </div>
        {CRITERIA.map(({ key, label, hint }) => (
          <div key={key} className="flex flex-col gap-2 border-t py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm">{t(label)}</p>
                <p className="text-muted-foreground text-xs">{t(hint)}</p>
              </div>
              <Stars
                label={t(label)}
                value={scores[key]}
                onChange={(v) => setScores((s) => ({ ...s, [key]: v }))}
              />
            </div>
            {needsReason(scores[key]) && (
              <div className="flex flex-col gap-1">
                <Textarea
                  aria-label={t("reasonFor", { label: t(label) })}
                  placeholder={t("reasonPlaceholder", {
                    score: scores[key],
                    label: t(label).toLowerCase(),
                  })}
                  value={reasons[key]}
                  maxLength={MAX_REASON}
                  onChange={(e) =>
                    setReasons((r) => ({ ...r, [key]: e.target.value }))
                  }
                  className="max-h-40 min-h-16"
                />
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    reasons[key].trim().length >= MIN_REASON
                      ? "text-muted-foreground"
                      : "text-warning",
                  )}
                >
                  {t("minChars", {
                    count: reasons[key].trim().length,
                    min: MIN_REASON,
                  })}
                </span>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-sm font-medium">{t("feedback")}</h2>
        {FEEDBACK.map(({ key, label, hint, placeholder }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={key}>{t(label)}</Label>
            <p className="text-muted-foreground -mt-1 text-xs">{t(hint)}</p>
            <Textarea
              id={key}
              placeholder={t(placeholder)}
              value={feedback[key]}
              maxLength={MAX_NOTE}
              onChange={(e) =>
                setFeedback((f) => ({ ...f, [key]: e.target.value }))
              }
              className="max-h-60 min-h-20"
            />
          </div>
        ))}
      </section>
    </>
  )
}

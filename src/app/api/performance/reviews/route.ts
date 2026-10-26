import { cycleStatus } from "@/entities/performance/lib/review-cycle"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { getT } from "@/shared/i18n/server"
import { guardApiRoute } from "@/shared/lib/utils/security"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const score = z.number().int().min(1).max(5)
// Same caps as the form's fields.
const note = z.string().trim().min(1).max(2000)
const reason = z.string().max(1000).optional()
const reviewSchema = z.object({
  cycle_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  score_quality: score,
  score_reliability: score,
  score_communication: score,
  score_initiative: score,
  score_leadership: score,
  feedback_start: note,
  feedback_continue: note,
  feedback_stop: note,
  justification_quality: reason,
  justification_reliability: reason,
  justification_communication: reason,
  justification_initiative: reason,
  justification_leadership: reason,
})

const CRITERIA = [
  "quality",
  "reliability",
  "communication",
  "initiative",
  "leadership",
] as const

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status })

type ReviewBody = z.infer<typeof reviewSchema>

/** The review's columns from a validated body. */
const reviewColumns = (body: ReviewBody) => ({
  score_quality: body.score_quality,
  score_reliability: body.score_reliability,
  score_communication: body.score_communication,
  score_initiative: body.score_initiative,
  score_leadership: body.score_leadership,
  feedback_start: body.feedback_start,
  feedback_continue: body.feedback_continue,
  feedback_stop: body.feedback_stop,
  ...Object.fromEntries(
    CRITERIA.map((key) => [
      `justification_${key}`,
      body[`justification_${key}`]?.trim() || null,
    ]),
  ),
})

/**
 * The checks a review must pass to be sent or changed: signed in, complete,
 * reasons for very low or perfect scores, the cycle open (admin's window)
 * and a reviewer/reviewee pair (review_pairs: employees, not the same
 * person). Returns the response to send instead when one fails.
 */
async function prepare(request: NextRequest) {
  const t = await getT("performance")
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: fail(t("errLoginFirst"), 401) }
  const reviewerId = await resolveEffectiveUserId(supabase, user.id, user.email)

  const parsed = reviewSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return { error: fail(t("errReviewIncomplete"), 400) }
  const body = parsed.data

  for (const key of CRITERIA) {
    const value = body[`score_${key}`]
    const reason = (body[`justification_${key}`] ?? "").trim()
    if ((value <= 2 || value === 5) && reason.length < 10) {
      return { error: fail(t("errReasonRequired"), 400) }
    }
  }

  const admin = createAdminClient()
  const { data: cycle } = await admin
    .from("review_cycles")
    .select("id, quarter, start_date, end_date, is_active")
    .eq("id", body.cycle_id)
    .maybeSingle()
  if (!cycle?.quarter || cycleStatus(cycle) !== "running") {
    return { error: fail(t("errCycleClosed"), 400) }
  }

  const { data: pairs, error: pairsError } = await admin.rpc("review_pairs", {
    p_quarter: cycle.quarter,
  })
  if (pairsError) throw pairsError
  const allowed = (
    (pairs ?? []) as { reviewer_id: string; reviewee_id: string }[]
  ).some(
    (p) => p.reviewer_id === reviewerId && p.reviewee_id === body.reviewee_id,
  )
  if (!allowed) return { error: fail(t("errReviewNotAllowed"), 403) }

  // A result is built from the reviews: once processed (e.g. a cycle
  // reopened for late reviewers), that teammate's reviews are final.
  const { data: processed } = await admin
    .from("performance_summaries")
    .select("id")
    .eq("cycle_id", cycle.id)
    .eq("reviewee_id", body.reviewee_id)
    .maybeSingle()
  if (processed) return { error: fail(t("errReviewProcessed"), 409) }

  return { t, admin, reviewerId, body, cycle }
}

/** Submit a 360 review, once per pair (also why the browser can't insert). */
export async function POST(request: NextRequest) {
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const ready = await prepare(request)
    if ("error" in ready) return ready.error
    const { t, admin, reviewerId, body, cycle } = ready

    const { error } = await admin.from("performance_reviews").insert({
      cycle_id: cycle.id,
      reviewer_id: reviewerId,
      reviewee_id: body.reviewee_id,
      ...reviewColumns(body),
      status: "pending",
    })
    if (error?.code === "23505") {
      return fail(t("errAlreadyReviewed"), 409)
    }
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Performance review submit error", error)
    const t = await getT("performance")
    return fail(t("errSubmitFailed"), 500)
  }
}

/**
 * Change a sent review, once: while the cycle runs and before the
 * reviewee's result is processed (checked in prepare).
 */
export async function PATCH(request: NextRequest) {
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const ready = await prepare(request)
    if ("error" in ready) return ready.error
    const { t, admin, reviewerId, body, cycle } = ready

    // edited_at IS NULL in the update itself: two quick saves can't both win.
    const { data, error } = await admin
      .from("performance_reviews")
      .update({
        ...reviewColumns(body),
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("cycle_id", cycle.id)
      .eq("reviewer_id", reviewerId)
      .eq("reviewee_id", body.reviewee_id)
      .is("edited_at", null)
      .select("id")
    if (error) throw error
    if (!data?.length) return fail(t("errReviewAlreadyEdited"), 409)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Performance review edit error", error)
    const t = await getT("performance")
    return fail(t("errSubmitFailed"), 500)
  }
}

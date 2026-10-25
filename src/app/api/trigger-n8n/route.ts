import { getT } from "@/shared/i18n/server"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { canManageByRole } from "@/shared/lib/roles"
import { logError } from "@/shared/lib/utils/logger"
import { guardApiRoute } from "@/shared/lib/utils/security"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

/**
 * Process one person's 360 result. The n8n workflow ("360 Review") only
 * writes the feedback text with the AI and answers with it; this route
 * saves it. Scores never come from n8n: a database trigger computes them
 * from the reviews whenever the summary is written.
 *
 * Reviewers stay anonymous: the AI gets ratings, reasons and feedback only,
 * never a reviewer's name or job title.
 */

const bodySchema = z.object({
  reviewee_id: z.string().uuid(),
  cycle_id: z.string().uuid(),
})

const aiSchema = z.object({
  output: z.object({
    additional_feedback: z.string().trim().min(1),
    qualitative_feedback: z.object({
      continue: z.string().trim().min(1),
      start: z.string().trim().min(1),
      stop: z.string().trim().min(1),
    }),
  }),
})

// The AI step takes ~30s; leave room for a slow model fallback.
const AI_TIMEOUT_MS = 120_000

const REVIEW_COLUMNS =
  "score_quality, score_reliability, score_communication, score_initiative, score_leadership, justification_quality, justification_reliability, justification_communication, justification_initiative, justification_leadership, feedback_start, feedback_continue, feedback_stop"

export async function POST(request: NextRequest) {
  const t = await getT("api")
  const guard = guardApiRoute(request)
  if (guard) return guard

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: t("webhookMissing") }, { status: 500 })
  }

  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: t("invalidRequest") }, { status: 400 })
    }
    const { reviewee_id, cycle_id } = parsed.data

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }
    const profile = await resolveProfileByUserIdOrEmail<{
      id: string
      email: string | null
      role: string | null
    }>(supabase, "id, email, role, created_at", user.id, user.email)
    if (!canManageByRole(profile?.role)) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: reviews, error } = await admin
      .from("performance_reviews")
      .select(REVIEW_COLUMNS)
      .eq("reviewee_id", reviewee_id)
      .eq("cycle_id", cycle_id)
    if (error) throw new Error(error.message)
    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        { error: t("noReviewsForCycle", { cycle: cycle_id }) },
        { status: 404 },
      )
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meta: { reviewee_id, cycle_id, total_reviews: reviews.length },
        reviews,
      }),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    })
    if (!response.ok) {
      logError("n8n webhook rejected request", undefined, {
        status: response.status,
        responseBody: (await response.text()).slice(0, 1000),
      })
      return NextResponse.json(
        { error: t("workflowTriggerFailed") },
        { status: 502 },
      )
    }

    const ai = aiSchema.safeParse(await response.json().catch(() => null))
    if (!ai.success) {
      logError("n8n answered without the expected feedback", undefined, {
        issues: ai.error.issues.slice(0, 5),
      })
      return NextResponse.json({ error: t("aiResultInvalid") }, { status: 502 })
    }
    const { additional_feedback, qualitative_feedback } = ai.data.output

    // Upsert: processing again (e.g. after a late review) replaces the text.
    const { error: saveError } = await admin
      .from("performance_summaries")
      .upsert(
        {
          reviewee_id,
          cycle_id,
          additional_feedback,
          feedback_continue: qualitative_feedback.continue,
          feedback_start: qualitative_feedback.start,
          feedback_stop: qualitative_feedback.stop,
        },
        { onConflict: "reviewee_id,cycle_id" },
      )
    if (saveError) throw new Error(saveError.message)

    return NextResponse.json({ success: true, count: reviews.length })
  } catch (error: unknown) {
    const timedOut = error instanceof Error && error.name === "TimeoutError"
    logError("Trigger n8n endpoint failed", error)
    return NextResponse.json(
      { error: timedOut ? t("aiTimeout") : t("serverError") },
      { status: timedOut ? 504 : 500 },
    )
  }
}

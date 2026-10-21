import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { guardApiRoute } from "@/shared/lib/utils/security"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const score = z.number().int().min(1).max(5)
const reviewSchema = z.object({
  cycle_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  score_quality: score,
  score_reliability: score,
  score_communication: score,
  score_initiative: score,
  score_leadership: score,
  feedback_start: z.string().trim().min(1),
  feedback_continue: z.string().trim().min(1),
  feedback_stop: z.string().trim().min(1),
  justification_quality: z.string().optional(),
  justification_reliability: z.string().optional(),
  justification_communication: z.string().optional(),
  justification_initiative: z.string().optional(),
  justification_leadership: z.string().optional(),
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

/**
 * Submit a 360 review. Rules (also why the browser can't insert directly):
 * the cycle must be open, the reviewee must share a project with the reviewer
 * in the cycle's quarter (review_pairs), once per pair, and very low or
 * perfect scores need a reason.
 */
export async function POST(request: NextRequest) {
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return fail("Silakan login dulu.", 401)
    const reviewerId = await resolveEffectiveUserId(
      supabase,
      user.id,
      user.email,
    )

    const parsed = reviewSchema.safeParse(
      await request.json().catch(() => null),
    )
    if (!parsed.success) return fail("Isian penilaian belum lengkap.", 400)
    const body = parsed.data

    for (const key of CRITERIA) {
      const value = body[`score_${key}`]
      const reason = (body[`justification_${key}`] ?? "").trim()
      if ((value <= 2 || value === 5) && reason.length < 10) {
        return fail("Nilai 1–2 atau 5 perlu alasan minimal 10 karakter.", 400)
      }
    }

    const admin = createAdminClient()
    const { data: cycle } = await admin
      .from("review_cycles")
      .select("id, quarter, start_date, end_date, is_active")
      .eq("id", body.cycle_id)
      .maybeSingle()
    const now = Date.now()
    if (
      !cycle?.quarter ||
      !cycle.is_active ||
      new Date(cycle.start_date).getTime() > now ||
      new Date(cycle.end_date).getTime() < now
    ) {
      return fail("Periode 360 review sedang tidak dibuka.", 400)
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
    if (!allowed) {
      return fail(
        "Kamu hanya bisa menilai rekan satu project di kuartal ini.",
        403,
      )
    }

    const { error } = await admin.from("performance_reviews").insert({
      cycle_id: cycle.id,
      reviewer_id: reviewerId,
      reviewee_id: body.reviewee_id,
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
      status: "pending",
    })
    if (error?.code === "23505") {
      return fail("Kamu sudah menilai rekan ini di periode ini.", 409)
    }
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Performance review submit error", error)
    return fail("Gagal mengirim penilaian. Coba lagi.", 500)
  }
}

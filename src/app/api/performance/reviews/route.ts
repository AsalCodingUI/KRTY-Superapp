import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { dedupeProfilesByEmail } from "@/shared/lib/profile-dedupe"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const reviewSchema = z.object({
  cycle_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  score_quality: z.number().min(1).max(5),
  score_reliability: z.number().min(1).max(5),
  score_communication: z.number().min(1).max(5),
  score_initiative: z.number().min(1).max(5),
  score_leadership: z.number().min(1).max(5),
  feedback_start: z.string().min(1),
  feedback_continue: z.string().min(1),
  feedback_stop: z.string().min(1),
  justification_quality: z.string().optional(),
  justification_reliability: z.string().optional(),
  justification_communication: z.string().optional(),
  justification_initiative: z.string().optional(),
  justification_leadership: z.string().optional(),
})

async function getCanonicalActorProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, profile: null }
  }

  const profile = await resolveProfileByUserIdOrEmail<{
    id: string
    email: string | null
    role: string | null
    created_at: string | null
  }>(
    supabase,
    "id, email, role, created_at",
    user.id,
    user.email,
  )

  return { user, profile }
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await getCanonicalActorProfile()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const rawBody = await request.json().catch(() => null)
    const parsed = reviewSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review payload" }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    const { data: rawReviewee, error: revieweeError } = await adminSupabase
      .from("profiles")
      .select("id, email, role, created_at")
      .eq("id", parsed.data.reviewee_id)
      .maybeSingle()

    if (revieweeError) {
      throw revieweeError
    }
    if (!rawReviewee) {
      return NextResponse.json({ error: "Reviewee not found" }, { status: 404 })
    }

    const revieweeCandidates = dedupeProfilesByEmail([
      rawReviewee,
      ...(rawReviewee.email
        ? (
            (
              await adminSupabase
                .from("profiles")
                .select("id, email, role, created_at")
                .eq("email", rawReviewee.email)
                .order("created_at", { ascending: true })
            ).data || []
          )
        : []),
    ])
    const canonicalReviewee =
      revieweeCandidates.find(
        (candidate) =>
          candidate.email &&
          rawReviewee.email &&
          candidate.email.toLowerCase() === rawReviewee.email.toLowerCase(),
      ) || rawReviewee

    if (canonicalReviewee.role === "stakeholder") {
      return NextResponse.json({ error: "Invalid reviewee" }, { status: 400 })
    }

    if (canonicalReviewee.id === profile.id) {
      return NextResponse.json({ error: "You cannot review yourself" }, { status: 400 })
    }

    const { data: existingReview, error: existingReviewError } = await adminSupabase
      .from("performance_reviews")
      .select("id")
      .eq("cycle_id", parsed.data.cycle_id)
      .eq("reviewer_id", profile.id)
      .eq("reviewee_id", canonicalReviewee.id)
      .maybeSingle()

    if (existingReviewError) {
      throw existingReviewError
    }
    if (existingReview) {
      return NextResponse.json(
        { error: "You have already submitted a review for this colleague." },
        { status: 409 },
      )
    }

    const payload = {
      cycle_id: parsed.data.cycle_id,
      reviewer_id: profile.id,
      reviewee_id: canonicalReviewee.id,
      score_quality: parsed.data.score_quality,
      score_reliability: parsed.data.score_reliability,
      score_communication: parsed.data.score_communication,
      score_initiative: parsed.data.score_initiative,
      score_leadership: parsed.data.score_leadership,
      feedback_start: parsed.data.feedback_start,
      feedback_continue: parsed.data.feedback_continue,
      feedback_stop: parsed.data.feedback_stop,
      justification_quality: parsed.data.justification_quality || null,
      justification_reliability: parsed.data.justification_reliability || null,
      justification_communication:
        parsed.data.justification_communication || null,
      justification_initiative: parsed.data.justification_initiative || null,
      justification_leadership: parsed.data.justification_leadership || null,
      status: "pending",
    }

    const { data, error } = await adminSupabase
      .from("performance_reviews")
      .insert(payload)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Performance review submit error", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit performance review",
      },
      { status: 500 },
    )
  }
}

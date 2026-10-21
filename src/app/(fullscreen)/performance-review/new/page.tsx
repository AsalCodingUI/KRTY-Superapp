import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { redirect } from "next/navigation"
import ReviewFormClientPage from "./ClientPage"

export const dynamic = "force-dynamic"

/**
 * 360 review form. Only teammates from the same project in the open cycle's
 * quarter who haven't been reviewed yet can be picked (see review_pairs).
 */
export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ untuk?: string }>
}) {
  const { untuk } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const me = await resolveEffectiveUserId(supabase, user.id, user.email)

  const now = new Date().toISOString()
  const { data: cycle } = await supabase
    .from("review_cycles")
    .select("id, quarter")
    .eq("is_active", true)
    .lte("start_date", now)
    .gte("end_date", now)
    .not("quarter", "is", null)
    .maybeSingle()
  if (!cycle?.quarter) redirect("/performance/360-review")

  const [{ data: pairs }, { data: done }] = await Promise.all([
    supabase.rpc("review_pairs", { p_quarter: cycle.quarter }),
    supabase
      .from("performance_reviews")
      .select("reviewee_id")
      .eq("cycle_id", cycle.id)
      .eq("reviewer_id", me),
  ])
  const reviewed = new Set(
    (done ?? []).map((r: { reviewee_id: string }) => r.reviewee_id),
  )
  const ids = [
    ...new Set(
      ((pairs ?? []) as { reviewer_id: string; reviewee_id: string }[])
        .filter((p) => p.reviewer_id === me && !reviewed.has(p.reviewee_id))
        .map((p) => p.reviewee_id),
    ),
  ]
  if (ids.length === 0) redirect("/performance/360-review")

  const { data: colleagues } = await supabase
    .from("profiles")
    .select("id, full_name, job_title")
    .in("id", ids)
    .order("full_name")

  return (
    <ReviewFormClientPage
      cycleId={cycle.id}
      colleagues={colleagues ?? []}
      initialRevieweeId={untuk && ids.includes(untuk) ? untuk : undefined}
    />
  )
}

import { createClient } from "@/shared/api/supabase/server"

/** Inputs the admin dashboard needs from the 360 side (stakeholders only). */
export interface DashboardReviewStats {
  /** Reviewees still missing reviews from teammates in the open cycle. */
  pendingReviewsList: {
    employee_id: string
    employee_name: string | null
    employee_avatar: string | null
    employee_job_title: string | null
    cycle_id: string
    cycle_name: string
    reviewers_pending: number
    total_reviewers: number
  }[]
  recentReviews: Array<{
    created_at: string
    employee_id: string
    profiles?: { full_name: string | null; avatar_url: string | null } | null
  }>
}

export async function getDashboardReviewStats(
  quarter: string,
): Promise<DashboardReviewStats> {
  const supabase = await createClient()

  const { data: cycle } = await supabase
    .from("review_cycles")
    .select("id, quarter")
    .eq("quarter", quarter)
    .maybeSingle()
  if (!cycle) return { pendingReviewsList: [], recentReviews: [] }

  const [{ data: pairs }, { data: reviews }] = await Promise.all([
    supabase.rpc("review_pairs", { p_quarter: quarter }),
    supabase
      .from("performance_reviews")
      .select("reviewer_id, reviewee_id, created_at")
      .eq("cycle_id", cycle.id)
      .order("created_at", { ascending: false }),
  ])

  const done = new Set(
    (reviews ?? []).map(
      (r: { reviewer_id: string; reviewee_id: string }) =>
        `${r.reviewer_id}:${r.reviewee_id}`,
    ),
  )
  const expected = new Map<string, { total: number; pending: number }>()
  for (const p of (pairs ?? []) as {
    reviewer_id: string
    reviewee_id: string
  }[]) {
    const entry = expected.get(p.reviewee_id) ?? { total: 0, pending: 0 }
    entry.total += 1
    if (!done.has(`${p.reviewer_id}:${p.reviewee_id}`)) entry.pending += 1
    expected.set(p.reviewee_id, entry)
  }

  const ids = [
    ...new Set([
      ...expected.keys(),
      ...(reviews ?? [])
        .slice(0, 10)
        .map((r: { reviewer_id: string }) => r.reviewer_id),
    ]),
  ]
  const { data: people } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title")
        .in("id", ids)
    : { data: [] }
  type Person = {
    id: string
    full_name: string | null
    avatar_url: string | null
    job_title: string | null
  }
  const byId = new Map<string, Person>(
    ((people ?? []) as Person[]).map((p) => [p.id, p]),
  )

  return {
    pendingReviewsList: [...expected.entries()]
      .filter(([, e]) => e.pending > 0)
      .map(([id, e]) => ({
        employee_id: id,
        employee_name: byId.get(id)?.full_name ?? null,
        employee_avatar: byId.get(id)?.avatar_url ?? null,
        employee_job_title: byId.get(id)?.job_title ?? null,
        cycle_id: cycle.id,
        cycle_name: cycle.quarter ?? quarter,
        reviewers_pending: e.pending,
        total_reviewers: e.total,
      })),
    recentReviews: (reviews ?? [])
      .slice(0, 10)
      .map((r: { reviewer_id: string; created_at: string }) => ({
        created_at: r.created_at,
        employee_id: r.reviewer_id,
        profiles: byId.get(r.reviewer_id) ?? null,
      })),
  }
}

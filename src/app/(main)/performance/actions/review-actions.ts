"use server"

import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import { revalidatePath } from "next/cache"

/**
 * 360 review (decision Oct 2026): employees review the employees they share a
 * project with in the cycle's quarter (review_pairs). One cycle per quarter,
 * opened and closed by an admin. Admins may see who reviewed whom; the
 * reviewee never does.
 */

export type ReviewCycle = {
  id: string
  quarter: string
  start_date: string
  end_date: string
  is_active: boolean
  /** Active and today is inside the dates. */
  isOpen: boolean
}

export type ReviewSummary = {
  overall_score: number | null
  overall_percentage: number | null
  score_quality: number | null
  score_reliability: number | null
  score_communication: number | null
  score_initiative: number | null
  score_leadership: number | null
  additional_feedback: string | null
  feedback_continue: string | null
  feedback_start: string | null
  feedback_stop: string | null
  total_user: number | null
}

type Person = {
  id: string
  full_name: string | null
  avatar_url: string | null
  job_title: string | null
}

const SUMMARY_COLUMNS =
  "overall_score, overall_percentage, score_quality, score_reliability, score_communication, score_initiative, score_leadership, additional_feedback, feedback_continue, feedback_start, feedback_stop, total_user"

async function viewer() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const id = await resolveEffectiveUserId(supabase, user.id, user.email)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", id)
    .maybeSingle()
  if (!profile) return null
  return {
    supabase,
    id: profile.id as string,
    authId: user.id,
    isStakeholder: canManageByRole(profile.role),
  }
}

function toCycle(row: {
  id: string
  quarter: string | null
  name: string
  start_date: string
  end_date: string
  is_active: boolean | null
}): ReviewCycle {
  const now = Date.now()
  return {
    id: row.id,
    quarter: row.quarter ?? row.name,
    start_date: row.start_date,
    end_date: row.end_date,
    is_active: row.is_active === true,
    isOpen:
      row.is_active === true &&
      new Date(row.start_date).getTime() <= now &&
      new Date(row.end_date).getTime() >= now,
  }
}

async function cycleFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  quarter: string,
) {
  const { data } = await supabase
    .from("review_cycles")
    .select("id, quarter, name, start_date, end_date, is_active")
    .eq("quarter", quarter)
    .maybeSingle()
  return data ? toCycle(data) : null
}

export type MyReviewData = {
  cycle: ReviewCycle | null
  /** Teammates to review this cycle (only while it's open). */
  targets: (Person & { done: boolean })[]
  summary: ReviewSummary | null
}

/** Employee view of a quarter: who to review, and their own result. */
export async function getMyReview(quarter: string): Promise<MyReviewData> {
  const me = await viewer()
  if (!me) return { cycle: null, targets: [], summary: null }
  const { supabase } = me
  const cycle = await cycleFor(supabase, quarter)
  if (!cycle) return { cycle: null, targets: [], summary: null }

  const [{ data: summary }, targets] = await Promise.all([
    supabase
      .from("performance_summaries")
      .select(SUMMARY_COLUMNS)
      .eq("reviewee_id", me.id)
      .eq("cycle_id", cycle.id)
      .maybeSingle(),
    cycle.isOpen ? reviewTargets(supabase, me.id, cycle) : Promise.resolve([]),
  ])

  return { cycle, targets, summary: (summary as ReviewSummary) ?? null }
}

async function reviewTargets(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reviewerId: string,
  cycle: ReviewCycle,
) {
  const [{ data: pairs }, { data: done }] = await Promise.all([
    supabase.rpc("review_pairs", { p_quarter: cycle.quarter }),
    supabase
      .from("performance_reviews")
      .select("reviewee_id")
      .eq("cycle_id", cycle.id)
      .eq("reviewer_id", reviewerId),
  ])
  const ids = [
    ...new Set(
      ((pairs ?? []) as { reviewer_id: string; reviewee_id: string }[])
        .filter((p) => p.reviewer_id === reviewerId)
        .map((p) => p.reviewee_id),
    ),
  ]
  if (ids.length === 0) return []
  const doneIds = new Set(
    (done ?? []).map((r: { reviewee_id: string }) => r.reviewee_id),
  )
  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, job_title")
    .in("id", ids)
    .order("full_name")
  return ((people ?? []) as Person[]).map((p) => ({
    ...p,
    done: doneIds.has(p.id),
  }))
}

export type MonitoringRow = Person & {
  reviewers: { id: string; full_name: string | null; done: boolean }[]
  summary: { overall_percentage: number | null } | null
}

export type MonitoringData = {
  cycle: ReviewCycle | null
  rows: MonitoringRow[]
  /** Employees with no teammate to review or be reviewed by. */
  unpaired: Person[]
}

/** Admin view of a quarter: each reviewee's teammates and progress. */
export async function getReviewMonitoring(
  quarter: string,
): Promise<MonitoringData> {
  const me = await viewer()
  if (!me?.isStakeholder) return { cycle: null, rows: [], unpaired: [] }
  const { supabase } = me
  const cycle = await cycleFor(supabase, quarter)

  const [
    { data: pairs },
    { data: reviews },
    { data: summaries },
    { data: employees },
  ] = await Promise.all([
    supabase.rpc("review_pairs", { p_quarter: quarter }),
    cycle
      ? supabase
          .from("performance_reviews")
          .select("reviewer_id, reviewee_id")
          .eq("cycle_id", cycle.id)
      : Promise.resolve({ data: [] }),
    cycle
      ? supabase
          .from("performance_summaries")
          .select("reviewee_id, overall_percentage")
          .eq("cycle_id", cycle.id)
      : Promise.resolve({ data: [] }),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, job_title")
      .eq("role", "employee")
      .order("full_name"),
  ])

  const done = new Set(
    ((reviews ?? []) as { reviewer_id: string; reviewee_id: string }[]).map(
      (r) => `${r.reviewer_id}:${r.reviewee_id}`,
    ),
  )
  const reviewersOf = new Map<string, string[]>()
  for (const p of (pairs ?? []) as {
    reviewer_id: string
    reviewee_id: string
  }[]) {
    reviewersOf.set(p.reviewee_id, [
      ...(reviewersOf.get(p.reviewee_id) ?? []),
      p.reviewer_id,
    ])
  }
  // Older cycles were "everyone reviews everyone": keep their reviewers too.
  for (const r of (reviews ?? []) as {
    reviewer_id: string
    reviewee_id: string
  }[]) {
    const list = reviewersOf.get(r.reviewee_id) ?? []
    if (!list.includes(r.reviewer_id)) {
      reviewersOf.set(r.reviewee_id, [...list, r.reviewer_id])
    }
  }

  const ids = new Set<string>()
  for (const [reviewee, reviewers] of reviewersOf) {
    ids.add(reviewee)
    reviewers.forEach((r) => ids.add(r))
  }
  const { data: people } = ids.size
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title")
        .in("id", [...ids])
    : { data: [] }
  const byId = new Map(((people ?? []) as Person[]).map((p) => [p.id, p]))
  const summaryOf = new Map(
    (
      (summaries ?? []) as {
        reviewee_id: string
        overall_percentage: number | null
      }[]
    ).map((s) => [s.reviewee_id, s]),
  )

  const paired = new Set<string>()
  for (const p of (pairs ?? []) as {
    reviewer_id: string
    reviewee_id: string
  }[]) {
    paired.add(p.reviewer_id)
    paired.add(p.reviewee_id)
  }

  return {
    cycle,
    unpaired: ((employees ?? []) as Person[]).filter(
      (e) => !paired.has(e.id) && !reviewersOf.has(e.id),
    ),
    rows: [...reviewersOf.entries()]
      .filter(([id]) => byId.has(id))
      .map(([id, reviewers]) => ({
        ...byId.get(id)!,
        reviewers: reviewers.map((r) => ({
          id: r,
          full_name: byId.get(r)?.full_name ?? null,
          done: done.has(`${r}:${id}`),
        })),
        summary: summaryOf.has(id)
          ? { overall_percentage: summaryOf.get(id)!.overall_percentage }
          : null,
      }))
      .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? "")),
  }
}

/** A reviewee's summary (admins, or the reviewee themselves). */
export async function getReviewSummary(
  revieweeId: string,
  quarter: string,
): Promise<ReviewSummary | null> {
  const me = await viewer()
  if (!me || (!me.isStakeholder && me.id !== revieweeId)) return null
  const cycle = await cycleFor(me.supabase, quarter)
  if (!cycle) return null
  const { data } = await me.supabase
    .from("performance_summaries")
    .select(SUMMARY_COLUMNS)
    .eq("reviewee_id", revieweeId)
    .eq("cycle_id", cycle.id)
    .maybeSingle()
  return (data as ReviewSummary) ?? null
}

type ActionResult = { success: boolean; error?: string }

/** Open (or reopen with new dates) the cycle for a quarter; closes others. */
export async function saveReviewCycle(
  quarter: string,
  startDate: string,
  endDate: string,
): Promise<ActionResult> {
  const me = await viewer()
  if (!me?.isStakeholder) return { success: false, error: "Khusus admin." }
  if (!/^\d{4}-Q[1-4]$/.test(quarter)) {
    return { success: false, error: "Pilih satu kuartal." }
  }
  if (!startDate || !endDate || endDate < startDate) {
    return { success: false, error: "Tanggal selesai harus setelah mulai." }
  }
  const { supabase } = me
  const start = `${startDate}T00:00:00+07:00`
  const end = `${endDate}T23:59:59+07:00`

  await supabase
    .from("review_cycles")
    .update({ is_active: false })
    .eq("is_active", true)
    .neq("quarter", quarter)

  const existing = await cycleFor(supabase, quarter)
  const { error } = existing
    ? await supabase
        .from("review_cycles")
        .update({ start_date: start, end_date: end, is_active: true })
        .eq("id", existing.id)
    : await supabase.from("review_cycles").insert({
        name: quarter,
        quarter,
        start_date: start,
        end_date: end,
        is_active: true,
      })
  if (error) return { success: false, error: "Gagal menyimpan periode." }
  revalidatePath("/performance", "layout")
  return { success: true }
}

export async function closeReviewCycle(quarter: string): Promise<ActionResult> {
  const me = await viewer()
  if (!me?.isStakeholder) return { success: false, error: "Khusus admin." }
  const { error } = await me.supabase
    .from("review_cycles")
    .update({ is_active: false })
    .eq("quarter", quarter)
  if (error) return { success: false, error: "Gagal menutup periode." }
  revalidatePath("/performance", "layout")
  return { success: true }
}

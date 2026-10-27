"use server"

import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { getT } from "@/shared/i18n/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import {
  cycleEnd,
  cycleStart,
  cycleStatus,
  latestCloseDay,
  quarterBounds,
  REOPEN_GRACE_DAYS,
  type CycleStatus,
} from "@/entities/performance/lib/review-cycle"
import { revalidatePath } from "next/cache"

/**
 * 360 review (decision 22 Oct 2026): every employee reviews every other
 * employee; admins take no part (review_pairs). One cycle per quarter,
 * opened and closed by an admin. Admins may see who reviewed whom; the
 * reviewee never does.
 */

export type ReviewCycle = {
  id: string
  quarter: string
  start_date: string
  end_date: string
  is_active: boolean
  /** From the admin's dates: scheduled / running / ended / closed. */
  status: CycleStatus
  /** Running: reviews can be given now. */
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
  /** Quarter of the cycle this result belongs to. */
  quarter?: string
  /** Team averages of the same cycle (only when ≥ 3 people have a result). */
  benchmark?: ReviewScores | null
  /** The same person's result in their previous cycle. */
  previous?: (ReviewScores & { quarter: string }) | null
  /** Overall result per cycle up to this one, with the team's average. */
  history?: { quarter: string; overall: number | null; team: number | null }[]
  /** What reviewers wrote, word for word: no names, sorted so the order
   *  says nothing about who wrote what. Only with ≥ 3 reviewers. */
  verbatim?: ReviewVerbatim | null
}

export type ReviewVerbatim = Record<
  | "feedback_continue"
  | "feedback_start"
  | "feedback_stop"
  | "justification_quality"
  | "justification_reliability"
  | "justification_communication"
  | "justification_initiative"
  | "justification_leadership",
  string[]
>

const VERBATIM_KEYS = [
  "feedback_continue",
  "feedback_start",
  "feedback_stop",
  "justification_quality",
  "justification_reliability",
  "justification_communication",
  "justification_initiative",
  "justification_leadership",
] as const

/** Fewer reviewers than this and the words could point to who wrote them. */
const VERBATIM_MIN_REVIEWERS = 3

/**
 * The reviews' own text for one person and cycle. Read with the admin
 * client (reviewees can't read reviews about them) and only after the
 * caller checked access; reviewer ids never leave this function.
 */
async function verbatimFor(
  revieweeId: string,
  cycleId: string,
): Promise<ReviewVerbatim | null> {
  const { data } = await createAdminClient()
    .from("performance_reviews")
    .select(VERBATIM_KEYS.join(", "))
    .eq("reviewee_id", revieweeId)
    .eq("cycle_id", cycleId)
  const rows = (data ?? []) as unknown as Record<string, string | null>[]
  if (rows.length < VERBATIM_MIN_REVIEWERS) return null
  return Object.fromEntries(
    VERBATIM_KEYS.map((k) => [
      k,
      rows
        .map((r) => r[k]?.trim() ?? "")
        // Skip fillers like "-" or "." that say nothing.
        .filter((text) => /[\p{L}\p{N}]/u.test(text))
        .sort((a, b) => a.localeCompare(b)),
    ]),
  ) as ReviewVerbatim
}

export type ReviewScores = {
  overall_percentage: number | null
  score_quality: number | null
  score_reliability: number | null
  score_communication: number | null
  score_initiative: number | null
  score_leadership: number | null
}

const SCORE_KEYS = [
  "overall_percentage",
  "score_quality",
  "score_reliability",
  "score_communication",
  "score_initiative",
  "score_leadership",
] as const

function toScores(row: Record<string, unknown> | null): ReviewScores | null {
  if (!row) return null
  const out = {} as ReviewScores
  for (const k of SCORE_KEYS)
    out[k] = row[k] === null || row[k] === undefined ? null : Number(row[k])
  return out
}

/**
 * Adds the team average of the cycle and the person's previous result, so a
 * score reads against something instead of on its own.
 */
async function withContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  summary: ReviewSummary | null,
  revieweeId: string,
  cycle: ReviewCycle,
): Promise<ReviewSummary | null> {
  if (!summary) return null
  const [{ data: avg }, { data: earlier }, verbatim] = await Promise.all([
    supabase.rpc("review_cycle_averages", { p_cycle_id: cycle.id }),
    supabase
      .from("performance_summaries")
      .select(
        "overall_percentage, score_quality, score_reliability, score_communication, score_initiative, score_leadership, review_cycles!inner(id, quarter)",
      )
      .eq("reviewee_id", revieweeId)
      .lt("review_cycles.quarter", cycle.quarter),
    verbatimFor(revieweeId, cycle.id),
  ])
  type Earlier = Record<string, unknown> & {
    review_cycles: { id: string; quarter: string }
  }
  const prev = ((earlier ?? []) as unknown as Earlier[])
    .sort((a, b) =>
      b.review_cycles.quarter.localeCompare(a.review_cycles.quarter),
    )
    .at(0)
  const bench = (avg as Record<string, unknown>[] | null)?.[0] ?? null
  // Last few cycles for the trend, each with its own team average.
  const recent = ((earlier ?? []) as unknown as Earlier[])
    .sort((a, b) =>
      a.review_cycles.quarter.localeCompare(b.review_cycles.quarter),
    )
    .slice(-5)
  const teams = await Promise.all(
    recent.map((r) =>
      supabase
        .rpc("review_cycle_averages", { p_cycle_id: r.review_cycles.id })
        .then(
          ({
            data,
          }: {
            data: { overall_percentage: number | null }[] | null
          }) =>
            data?.[0]?.overall_percentage == null
              ? null
              : Number(data[0].overall_percentage),
        ),
    ),
  )
  const history = [
    ...recent.map((r, i) => ({
      quarter: r.review_cycles.quarter,
      overall:
        r.overall_percentage == null ? null : Number(r.overall_percentage),
      team: teams[i],
    })),
    {
      quarter: cycle.quarter,
      overall:
        summary.overall_percentage == null
          ? null
          : Number(summary.overall_percentage),
      team:
        bench?.overall_percentage == null
          ? null
          : Number(bench.overall_percentage),
    },
  ]
  return {
    history,
    ...summary,
    quarter: cycle.quarter,
    verbatim,
    benchmark: toScores(bench),
    previous: prev
      ? { ...toScores(prev)!, quarter: prev.review_cycles.quarter }
      : null,
  }
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
  const status = cycleStatus(row)
  return {
    id: row.id,
    quarter: row.quarter ?? row.name,
    start_date: row.start_date,
    end_date: row.end_date,
    is_active: row.is_active === true,
    status,
    isOpen: status === "running",
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
  /** `editable`: sent, not changed yet and not processed (one edit).
   *  `processed`: their result is out, so no more reviews for them. */
  targets: (Person & {
    done: boolean
    editable: boolean
    processed: boolean
  })[]
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

  return {
    cycle,
    targets,
    summary: await withContext(
      supabase,
      (summary as ReviewSummary) ?? null,
      me.id,
      cycle,
    ),
  }
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
      .select("reviewee_id, edited_at")
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
  const sent = new Map(
    ((done ?? []) as { reviewee_id: string; edited_at: string | null }[]).map(
      (r) => [r.reviewee_id, r.edited_at],
    ),
  )
  const [{ data: people }, { data: processed }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, job_title")
      .in("id", ids)
      .order("full_name"),
    // Results are stakeholder-only (RLS); only whether one exists matters.
    createAdminClient()
      .from("performance_summaries")
      .select("reviewee_id")
      .eq("cycle_id", cycle.id)
      .in("reviewee_id", ids),
  ])
  const processedIds = new Set(
    (processed ?? []).map((r: { reviewee_id: string }) => r.reviewee_id),
  )
  return ((people ?? []) as Person[]).map((p) => ({
    ...p,
    done: sent.has(p.id),
    editable:
      sent.has(p.id) && sent.get(p.id) === null && !processedIds.has(p.id),
    processed: processedIds.has(p.id),
  }))
}

type Pair = { reviewer_id: string; reviewee_id: string }

/** Employees who joined after the cycle's closing date. */
function lateJoiners(
  people: { id: string; created_at?: string | null }[] | null,
  cycle: ReviewCycle | null,
) {
  if (!cycle) return new Set<string>()
  const end = new Date(cycle.end_date).getTime()
  return new Set(
    (people ?? [])
      .filter((p) => p.created_at && new Date(p.created_at).getTime() > end)
      .map((p) => p.id),
  )
}

export type MonitoringRow = Person & {
  reviewers: {
    id: string
    full_name: string | null
    avatar_url: string | null
    done: boolean
  }[]
  summary: { overall_percentage: number | null } | null
}

export type MonitoringData = {
  cycle: ReviewCycle | null
  rows: MonitoringRow[]
  /** Employees with no teammate to review or be reviewed by. */
  unpaired: Person[]
}

/** Admin view of a quarter: each reviewee's reviewers and progress. */
export async function getReviewMonitoring(
  quarter: string,
): Promise<MonitoringData> {
  const me = await viewer()
  if (!me?.isStakeholder) return { cycle: null, rows: [], unpaired: [] }
  const { supabase } = me
  const cycle = await cycleFor(supabase, quarter)

  const [
    { data: allPairs },
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
      .select("id, full_name, avatar_url, job_title, created_at")
      .eq("role", "employee")
      .order("full_name"),
  ])

  // People who joined after the cycle closed weren't part of it.
  const late = lateJoiners(employees, cycle)
  const pairs = ((allPairs ?? []) as Pair[]).filter(
    (p) => !late.has(p.reviewer_id) && !late.has(p.reviewee_id),
  )

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
    unpaired: ((employees ?? []) as Person[])
      .filter((e) => !paired.has(e.id) && !reviewersOf.has(e.id))
      .filter((e) => !late.has(e.id))
      .map(({ id, full_name, avatar_url, job_title }) => ({
        id,
        full_name,
        avatar_url,
        job_title,
      })),
    rows: [...reviewersOf.entries()]
      .filter(([id]) => byId.has(id))
      .map(([id, reviewers]) => ({
        ...byId.get(id)!,
        reviewers: reviewers.map((r) => ({
          id: r,
          full_name: byId.get(r)?.full_name ?? null,
          avatar_url: byId.get(r)?.avatar_url ?? null,
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
  return withContext(
    me.supabase,
    (data as ReviewSummary) ?? null,
    revieweeId,
    cycle,
  )
}

export type ReviewStatusFor = {
  cycle: ReviewCycle | null
  /** Teammates who have reviewed this person / all who should. */
  reviewersDone: number
  reviewersTotal: number
  summary: ReviewSummary | null
}

/**
 * One person's 360 for a quarter, as a stakeholder sees it on their KPI
 * page: the cycle, how many of their reviewers are done, and the result.
 * Stakeholders only (who reviewed whom stays with the monitoring page).
 */
export async function getReviewStatusFor(
  userId: string,
  quarter: string,
): Promise<ReviewStatusFor> {
  const empty = {
    cycle: null,
    reviewersDone: 0,
    reviewersTotal: 0,
    summary: null,
  }
  const me = await viewer()
  if (!me?.isStakeholder) return empty
  const { supabase } = me
  const cycle = await cycleFor(supabase, quarter)
  if (!cycle) return empty

  const [
    { data: pairs },
    { data: reviews },
    { data: summary },
    { data: late },
  ] = await Promise.all([
    supabase.rpc("review_pairs", { p_quarter: quarter }),
    supabase
      .from("performance_reviews")
      .select("reviewer_id")
      .eq("cycle_id", cycle.id)
      .eq("reviewee_id", userId),
    supabase
      .from("performance_summaries")
      .select(SUMMARY_COLUMNS)
      .eq("reviewee_id", userId)
      .eq("cycle_id", cycle.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, created_at")
      .eq("role", "employee")
      .gt("created_at", cycle.end_date),
  ])
  const lateIds = lateJoiners(late, cycle)
  if (lateIds.has(userId)) return { ...empty, cycle }
  // Reviewers due by the pairs, plus anyone who already reviewed (older
  // cycles were "everyone reviews everyone").
  const reviewers = new Set(
    ((pairs ?? []) as { reviewer_id: string; reviewee_id: string }[])
      .filter((p) => p.reviewee_id === userId && !lateIds.has(p.reviewer_id))
      .map((p) => p.reviewer_id),
  )
  const done = new Set(
    ((reviews ?? []) as { reviewer_id: string }[]).map((r) => r.reviewer_id),
  )
  done.forEach((id) => reviewers.add(id))

  return {
    cycle,
    reviewersDone: done.size,
    reviewersTotal: reviewers.size,
    summary: await withContext(
      supabase,
      (summary as ReviewSummary) ?? null,
      userId,
      cycle,
    ),
  }
}

type ActionResult = { success: boolean; error?: string }

/**
 * Open (or reopen, or move) the cycle for a quarter. The admin sets both
 * dates ("yyyy-MM-dd", inside the quarter): reviewing opens at 00:00 WIB on
 * the first and closes at 23:59:59 WIB on the last. Windows stay inside
 * their quarter, so cycles never overlap and other quarters are left alone
 * (scheduling next quarter early must not close the running one). The
 * "360 dibuka" notice follows the start date (review_cycle_schedule.sql).
 */
/** "2026-Q4" → "Q4 2026", as the app writes it. */
const periodLabelOf = (quarter: string) =>
  quarter.replace(/^(\d{4})-(Q[1-4])$/, "$2 $1")

/**
 * Whether every reviewee of the cycle already has a processed result.
 * People who joined after it closed aren't part of it (lateJoiners).
 */
async function allProcessed(cycle: ReviewCycle) {
  const admin = createAdminClient()
  const [{ data: pairs }, { data: done }] = await Promise.all([
    admin.rpc("review_pairs", { p_quarter: cycle.quarter }),
    admin
      .from("performance_summaries")
      .select("reviewee_id")
      .eq("cycle_id", cycle.id),
  ])
  const ids = [
    ...new Set(
      ((pairs ?? []) as { reviewee_id: string }[]).map((p) => p.reviewee_id),
    ),
  ]
  if (ids.length === 0) return false
  const { data: people } = await admin
    .from("profiles")
    .select("id, created_at")
    .in("id", ids)
  const late = lateJoiners(people, cycle)
  const processed = new Set(
    (done ?? []).map((r: { reviewee_id: string }) => r.reviewee_id),
  )
  const reviewees = ids.filter((id) => !late.has(id))
  return reviewees.length > 0 && reviewees.every((id) => processed.has(id))
}

export async function saveReviewCycle(
  quarter: string,
  startDate: string,
  endDate: string,
): Promise<ActionResult> {
  const [me, t] = await Promise.all([viewer(), getT("performance")])
  if (!me?.isStakeholder) return { success: false, error: t("errAdminOnly") }
  if (!/^\d{4}-Q[1-4]$/.test(quarter)) {
    return { success: false, error: t("errPickQuarter") }
  }
  const bounds = quarterBounds(quarter)
  const day = /^\d{4}-\d{2}-\d{2}$/
  if (
    !day.test(startDate) ||
    startDate < bounds.start ||
    startDate > bounds.end
  ) {
    return { success: false, error: t("errStartInQuarter") }
  }
  // The close may run a little past the quarter (reopening for late
  // reviewers), never before it.
  if (
    !day.test(endDate) ||
    endDate < bounds.start ||
    endDate > latestCloseDay(quarter)
  ) {
    return {
      success: false,
      error: t("errEndInQuarter", { days: REOPEN_GRACE_DAYS }),
    }
  }
  if (endDate < startDate) {
    return { success: false, error: t("errEndBeforeStart360") }
  }
  const { supabase } = me
  const start = cycleStart(startDate)
  const end = cycleEnd(endDate)

  // One running window at a time: a reopened cycle can't overlap the next
  // quarter's (the review form picks "the" open cycle).
  const { data: others } = await supabase
    .from("review_cycles")
    .select("quarter")
    .eq("is_active", true)
    .neq("quarter", quarter)
    .lte("start_date", end)
    .gte("end_date", start)
  if (others?.length) {
    return {
      success: false,
      error: t("errCycleOverlap", {
        period: periodLabelOf(others[0].quarter ?? ""),
      }),
    }
  }

  const existing = await cycleFor(supabase, quarter)
  // Reopening only helps while some results are still to be processed.
  if (existing && (await allProcessed(existing))) {
    return { success: false, error: t("errAllProcessed360") }
  }
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
  if (error) return { success: false, error: t("periodSaveFailed") }
  revalidatePath("/performance", "layout")
  return { success: true }
}

export async function closeReviewCycle(quarter: string): Promise<ActionResult> {
  const [me, t] = await Promise.all([viewer(), getT("performance")])
  if (!me?.isStakeholder) return { success: false, error: t("errAdminOnly") }
  const { error } = await me.supabase
    .from("review_cycles")
    .update({ is_active: false })
    .eq("quarter", quarter)
  if (error) return { success: false, error: t("periodCloseFailed") }
  revalidatePath("/performance", "layout")
  return { success: true }
}

export type MyReviewOf = {
  scores: Record<
    "quality" | "reliability" | "communication" | "initiative" | "leadership",
    number
  >
  reasons: Record<
    "quality" | "reliability" | "communication" | "initiative" | "leadership",
    string
  >
  feedback: Record<
    "feedback_start" | "feedback_continue" | "feedback_stop",
    string
  >
}

/** The viewer's own sent review of one teammate, to change it (once). */
export async function getMyReviewOf(
  cycleId: string,
  revieweeId: string,
): Promise<MyReviewOf | null> {
  const me = await viewer()
  if (!me) return null
  const { data } = await me.supabase
    .from("performance_reviews")
    .select(
      "score_quality, score_reliability, score_communication, score_initiative, score_leadership, justification_quality, justification_reliability, justification_communication, justification_initiative, justification_leadership, feedback_start, feedback_continue, feedback_stop",
    )
    .eq("cycle_id", cycleId)
    .eq("reviewer_id", me.id)
    .eq("reviewee_id", revieweeId)
    .maybeSingle()
  if (!data) return null
  const keys = [
    "quality",
    "reliability",
    "communication",
    "initiative",
    "leadership",
  ] as const
  return {
    scores: Object.fromEntries(
      keys.map((k) => [k, data[`score_${k}`] ?? 0]),
    ) as MyReviewOf["scores"],
    reasons: Object.fromEntries(
      keys.map((k) => [k, data[`justification_${k}`] ?? ""]),
    ) as MyReviewOf["reasons"],
    feedback: {
      feedback_start: data.feedback_start ?? "",
      feedback_continue: data.feedback_continue ?? "",
      feedback_stop: data.feedback_stop ?? "",
    },
  }
}

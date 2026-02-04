import { createClient } from "@/shared/api/supabase/server"

export interface DashboardPerformanceStats {
  distribution: {
    outstanding: number
    aboveExpectation: number
    meetsExpectation: number
    belowExpectation: number
    needsImprovement: number
  }
  topPerformers: {
    employee_id: string
    employee_name: string | null
    employee_avatar: string | null
    employee_job_title: string | null
    overall_percentage: number
  }[]
  employeesNeedingAttention: {
    employee_id: string
    employee_name: string | null
    employee_avatar: string | null
    employee_job_title: string | null
    overall_percentage: number
    reason: string
  }[]
  avgTeamPerformance: number | null
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
    profiles?: {
      full_name: string | null
      avatar_url: string | null
    } | null
  }>
}

export async function getPerformanceDashboardStats(
  quarterId: string,
): Promise<DashboardPerformanceStats> {
  const supabase = await createClient()

  // Define raw types for Supabase responses (where relations are arrays)
  type RawReviewSummary = {
    employee_id: string
    overall_percentage: number
    profiles:
      | {
          full_name: string | null
          avatar_url: string | null
          job_title: string | null
        }[]
      | null
  }

  type RawPendingReview = {
    employee_id: string
    cycle_id: string
    profiles: {
      full_name: string | null
      avatar_url: string | null
      job_title: string | null
    }[]
    review_cycles: {
      name: string
    }[]
  }

  type RawRecentReview = {
    created_at: string
    employee_id: string
    profiles: {
      full_name: string | null
      avatar_url: string | null
    }[]
  }

  const [reviewSummaryResult, pendingReviewsResult, recentReviewsResult] =
    await Promise.all([
      // Performance summaries for distribution
      supabase
        .from("review_summary")
        .select(
          "employee_id, overall_percentage, profiles (full_name, avatar_url, job_title)",
        )
        .eq("cycle_id", quarterId),

      // Pending reviews (self_score is null)
      supabase
        .from("performance_reviews")
        .select(
          `
                employee_id,
                cycle_id,
                profiles!performance_reviews_employee_id_fkey (
                    full_name,
                    avatar_url,
                    job_title
                ),
                review_cycles!inner (
                    name
                )
            `,
        )
        .is("self_score", null)
        .limit(20),

      // Recent performance reviews (last 10)
      supabase
        .from("performance_reviews")
        .select(
          `
                created_at,
                employee_id,
                profiles!performance_reviews_employee_id_fkey (
                    full_name,
                    avatar_url
                )
            `,
        )
        .not("self_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(10),
    ])

  const reviewSummaries = (reviewSummaryResult.data ||
    []) as unknown as RawReviewSummary[]

  // Calculate distribution
  const distribution = {
    outstanding: 0,
    aboveExpectation: 0,
    meetsExpectation: 0,
    belowExpectation: 0,
    needsImprovement: 0,
  }

  let totalPerformance = 0
  reviewSummaries.forEach((summary) => {
    const percentage = summary.overall_percentage
    totalPerformance += percentage

    if (percentage >= 95) distribution.outstanding++
    else if (percentage >= 85) distribution.aboveExpectation++
    else if (percentage >= 75) distribution.meetsExpectation++
    else if (percentage >= 60) distribution.belowExpectation++
    else distribution.needsImprovement++
  })

  const avgTeamPerformance =
    reviewSummaries.length > 0
      ? Math.round((totalPerformance / reviewSummaries.length) * 10) / 10
      : null

  const sortedByPerformance = [...reviewSummaries].sort(
    (a, b) => b.overall_percentage - a.overall_percentage,
  )

  const topPerformers = sortedByPerformance.slice(0, 5).map((summary) => {
    const profile = Array.isArray(summary.profiles)
      ? summary.profiles[0]
      : summary.profiles
    return {
      employee_id: summary.employee_id,
      employee_name: profile?.full_name || null,
      employee_avatar: profile?.avatar_url || null,
      employee_job_title: profile?.job_title || null,
      overall_percentage: summary.overall_percentage,
    }
  })

  const employeesNeedingAttention = sortedByPerformance
    .filter((s) => s.overall_percentage < 75)
    .slice(0, 5)
    .map((summary) => {
      const profile = Array.isArray(summary.profiles)
        ? summary.profiles[0]
        : summary.profiles
      return {
        employee_id: summary.employee_id,
        employee_name: profile?.full_name || null,
        employee_avatar: profile?.avatar_url || null,
        employee_job_title: profile?.job_title || null,
        overall_percentage: summary.overall_percentage,
        reason:
          summary.overall_percentage < 60
            ? "Performance significantly below target"
            : "Performance below expectation",
      }
    })

  const pendingReviewsList = (
    (pendingReviewsResult.data || []) as unknown as RawPendingReview[]
  ).map((review) => {
    const profile = Array.isArray(review.profiles)
      ? review.profiles[0]
      : review.profiles
    const cycle = Array.isArray(review.review_cycles)
      ? review.review_cycles[0]
      : review.review_cycles
    return {
      employee_id: review.employee_id,
      employee_name: profile?.full_name || null,
      employee_avatar: profile?.avatar_url || null,
      employee_job_title: profile?.job_title || null,
      cycle_id: review.cycle_id,
      cycle_name: cycle?.name || "",
      reviewers_pending: 0,
      total_reviewers: 5,
    }
  })

  const recentReviews = (
    (recentReviewsResult.data || []) as unknown as RawRecentReview[]
  ).map((review) => {
    const profile = Array.isArray(review.profiles)
      ? review.profiles[0]
      : review.profiles
    return {
      created_at: review.created_at,
      employee_id: review.employee_id,
      profiles: profile,
    }
  })

  return {
    distribution,
    topPerformers,
    employeesNeedingAttention,
    avgTeamPerformance,
    pendingReviewsList,
    recentReviews,
  }
}

"use server"

import { createClient } from "@/shared/api/supabase/server"
import { calculateBusinessDays } from "@/shared/lib/date"
import { getCurrentQuarter } from "@/shared/lib/date/quarter"
import type { PeerReviewScores } from "@/shared/types/dashboard.types"
import { Database } from "@/shared/types/database.types"

export type EmployeeDashboardData = {
  user: {
    id: string
    full_name: string | null
    job_title: string | null
    avatar_url: string | null
  }
  leaveBalance: number
  recentLeaveRequests: Database["public"]["Tables"]["leave_requests"]["Row"][]
  recentAttendance: Database["public"]["Tables"]["attendance_logs"]["Row"][]
  performanceOverview: {
    slaScore: number | null
    reviewScore: number | null
    workQualityScore: number | null
    quarter: string
  }
  activeProjects: Array<{
    id: string
    name: string
    status: string
    quarter_id: string
    end_date: string
    sla_percentage: number
    quality_achieved: number
    quality_total: number
  }>
  upcomingReviews: Array<{
    cycle_id: string
    cycle_name: string
    end_date: string
    has_submitted: boolean
  }>
  upcomingOneOnOne: Array<{
    id: string
    start_at: string
    end_at: string
    mode: string
    location: string | null
    meeting_url: string | null
    status: string
    organizer_name: string | null
  }>
  competencyScores: {
    leadership: number
    quality: number
    reliability: number
    communication: number
    initiative: number
  } | null
}

export async function getEmployeeDashboardData(
  effectiveUserId?: string,
  selectedQuarter?: string,
): Promise<{
  success: boolean
  data?: EmployeeDashboardData
  error?: string
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Unauthorized" }
    }

    const targetUserId = effectiveUserId || user.id

    if (targetUserId !== user.id) {
      const { data: actorProfile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle()

      if (!actorProfile?.is_super_admin) {
        return { success: false, error: "Access denied" }
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, job_title, avatar_url")
      .eq("id", targetUserId)
      .single()

    if (!profile) {
      return { success: false, error: "Profile not found" }
    }

    const quarterMatch = selectedQuarter?.match(/^(\d{4})-(Q[1-4]|All)$/)
    const selectedYear = quarterMatch?.[1] ? Number(quarterMatch[1]) : null
    const selectedQuarterPart = quarterMatch?.[2] || null
    const currentQuarter = getCurrentQuarter()
    const activeQuarter =
      selectedQuarterPart && selectedQuarterPart !== "All" && selectedYear
        ? `${selectedYear}-${selectedQuarterPart}`
        : currentQuarter

    const leaveBalanceYear = selectedYear ?? new Date().getFullYear()
    const leaveYearStart = new Date(leaveBalanceYear, 0, 1)
    const leaveYearEnd = new Date(leaveBalanceYear, 11, 31)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0]

    const [
      recentLeaveResult,
      recentAttendanceResult,
      reviewSummaryResult,
      projectAssignmentsResult,
      reviewCyclesResult,
      oneOnOneResult,
      approvedAnnualLeaveResult,
    ] = await Promise.all([
      supabase
        .from("leave_requests")
        .select(
          "id, user_id, start_date, end_date, leave_type, reason, proof_url, status, created_at, updated_at",
        )
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("attendance_logs")
        .select(
          "id, user_id, date, clock_in, clock_out, is_break, break_total, break_start, status, notes",
        )
        .eq("user_id", targetUserId)
        .gte("date", sevenDaysAgoStr)
        .order("date", { ascending: false })
        .order("clock_in", { ascending: false })
        .limit(50),

      supabase
        .from("review_summary")
        .select("overall_percentage")
        .eq("employee_id", targetUserId)
        .like(
          "cycle_id",
          selectedQuarterPart === "All" && selectedYear
            ? `${selectedYear}-%`
            : activeQuarter,
        ),

      (() => {
        let query = supabase
        .from("project_assignments")
        .select(
          `
                    id,
                    projects!inner (
                        id,
                        name,
                        status,
                        quarter_id,
                        end_date
                    ),
                    project_sla_scores (
                        score_achieved,
                        weight_percentage
                    ),
                    project_work_quality_scores (
                        is_achieved
                    )
                `,
        )
        .eq("user_id", targetUserId)
        .eq("projects.status", "Active")
        .limit(10)

        if (selectedQuarterPart === "All" && selectedYear) {
          query = query.like("projects.quarter_id", `${selectedYear}-%`)
        } else {
          query = query.eq("projects.quarter_id", activeQuarter)
        }

        return query
      })(),

      (() => {
        let query = supabase
        .from("review_cycles")
        .select("id, name, end_date, is_active")
        .order("end_date", { ascending: true })
        .limit(3)

        if (selectedQuarterPart === "All" && selectedYear) {
          query = query.like("name", `${selectedYear}-%`)
        } else {
          query = query.eq("name", activeQuarter)
        }

        return query
      })(),

      (() => {
        let query = supabase
        .from("one_on_one_slots")
        .select(
          "id, start_at, end_at, mode, location, meeting_url, status, organizer:profiles!one_on_one_slots_organizer_id_fkey(full_name)",
        )
        .eq("booked_by", targetUserId)
        .gte("end_at", new Date().toISOString())
        .in("status", ["booking", "booked"])
        .order("start_at", { ascending: true })
        .limit(3)

        if (selectedQuarterPart === "All" && selectedYear) {
          query = query.like("cycle_name", `${selectedYear}-%`)
        } else {
          query = query.eq("cycle_name", activeQuarter)
        }

        return query
      })(),

      supabase
        .from("leave_requests")
        .select("start_date,end_date")
        .eq("user_id", targetUserId)
        .eq("status", "approved")
        .eq("leave_type", "Annual Leave")
        .lte("start_date", leaveYearEnd.toISOString())
        .gte("end_date", leaveYearStart.toISOString()),
    ])

    const { data: latestReview } = await supabase
      .from("performance_reviews")
      .select(
        `
                score_leadership,
                score_quality,
                score_reliability,
                score_communication,
                score_initiative,
                peer_reviews!inner (
                    score_leadership,
                    score_quality,
                    score_reliability,
                    score_communication,
                    score_initiative
                )
            `,
      )
      .eq("employee_id", targetUserId)
      .eq("cycle_id", activeQuarter)
      .not("self_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    let competencyScores = null
    if (latestReview) {
      const peerReviews = (latestReview.peer_reviews ||
        []) as PeerReviewScores[]
      const totalReviewers = peerReviews.length + 1

      const calcAvg = (selfScore: number, peerScores: number[]) => {
        const total =
          selfScore + peerScores.reduce((sum, score) => sum + score, 0)
        return (total / totalReviewers / 5) * 100
      }

      competencyScores = {
        leadership: calcAvg(
          latestReview.score_leadership,
          peerReviews.map((p) => p.score_leadership),
        ),
        quality: calcAvg(
          latestReview.score_quality,
          peerReviews.map((p) => p.score_quality),
        ),
        reliability: calcAvg(
          latestReview.score_reliability,
          peerReviews.map((p) => p.score_reliability),
        ),
        communication: calcAvg(
          latestReview.score_communication,
          peerReviews.map((p) => p.score_communication),
        ),
        initiative: calcAvg(
          latestReview.score_initiative,
          peerReviews.map((p) => p.score_initiative),
        ),
      }
    }

    const reviewCycles = reviewCyclesResult.data || []
    const { data: submittedReviews } = await supabase
      .from("performance_reviews")
      .select("cycle_id")
      .eq("employee_id", targetUserId)
      .not("self_score", "is", null)
      .in(
        "cycle_id",
        reviewCycles.map((c: { id: string }) => c.id),
      )

    const submittedCycleIds = new Set(
      submittedReviews?.map((r: { cycle_id: string }) => r.cycle_id) || [],
    )

    const approvedAnnualRows = (approvedAnnualLeaveResult.data || []) as Array<{
      start_date: string
      end_date: string
    }>
    const approvedAnnualUsed = approvedAnnualRows.reduce(
      (total, req) => {
        const start = new Date(req.start_date)
        const end = new Date(req.end_date)
        const clampedStart = start < leaveYearStart ? leaveYearStart : start
        const clampedEnd = end > leaveYearEnd ? leaveYearEnd : end
        if (clampedEnd < clampedStart) return total
        return total + calculateBusinessDays(clampedStart, clampedEnd)
      },
      0,
    )
    const leaveBalance = Math.max(0, 12 - approvedAnnualUsed)

    // Define the raw shape returned by Supabase (where relations are arrays)
    type RawProjectAssignment = {
      id: string
      projects: {
        id: string
        name: string
        status: string
        quarter_id: string
        end_date: string
      }[]
      project_sla_scores: {
        score_achieved: number
        weight_percentage: number
      }[]
      project_work_quality_scores: { is_achieved: boolean }[]
    }
    type RawOneOnOneSlot = {
      id: string
      start_at: string
      end_at: string
      mode: string
      location: string | null
      meeting_url: string | null
      status: string
      organizer: { full_name: string | null } | { full_name: string | null }[] | null
    }

    const activeProjects = (
      (projectAssignmentsResult.data || []) as unknown as RawProjectAssignment[]
    ).map((assignment) => {
      const slaScores = assignment.project_sla_scores || []
      const qualityScores = assignment.project_work_quality_scores || []
      // Supabase relations often come back as arrays, take the first one
      const project = assignment.projects[0]

      const realAchieve = slaScores.reduce(
        (sum, s) => sum + s.score_achieved,
        0,
      )
      const bestAchieve = slaScores.reduce(
        (sum, s) => sum + s.weight_percentage * 120,
        0,
      )
      const slaPercentage =
        bestAchieve > 0 ? (realAchieve / bestAchieve) * 100 : 0

      const qualityAchieved = qualityScores.filter((q) => q.is_achieved).length
      const qualityTotal = qualityScores.length

      return {
        id: project?.id || "",
        name: project?.name || "Unknown Project",
        status: project?.status || "Active",
        quarter_id: project?.quarter_id || "",
        end_date: project?.end_date || "",
        sla_percentage: Math.round(slaPercentage * 10) / 10,
        quality_achieved: qualityAchieved,
        quality_total: qualityTotal,
      }
    })

    const dashboardData: EmployeeDashboardData = {
      user: profile,
      leaveBalance,
      recentLeaveRequests: recentLeaveResult.data || [],
      recentAttendance: recentAttendanceResult.data || [],
      performanceOverview: {
        slaScore: null,
        reviewScore: null,
        workQualityScore: null,
        quarter:
          selectedQuarterPart === "All" && selectedYear
            ? `${selectedYear}-All`
            : activeQuarter,
      },
      activeProjects,
      upcomingReviews: reviewCycles.map((cycle: { id: string; name: string; end_date: string }) => ({
        cycle_id: cycle.id,
        cycle_name: cycle.name,
        end_date: cycle.end_date,
        has_submitted: submittedCycleIds.has(cycle.id),
      })),
      upcomingOneOnOne: ((oneOnOneResult.data || []) as RawOneOnOneSlot[]).map((slot) => {
        const organizer = Array.isArray(slot.organizer)
          ? slot.organizer[0]
          : slot.organizer
        return {
          id: slot.id,
          start_at: slot.start_at,
          end_at: slot.end_at,
          mode: slot.mode,
          location: slot.location,
          meeting_url: slot.meeting_url,
          status: slot.status,
          organizer_name: organizer?.full_name ?? null,
        }
      }),
      competencyScores,
    }

    const reviewRows = (reviewSummaryResult.data || []) as Array<{
      overall_percentage: number | null
    }>
    if (reviewRows.length > 0) {
      const avgReview =
        reviewRows.reduce((sum: number, row) => sum + (row.overall_percentage || 0), 0) /
        reviewRows.length
      dashboardData.performanceOverview.reviewScore = Math.round(avgReview * 10) / 10
    }

    if (activeProjects.length > 0) {
      const avgSLA =
        activeProjects.reduce((sum, p) => sum + p.sla_percentage, 0) /
        activeProjects.length
      const totalQuality = activeProjects.reduce(
        (sum, p) => sum + p.quality_total,
        0,
      )
      const achievedQuality = activeProjects.reduce(
        (sum, p) => sum + p.quality_achieved,
        0,
      )
      const avgQuality =
        totalQuality > 0 ? (achievedQuality / totalQuality) * 100 : 0

      dashboardData.performanceOverview.slaScore = Math.round(avgSLA * 10) / 10
      dashboardData.performanceOverview.workQualityScore =
        Math.round(avgQuality * 10) / 10
    }

    return { success: true, data: dashboardData }
  } catch (error) {
    console.error("Error fetching employee dashboard data:", error)
    return { success: false, error: "Failed to fetch dashboard data" }
  }
}

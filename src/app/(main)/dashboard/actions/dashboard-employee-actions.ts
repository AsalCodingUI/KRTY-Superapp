"use server"

import { createClient } from "@/shared/api/supabase/server"
import { getLocalDateString } from "@/shared/lib/date"
import { annualLeaveSummary } from "@/shared/lib/leave"
import { getCurrentQuarter } from "@/shared/lib/date/quarter"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { Database } from "@/shared/types/database.types"
import { getT } from "@/shared/i18n/server"

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
  const t = await getT("dashboard")
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: t("errorUnauthorized") }
    }

    const targetUserId = effectiveUserId || user.id
    const actorProfile = await resolveProfileByUserIdOrEmail<{
      id: string
      email: string | null
      is_super_admin: boolean | null
    }>(supabase, "id, email, is_super_admin, created_at", user.id, user.email)

    if (targetUserId !== (actorProfile?.id || user.id)) {
      if (!actorProfile?.is_super_admin) {
        return { success: false, error: t("errorAccessDenied") }
      }
    }

    const profile = await resolveProfileByUserIdOrEmail<{
      id: string
      email: string | null
      full_name: string | null
      job_title: string | null
      avatar_url: string | null
      join_date: string | null
      employment_type: string | null
    }>(
      supabase,
      "id, email, full_name, job_title, avatar_url, join_date, employment_type, created_at",
      targetUserId,
      targetUserId === (actorProfile?.id || user.id) ? user.email : null,
    )

    if (!profile) {
      return { success: false, error: t("profileNotFound") }
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
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo)

    const [
      recentLeaveResult,
      recentAttendanceResult,
      reviewSummaryResult,
      projectAssignmentsResult,
      reviewCyclesResult,
      oneOnOneResult,
      approvedAnnualLeaveResult,
      latestSummaryResult,
      ownReviewsResult,
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

      // 360 results for the quarter, or every quarter of the year ("All").
      (async () => {
        const wholeYear = selectedQuarterPart === "All" && selectedYear
        const cycles = wholeYear
          ? supabase
              .from("review_cycles")
              .select("id")
              .like("quarter", `${selectedYear}-%`)
          : supabase
              .from("review_cycles")
              .select("id")
              .eq("quarter", activeQuarter)
        const { data: cycleRows } = await cycles
        const ids = (cycleRows ?? []).map((c: { id: string }) => c.id)
        if (ids.length === 0) return { data: [] }
        return supabase
          .from("performance_summaries")
          .select("overall_percentage")
          .eq("reviewee_id", targetUserId)
          .in("cycle_id", ids)
      })(),

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
          // Every running project, whatever quarter it was planned in.
          .in("projects.status", ["Planned", "Active", "Review"])
          .limit(10)

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
        // Plain dates: toISOString() would shift 31 Dec to the 30th in WIB.
        .lte("start_date", `${leaveBalanceYear}-12-31`)
        .gte("end_date", `${leaveBalanceYear}-01-01`),

      // Latest 360 summary for this quarter (scores are averages on 1-5).
      (async () => {
        const { data: quarterCycle } = await supabase
          .from("review_cycles")
          .select("id")
          .eq("quarter", activeQuarter)
          .maybeSingle()
        if (!quarterCycle) return { data: null }
        return supabase
          .from("performance_summaries")
          .select(
            "score_leadership, score_quality, score_reliability, score_communication, score_initiative",
          )
          .eq("reviewee_id", targetUserId)
          .eq("cycle_id", quarterCycle.id)
          .maybeSingle()
      })(),

      // Cycles this person reviewed in; narrowed to the listed cycles below.
      supabase
        .from("performance_reviews")
        .select("cycle_id")
        .eq("reviewer_id", targetUserId),
    ])

    const latestSummary = latestSummaryResult.data

    const toPercent = (value: number | null) =>
      value === null ? 0 : (Number(value) / 5) * 100
    const competencyScores = latestSummary
      ? {
          leadership: toPercent(latestSummary.score_leadership),
          quality: toPercent(latestSummary.score_quality),
          reliability: toPercent(latestSummary.score_reliability),
          communication: toPercent(latestSummary.score_communication),
          initiative: toPercent(latestSummary.score_initiative),
        }
      : null

    const reviewCycles = reviewCyclesResult.data || []
    // Cycles where this person already reviewed at least one teammate.
    const listedCycleIds = new Set(
      reviewCycles.map((c: { id: string }) => c.id),
    )
    const submittedCycleIds = new Set(
      (ownReviewsResult.data || [])
        .map((r: { cycle_id: string }) => r.cycle_id)
        .filter((id: string) => listedCycleIds.has(id)),
    )

    const approvedAnnualRows = (approvedAnnualLeaveResult.data || []) as Array<{
      start_date: string
      end_date: string
    }>
    // Same rule as the leave page (prorated / intern entitlement).
    const leaveBalance = annualLeaveSummary(
      approvedAnnualRows,
      leaveBalanceYear,
      profile,
    ).remaining

    type RawProject = {
      id: string
      name: string
      status: string
      quarter_id: string
      end_date: string
    }
    // Define the raw shape returned by Supabase
    type RawProjectAssignment = {
      id: string
      projects: RawProject | RawProject[] | null
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
      organizer:
        | { full_name: string | null }
        | { full_name: string | null }[]
        | null
    }

    const activeProjects = (
      (projectAssignmentsResult.data || []) as unknown as RawProjectAssignment[]
    ).map((assignment) => {
      const slaScores = assignment.project_sla_scores || []
      const qualityScores = assignment.project_work_quality_scores || []
      // A to-one relation (projects!inner) comes back as an object; older
      // typings said array, so accept both.
      const project = Array.isArray(assignment.projects)
        ? assignment.projects[0]
        : assignment.projects

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
        name: project?.name || t("unknownProject"),
        status: project?.status || "Active",
        quarter_id: project?.quarter_id || "",
        end_date: project?.end_date || "",
        sla_percentage: Math.round(slaPercentage * 10) / 10,
        quality_achieved: qualityAchieved,
        quality_total: qualityTotal,
      }
    })

    const dashboardData: EmployeeDashboardData = {
      user: {
        id: profile.id,
        full_name: profile.full_name,
        job_title: profile.job_title,
        avatar_url: profile.avatar_url,
      },
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
      upcomingReviews: reviewCycles.map(
        (cycle: { id: string; name: string; end_date: string }) => ({
          cycle_id: cycle.id,
          cycle_name: cycle.name,
          end_date: cycle.end_date,
          has_submitted: submittedCycleIds.has(cycle.id),
        }),
      ),
      upcomingOneOnOne: ((oneOnOneResult.data || []) as RawOneOnOneSlot[]).map(
        (slot) => {
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
        },
      ),
      competencyScores,
    }

    const reviewRows = (reviewSummaryResult.data || []) as Array<{
      overall_percentage: number | null
    }>
    if (reviewRows.length > 0) {
      const avgReview =
        reviewRows.reduce(
          (sum: number, row) => sum + (row.overall_percentage || 0),
          0,
        ) / reviewRows.length
      dashboardData.performanceOverview.reviewScore =
        Math.round(avgReview * 10) / 10
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
    return { success: false, error: t("errorFetchFailed") }
  }
}

"use server"

import { leaveTypeLabel } from "@/shared/lib/leave"
import { createClient } from "@/shared/api/supabase/server"
import { getLocalDateString } from "@/shared/lib/date"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { canManageByRole } from "@/shared/lib/roles"
import { getDailyStats } from "@/entities/attendance/api"
import { getLeaveDashboardStats } from "@/entities/leave/api"
import {
  getTeamKpi,
  type TeamKpiRow,
} from "@/app/(main)/performance/actions/kpi-actions"
import { getDashboardReviewStats } from "@/entities/performance/api"
import type { LeaveRequestWithProfile } from "@/entities/leave/model/types"
import { getCurrentQuarter } from "@/shared/lib/date/quarter"
import { getT } from "@/shared/i18n/server"

import { differenceInBusinessDays, parseISO } from "date-fns"

// Re-exporting the type for the frontend
export type AdminDashboardData = {
  teamMetrics: {
    totalEmployees: number
    pendingReviews: number
    pendingLeaveApprovals: number
    todayAttendanceRate: number
    avgTeamPerformance: number | null
    /** Quarter the team KPI figures are from (the latest with scores). */
    performanceQuarter: string
  }
  performanceDistribution: {
    outstanding: number
    aboveExpectation: number
    meetsExpectation: number
    belowExpectation: number
    needsImprovement: number
  }
  pendingReviewsList: Array<{
    employee_id: string
    employee_name: string | null
    employee_avatar: string | null
    employee_job_title: string | null
    cycle_id: string
    cycle_name: string
    reviewers_pending: number
    total_reviewers: number
  }>
  pendingLeaveApprovals: Array<{
    id: string
    user_id: string
    user_name: string | null
    user_avatar: string | null
    leave_type: string
    start_date: string
    end_date: string
    days_requested: number
    reason: string | null
    created_at: string
  }>
  attendanceOverview: {
    totalToday: number
    onTime: number
    late: number
    onLeave: number
    absent: number
  }
  recentActivities: Array<{
    id: string
    type:
      | "review"
      | "leave_request"
      | "leave_approved"
      | "leave_rejected"
      | "project_assigned"
    user_name: string | null
    user_avatar: string | null
    description: string
    timestamp: string
  }>
  topPerformers: Array<{
    employee_id: string
    employee_name: string | null
    employee_avatar: string | null
    employee_job_title: string | null
    overall_percentage: number
  }>
  employeesNeedingAttention: Array<{
    employee_id: string
    employee_name: string | null
    employee_avatar: string | null
    employee_job_title: string | null
    overall_percentage: number
    reason: string
  }>
}

export async function getAdminDashboardData(): Promise<{
  success: boolean
  data?: AdminDashboardData
  error?: string
}> {
  const t = await getT("dashboard")
  try {
    const supabase = await createClient()

    // Get current user and verify admin/stakeholder role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: t("errorUnauthorized") }
    }

    const profile = await resolveProfileByUserIdOrEmail<{
      id: string
      email: string | null
      role: string | null
    }>(supabase, "id, email, role, created_at", user.id, user.email)

    if (!profile || !canManageByRole(profile.role)) {
      return { success: false, error: t("errorAccessDenied") }
    }

    const todayStr = getLocalDateString()
    const currentQuarter = getCurrentQuarter()

    // Parallel fetch all data using dedicated entity functions
    const [dailyAttendanceStats, leaveStats, reviewStats, kpi, tl] =
      await Promise.all([
        getDailyStats(todayStr),
        getLeaveDashboardStats(),
        getDashboardReviewStats(currentQuarter),
        latestTeamKpi(currentQuarter),
        getT("leave"),
      ])
    const performanceStats = {
      ...reviewStats,
      ...summarizeTeamKpi(kpi.rows, t),
    }
    const leaveType = (type: string) => leaveTypeLabel(type, tl)

    // Build recent activities
    const recentActivities: AdminDashboardData["recentActivities"] = []

    performanceStats.recentReviews.forEach((review) => {
      recentActivities.push({
        id: `review-${review.employee_id}`,
        type: "review",
        user_name: review.profiles?.full_name || null,
        user_avatar: review.profiles?.avatar_url || null,
        description: t("activitySubmittedReview"),
        timestamp: review.created_at,
      })
    })

    // Add recent leave requests
    leaveStats.recentLeaves.forEach((leave: LeaveRequestWithProfile) => {
      let activityType: "leave_request" | "leave_approved" | "leave_rejected" =
        "leave_request"
      let description = t("activityRequestedLeave", {
        type: leaveType(leave.leave_type),
      })

      // Handle type mismatch between DB string and literal type
      const status = leave.status as string

      if (status === "approved") {
        activityType = "leave_approved"
        description = t("activityLeaveApproved", {
          type: leaveType(leave.leave_type),
        })
      } else if (status === "rejected") {
        activityType = "leave_rejected"
        description = t("activityLeaveRejected", {
          type: leaveType(leave.leave_type),
        })
      } else {
        description = t("activityRequestedLeave", {
          type: leaveType(leave.leave_type),
        })
      }

      recentActivities.push({
        id: `leave-${leave.id}`,
        type: activityType,
        user_name: leave.profiles?.full_name || null,
        user_avatar: leave.profiles?.avatar_url || null,
        description,
        timestamp: leave.created_at || new Date().toISOString(), // Fallback
      })
    })

    // Sort activities by timestamp
    recentActivities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

    // Format pending leave approvals for UI
    const pendingLeaveApprovalsFormatted = leaveStats.pendingLeaves.map(
      (leave: LeaveRequestWithProfile) => {
        const daysRequested =
          differenceInBusinessDays(
            parseISO(leave.end_date),
            parseISO(leave.start_date),
          ) + 1

        return {
          id: leave.id.toString(), // Ensure string ID
          user_id: leave.user_id,
          user_name: leave.profiles?.full_name || null,
          user_avatar: leave.profiles?.avatar_url || null,
          leave_type: leaveType(leave.leave_type),
          start_date: leave.start_date,
          end_date: leave.end_date,
          days_requested: daysRequested,
          reason: leave.reason || null,
          created_at: leave.created_at || new Date().toISOString(), // Fallback
        }
      },
    )

    // Build dashboard data
    const dashboardData: AdminDashboardData = {
      teamMetrics: {
        totalEmployees: dailyAttendanceStats.totalEmployees,
        pendingReviews: performanceStats.pendingReviewsList.length,
        pendingLeaveApprovals: leaveStats.pendingCount,
        todayAttendanceRate:
          Math.round(dailyAttendanceStats.attendanceRate * 10) / 10,
        avgTeamPerformance: performanceStats.avgTeamPerformance,
        performanceQuarter: kpi.quarter,
      },
      performanceDistribution: performanceStats.distribution,
      pendingReviewsList: performanceStats.pendingReviewsList,
      pendingLeaveApprovals: pendingLeaveApprovalsFormatted,
      attendanceOverview: {
        totalToday: dailyAttendanceStats.present,
        onTime: dailyAttendanceStats.onTime,
        late: dailyAttendanceStats.late,
        onLeave: dailyAttendanceStats.onLeave,
        absent: Math.max(0, dailyAttendanceStats.absent),
      },
      recentActivities: recentActivities.slice(0, 15),
      topPerformers: performanceStats.topPerformers,
      employeesNeedingAttention: performanceStats.employeesNeedingAttention,
    }

    return { success: true, data: dashboardData }
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error)
    return { success: false, error: t("errorFetchFailed") }
  }
}

/**
 * The team's KPI for the latest quarter that has scores, from the current
 * one back up to three quarters (early in a quarter nothing is scored yet,
 * so the home page would show only dashes).
 */
async function latestTeamKpi(current: string) {
  let [year, q] = current.split("-Q").map(Number)
  let first: { quarter: string; rows: TeamKpiRow[] } | null = null
  for (let i = 0; i < 4; i++) {
    const quarter = `${year}-Q${q}`
    const result = await getTeamKpi(quarter)
    const rows = result.success ? result.data : []
    first ??= { quarter, rows }
    if (rows.some((r) => r.final.score !== null)) return { quarter, rows }
    q -= 1
    if (q === 0) {
      q = 4
      year -= 1
    }
  }
  return first ?? { quarter: current, rows: [] }
}

/** Distribution, average, top and attention lists from the team's final KPI. */
function summarizeTeamKpi(
  rows: TeamKpiRow[],
  t: Awaited<ReturnType<typeof getT<"dashboard">>>,
) {
  const scored = rows
    .filter((r) => r.final.score !== null)
    .map((r) => ({ ...r, score: r.final.score as number }))
    .sort((a, b) => b.score - a.score)
  const distribution = {
    outstanding: 0,
    aboveExpectation: 0,
    meetsExpectation: 0,
    belowExpectation: 0,
    needsImprovement: 0,
  }
  for (const r of scored) {
    if (r.score >= 95) distribution.outstanding++
    else if (r.score >= 85) distribution.aboveExpectation++
    else if (r.score >= 75) distribution.meetsExpectation++
    else if (r.score >= 60) distribution.belowExpectation++
    else distribution.needsImprovement++
  }
  const person = (r: (typeof scored)[number]) => ({
    employee_id: r.id,
    employee_name: r.full_name,
    employee_avatar: r.avatar_url,
    employee_job_title: r.job_title,
    overall_percentage: Math.round(r.score),
  })
  return {
    distribution,
    avgTeamPerformance: scored.length
      ? Math.round(
          (scored.reduce((s, r) => s + r.score, 0) / scored.length) * 10,
        ) / 10
      : null,
    topPerformers: scored.slice(0, 5).map(person),
    employeesNeedingAttention: scored
      .filter((r) => r.score < 75)
      .slice(0, 5)
      .map((r) => ({
        ...person(r),
        reason:
          r.score < 60
            ? t("reasonFarBelowTarget")
            : t("reasonBelowExpectation"),
      })),
  }
}

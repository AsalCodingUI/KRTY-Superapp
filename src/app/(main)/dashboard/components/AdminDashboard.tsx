"use client"

import dynamic from "next/dynamic"
import type { AdminDashboardData } from "../actions/dashboard-admin-actions"

const AdminAttendanceOverview = dynamic(
  () =>
    import("./AdminAttendanceOverview").then(
      (mod) => mod.AdminAttendanceOverview,
    ),
  { loading: () => null },
)

const AdminEmployeeSpotlight = dynamic(
  () =>
    import("./AdminEmployeeSpotlight").then(
      (mod) => mod.AdminEmployeeSpotlight,
    ),
  { loading: () => null },
)

const AdminMetricsOverview = dynamic(
  () =>
    import("./AdminMetricsOverview").then((mod) => mod.AdminMetricsOverview),
  { loading: () => null },
)

const AdminPendingActions = dynamic(
  () => import("./AdminPendingActions").then((mod) => mod.AdminPendingActions),
  { loading: () => null },
)

const AdminPerformanceDistribution = dynamic(
  () =>
    import("./AdminPerformanceDistribution").then(
      (mod) => mod.AdminPerformanceDistribution,
    ),
  { loading: () => null },
)

const AdminRecentActivities = dynamic(
  () =>
    import("./AdminRecentActivities").then((mod) => mod.AdminRecentActivities),
  { loading: () => null },
)

interface AdminDashboardProps {
  data: AdminDashboardData
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <div className="space-y-4">
          <section>
            <AdminMetricsOverview
              totalEmployees={data.teamMetrics.totalEmployees}
              pendingReviews={data.teamMetrics.pendingReviews}
              pendingLeaveApprovals={data.teamMetrics.pendingLeaveApprovals}
              todayAttendanceRate={data.teamMetrics.todayAttendanceRate}
              avgTeamPerformance={data.teamMetrics.avgTeamPerformance}
            />
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <AdminPendingActions
              pendingReviews={data.pendingReviewsList}
              pendingLeaveApprovals={data.pendingLeaveApprovals}
            />

            <AdminRecentActivities activities={data.recentActivities} />
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <AdminAttendanceOverview
              totalToday={data.attendanceOverview.totalToday}
              onTime={data.attendanceOverview.onTime}
              late={data.attendanceOverview.late}
              onLeave={data.attendanceOverview.onLeave}
              absent={data.attendanceOverview.absent}
            />

            <AdminPerformanceDistribution
              distribution={data.performanceDistribution}
            />
          </section>

          <section>
            <AdminEmployeeSpotlight
              topPerformers={data.topPerformers}
              employeesNeedingAttention={data.employeesNeedingAttention}
            />
          </section>
        </div>
      </div>
    </div>
  )
}

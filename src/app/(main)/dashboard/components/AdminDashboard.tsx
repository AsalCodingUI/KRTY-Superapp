"use client"

import type { AdminDashboardData } from "../actions/dashboard-admin-actions"
import { AdminAttendanceOverview } from "./AdminAttendanceOverview"
import { AdminEmployeeSpotlight } from "./AdminEmployeeSpotlight"
import { AdminMetricsOverview } from "./AdminMetricsOverview"
import { AdminPendingActions } from "./AdminPendingActions"
import { AdminPerformanceDistribution } from "./AdminPerformanceDistribution"
import { AdminRecentActivities } from "./AdminRecentActivities"
import { RiBarChartBoxLine } from "@/shared/ui/lucide-icons"

interface AdminDashboardProps {
  data: AdminDashboardData
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
        <RiBarChartBoxLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">
          Dashboard Overview
        </p>
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
        <div className="space-y-6 p-5">
          {/* Key Metrics */}
          <div>
            <h2 className="text-heading-md text-foreground-primary mb-3">
              Key Metrics
            </h2>
            <AdminMetricsOverview
              totalEmployees={data.teamMetrics.totalEmployees}
              pendingReviews={data.teamMetrics.pendingReviews}
              pendingLeaveApprovals={data.teamMetrics.pendingLeaveApprovals}
              todayAttendanceRate={data.teamMetrics.todayAttendanceRate}
              avgTeamPerformance={data.teamMetrics.avgTeamPerformance}
            />
          </div>

          {/* Pending Actions */}
          <div>
            <h2 className="text-heading-md text-foreground-primary mb-3">
              Pending Actions
            </h2>
            <AdminPendingActions
              pendingReviews={data.pendingReviewsList}
              pendingLeaveApprovals={data.pendingLeaveApprovals}
            />
          </div>

          {/* Two Column Layout for Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Performance Distribution */}
            <AdminPerformanceDistribution
              distribution={data.performanceDistribution}
            />

            {/* Attendance Overview */}
            <AdminAttendanceOverview
              totalToday={data.attendanceOverview.totalToday}
              onTime={data.attendanceOverview.onTime}
              late={data.attendanceOverview.late}
              onLeave={data.attendanceOverview.onLeave}
              absent={data.attendanceOverview.absent}
            />
          </div>

          {/* Employee Spotlight */}
          <div>
            <h2 className="text-heading-md text-foreground-primary mb-3">
              Employee Spotlight
            </h2>
            <AdminEmployeeSpotlight
              topPerformers={data.topPerformers}
              employeesNeedingAttention={data.employeesNeedingAttention}
            />
          </div>

          {/* Recent Activities */}
          <div>
            <h2 className="text-heading-md text-foreground-primary mb-3">
              Recent Activities
            </h2>
            <AdminRecentActivities activities={data.recentActivities} />
          </div>
        </div>
      </div>
    </div>
  )
}

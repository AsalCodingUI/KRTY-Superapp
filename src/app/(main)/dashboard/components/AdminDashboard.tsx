"use client"

import { RiBarChartBoxLine } from "@/shared/ui/lucide-icons"
import type { AdminDashboardData } from "../actions/dashboard-admin-actions"
import { AdminAttendanceOverview } from "./AdminAttendanceOverview"
import { AdminEmployeeSpotlight } from "./AdminEmployeeSpotlight"
import { AdminMetricsOverview } from "./AdminMetricsOverview"
import { AdminPendingActions } from "./AdminPendingActions"
import { AdminPerformanceDistribution } from "./AdminPerformanceDistribution"
import { AdminRecentActivities } from "./AdminRecentActivities"

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
        <div className="space-y-5 p-5">
          <AdminMetricsOverview
            totalEmployees={data.teamMetrics.totalEmployees}
            pendingReviews={data.teamMetrics.pendingReviews}
            pendingLeaveApprovals={data.teamMetrics.pendingLeaveApprovals}
            todayAttendanceRate={data.teamMetrics.todayAttendanceRate}
            avgTeamPerformance={data.teamMetrics.avgTeamPerformance}
          />

          <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-label-sm text-foreground-secondary">
                Approvals & Reviews
              </p>
              <AdminPendingActions
                pendingReviews={data.pendingReviewsList}
                pendingLeaveApprovals={data.pendingLeaveApprovals}
              />
            </div>

            <div className="space-y-2">
              <p className="text-label-sm text-foreground-secondary">
                Recent Activities
              </p>
              <AdminRecentActivities activities={data.recentActivities} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-label-sm text-foreground-secondary">
                Attendance
              </p>
              <AdminAttendanceOverview
                totalToday={data.attendanceOverview.totalToday}
                onTime={data.attendanceOverview.onTime}
                late={data.attendanceOverview.late}
                onLeave={data.attendanceOverview.onLeave}
                absent={data.attendanceOverview.absent}
              />
            </div>

            <div className="space-y-2">
              <p className="text-label-sm text-foreground-secondary">
                Performance
              </p>
              <AdminPerformanceDistribution
                distribution={data.performanceDistribution}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-label-sm text-foreground-secondary">
              Employee Spotlight
            </p>
            <AdminEmployeeSpotlight
              topPerformers={data.topPerformers}
              employeesNeedingAttention={data.employeesNeedingAttention}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

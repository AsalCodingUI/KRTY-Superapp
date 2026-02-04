"use client"

import {
  getAdminDashboardData,
  type AdminDashboardData,
} from "@/app/(main)/dashboard/actions/dashboard-admin-actions"
import { AdminAttendanceOverview } from "@/app/(main)/dashboard/components/AdminAttendanceOverview"
import { AdminMetricsOverview } from "@/app/(main)/dashboard/components/AdminMetricsOverview"
import { AdminPerformanceDistribution } from "@/app/(main)/dashboard/components/AdminPerformanceDistribution"
import { AdminRecentActivities } from "@/app/(main)/dashboard/components/AdminRecentActivities"
import { useEffect, useState } from "react"
import {
  AdminChartSkeleton,
  AdminListSkeleton,
  AdminMetricsSkeleton,
} from "./DashboardSkeletons"

export function AdminDashboardMetrics() {
  const [data, setData] = useState<AdminDashboardData | null>(null)

  useEffect(() => {
    getAdminDashboardData().then((res) => {
      if (res.success && res.data) setData(res.data)
    })
  }, [])

  if (!data) return <AdminMetricsSkeleton />

  return (
    <AdminMetricsOverview
      totalEmployees={data.teamMetrics.totalEmployees}
      pendingReviews={data.teamMetrics.pendingReviews}
      pendingLeaveApprovals={data.teamMetrics.pendingLeaveApprovals}
      todayAttendanceRate={data.teamMetrics.todayAttendanceRate}
      avgTeamPerformance={data.teamMetrics.avgTeamPerformance}
    />
  )
}

export function AdminDashboardCharts() {
  const [data, setData] = useState<AdminDashboardData | null>(null)

  useEffect(() => {
    getAdminDashboardData().then((res) => {
      if (res.success && res.data) setData(res.data)
    })
  }, [])

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminChartSkeleton />
        <AdminChartSkeleton />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <AdminPerformanceDistribution
        distribution={data.performanceDistribution}
      />
      <AdminAttendanceOverview
        totalToday={data.attendanceOverview.totalToday}
        onTime={data.attendanceOverview.onTime}
        late={data.attendanceOverview.late}
        onLeave={data.attendanceOverview.onLeave}
        absent={data.attendanceOverview.absent}
      />
    </div>
  )
}

export function AdminDashboardActivities() {
  const [data, setData] = useState<AdminDashboardData | null>(null)

  useEffect(() => {
    getAdminDashboardData().then((res) => {
      if (res.success && res.data) setData(res.data)
    })
  }, [])

  if (!data) return <AdminListSkeleton />

  return <AdminRecentActivities activities={data.recentActivities} />
}

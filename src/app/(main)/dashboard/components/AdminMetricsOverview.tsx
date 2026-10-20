"use client"

import Link from "next/link"

interface AdminMetricsOverviewProps {
  totalEmployees: number
  pendingReviews: number
  pendingLeaveApprovals: number
  todayAttendanceRate: number
  avgTeamPerformance: number | null
}

export function AdminMetricsOverview({
  totalEmployees,
  pendingReviews,
  pendingLeaveApprovals,
  todayAttendanceRate,
  avgTeamPerformance,
}: AdminMetricsOverviewProps) {
  const items = [
    { label: "Total Employees", value: totalEmployees, href: "/teams" },
    {
      label: "Pending Reviews",
      value: pendingReviews,
      href: "/performance?tab=360review",
    },
    { label: "Leave Approvals", value: pendingLeaveApprovals, href: "/leave" },
    {
      label: "Attendance Today",
      value: `${todayAttendanceRate}%`,
      href: "/leave",
    },
    {
      label: "Avg Team Score",
      value: avgTeamPerformance !== null ? `${avgTeamPerformance}%` : "—",
    },
  ]

  return (
    <div className="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-5">
      {items.map((item) => {
        const content = (
          <div className="bg-background md:bg-sidebar flex h-full flex-col gap-1 px-4 py-3 [&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1">
            <p className="text-muted-foreground text-sm font-medium">
              {item.label}
            </p>
            <p className="text-foreground text-lg font-semibold">
              {item.value}
            </p>
          </div>
        )

        if (!item.href) {
          return (
            <div
              key={item.label}
              className="h-full last:col-span-2 lg:last:col-span-1"
            >
              {content}
            </div>
          )
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className="h-full last:col-span-2 lg:last:col-span-1"
          >
            {content}
          </Link>
        )
      })}
    </div>
  )
}

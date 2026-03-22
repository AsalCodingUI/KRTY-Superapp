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
    { label: "Pending Reviews", value: pendingReviews, href: "/performance?tab=360review" },
    { label: "Leave Approvals", value: pendingLeaveApprovals, href: "/leave" },
    { label: "Attendance Today", value: `${todayAttendanceRate}%`, href: "/leave" },
    { label: "Avg Team Score", value: avgTeamPerformance !== null ? `${avgTeamPerformance}%` : "—" },
  ]

  return (
    <div className="grid grid-cols-2 gap-lg lg:grid-cols-5">
      {items.map((item) => {
        const content = (
          <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3">
            <p className="text-label-sm text-foreground-secondary">{item.label}</p>
            <p className="text-heading-md text-foreground-primary">{item.value}</p>
          </div>
        )

        if (!item.href) {
          return <div key={item.label}>{content}</div>
        }

        return (
          <Link key={item.label} href={item.href}>
            {content}
          </Link>
        )
      })}
    </div>
  )
}

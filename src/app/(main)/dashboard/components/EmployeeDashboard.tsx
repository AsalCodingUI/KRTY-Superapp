"use client"

import { Badge } from "@/shared/ui"
import { Card } from "@/shared/ui"
import {
  RiBarChartBoxLine,
  RiCalendarEventLine,
  RiFilePaperLine,
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import Link from "next/link"
import type { EmployeeDashboardData } from "../actions/dashboard-employee-actions"
import { EmployeeAttendanceWidget } from "./EmployeeAttendanceWidget"
import { EmployeePerformanceCards } from "./EmployeePerformanceCards"
import { EmployeeProjectsWidget } from "./EmployeeProjectsWidget"

interface EmployeeDashboardProps {
  data: EmployeeDashboardData
}

export function EmployeeDashboard({ data }: EmployeeDashboardProps) {
  const firstName = data.user.full_name?.split(" ")[0] || "User"

  // Helper to get rating label
  const getRatingLabel = (score: number) => {
    if (score >= 95) return "Outstanding"
    if (score >= 85) return "Above Expectation"
    if (score >= 75) return "Meets Expectation"
    if (score >= 60) return "Below Expectation"
    return "Needs Improvement"
  }

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
          <div>
            <h1 className="text-heading-md text-foreground-primary">
              Welcome back, {firstName}
            </h1>
            <p className="text-body-sm text-foreground-secondary mt-1">
              Here&apos;s your performance overview and updates
            </p>
          </div>

          {/* Performance Overview Cards */}
          <div>
            <h2 className="text-heading-md text-foreground-primary mb-3">
              Performance Overview
            </h2>
            <EmployeePerformanceCards
              slaScore={data.performanceOverview.slaScore}
              reviewScore={data.performanceOverview.reviewScore}
              workQualityScore={data.performanceOverview.workQualityScore}
              quarter={data.performanceOverview.quarter}
            />
          </div>

          {/* Competency Scores */}
          {data.competencyScores && (
            <Card>
              <h3 className="text-heading-md text-foreground-primary mb-4">
                Competency Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                {[
                  {
                    key: "leadership",
                    label: "Leadership",
                    score: data.competencyScores.leadership,
                  },
                  {
                    key: "quality",
                    label: "Quality",
                    score: data.competencyScores.quality,
                  },
                  {
                    key: "reliability",
                    label: "Reliability",
                    score: data.competencyScores.reliability,
                  },
                  {
                    key: "communication",
                    label: "Communication",
                    score: data.competencyScores.communication,
                  },
                  {
                    key: "initiative",
                    label: "Initiative",
                    score: data.competencyScores.initiative,
                  },
                ].map((competency) => (
                  <div key={competency.key} className="text-center">
                    <div className="text-display-xxs text-foreground-primary">
                      {Math.round(competency.score)}%
                    </div>
                    <div className="text-body-xs text-foreground-secondary mt-1">
                      {competency.label}
                    </div>
                    <div className="mt-2">
                      <Badge
                        variant={
                          competency.score >= 85
                            ? "success"
                            : competency.score >= 75
                              ? "info"
                              : "warning"
                        }
                        className="text-body-xs"
                      >
                        {getRatingLabel(competency.score)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Two Column Layout for Projects and Attendance */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Active Projects */}
            <div>
              <EmployeeProjectsWidget
                projects={data.activeProjects}
                userId={data.user.id}
              />
            </div>

            {/* Leave & Attendance */}
            <div>
              <EmployeeAttendanceWidget
                leaveBalance={data.leaveBalance}
                recentAttendance={data.recentAttendance}
                recentLeaveRequests={data.recentLeaveRequests}
              />
            </div>
          </div>

          {/* Upcoming Reviews */}
          {data.upcomingReviews.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-heading-md text-foreground-primary">
                  Upcoming Reviews
                </h3>
                <Link href="/performance?tab=360review">
                  <Badge variant="info">View All</Badge>
                </Link>
              </div>

              <div className="space-y-3">
                {data.upcomingReviews.map((review) => {
                  const daysLeft = Math.ceil(
                    (new Date(review.end_date).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24),
                  )
                  const isUrgent = daysLeft <= 7 && daysLeft >= 0

                  return (
                    <div
                      key={review.cycle_id}
                      className="border-neutral-primary bg-surface-neutral-secondary flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-surface-neutral-secondary text-foreground-secondary flex size-10 items-center justify-center rounded-lg">
                          {review.has_submitted ? (
                            <RiFilePaperLine className="text-foreground-success size-5" />
                          ) : (
                            <RiCalendarEventLine className="text-foreground-brand-primary size-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-foreground-primary text-label-md">
                            {review.cycle_name}
                          </h4>
                          <p className="text-body-xs text-foreground-secondary">
                            Due {format(new Date(review.end_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div>
                        {review.has_submitted ? (
                          <Badge variant="success">Submitted</Badge>
                        ) : isUrgent ? (
                          <Badge variant="warning">Due in {daysLeft} days</Badge>
                        ) : daysLeft < 0 ? (
                          <Badge variant="error">Overdue</Badge>
                        ) : (
                          <Badge variant="info">Pending</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

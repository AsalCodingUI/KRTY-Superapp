"use client"

import { Badge } from "@/shared/ui"
import { Card } from "@/shared/ui"
import { EmptyState, ProgressBar } from "@/shared/ui"
import { QuarterFilter, type QuarterFilterValue } from "@/shared/ui"
import { Spinner } from "@/shared/ui"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import {
  RiBriefcaseLine,
  RiCheckboxCircleLine,
  RiFolderLine,
  RiGroupLine,
  RiLineChartLine,
  RiStarFill,
  RiUserLine,
} from "@/shared/ui/lucide-icons"
import Link from "next/link"
import React, { useEffect, useState } from "react"
import {
  getEmployeeDetail,
  getEmployeeOverview,
  getOverviewStats,
} from "../../actions/employee-kpi-actions"

// Types
type OverviewRow = {
  objective: string
  keyResult: string
  weighted: number | null
  target: number
  result: number | null
  projectId: string | null
  assignmentId: string | null
}

type Assignment = {
  id: string
  role_in_project: string
  weight_in_quarter: number | null
  projects: {
    id: string
    name: string
    description: string | null
    start_date: string
    end_date: string
    quarter_id: string
    status: string
  }
  project_sla_scores: Array<{
    score_achieved: number
    weight_percentage: number
  }>
  project_work_quality_scores: Array<{
    is_achieved: boolean
  }>
}

type TeamStats = {
  totalEmployees: number
  avgPerformance: number
  pendingReviews: number
  activeProjects: number
  distribution: {
    outstanding: number
    aboveExpectation: number
    meetsExpectation: number
    belowExpectation: number
    needsImprovement: number
  }
}

type OverviewTabProps = {
  selectedQuarter?: QuarterFilterValue
  onQuarterChange?: (value: QuarterFilterValue) => void
}

// Helper functions
function getRatingBadge(score: number): {
  variant: "success" | "info" | "warning" | "error"
  label: string
} {
  if (score >= 95) return { variant: "success", label: "Outstanding" }
  if (score >= 85) return { variant: "success", label: "Above Expectation" }
  if (score >= 75) return { variant: "info", label: "Meets Expectation" }
  if (score >= 60) return { variant: "warning", label: "Below Expectation" }
  return { variant: "error", label: "Needs Improvement" }
}

function calculateOverallScore(overview: OverviewRow[]): number | null {
  const validRows = overview.filter(
    (row) => row.result !== null && row.weighted !== null,
  )
  if (validRows.length === 0) return null

  const totalWeight = validRows.reduce(
    (sum, row) => sum + (row.weighted || 0),
    0,
  )
  const weightedSum = validRows.reduce((sum, row) => {
    return sum + ((row.result || 0) * (row.weighted || 0)) / 100
  }, 0)

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : null
}

// Employee Overview Component
function EmployeeOverview({
  selectedQuarter: controlledQuarter,
  onQuarterChange,
}: OverviewTabProps) {
  const { profile } = useUserProfile()
  const [internalQuarter, setInternalQuarter] =
    useState<QuarterFilterValue>("2025-Q1")
  const selectedQuarter = controlledQuarter ?? internalQuarter
  const setSelectedQuarter = onQuarterChange ?? setInternalQuarter
  const [overview, setOverview] = useState<OverviewRow[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) return
      setLoading(true)
      try {
        const [overviewResult, assignmentsResult] = await Promise.all([
          getEmployeeOverview(profile.id, selectedQuarter),
          getEmployeeDetail(profile.id, selectedQuarter),
        ])

        if (overviewResult.success) {
          setOverview(overviewResult.data)
        }
        if (assignmentsResult.success && assignmentsResult.data) {
          setAssignments(
            assignmentsResult.data.assignments as unknown as Assignment[],
          )
        }
      } catch (error) {
        console.error("Error loading overview data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [profile?.id, selectedQuarter])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    )
  }

  const overallScore = calculateOverallScore(overview)
  const slaRow = overview.find((r) => r.objective.includes("SLA"))
  const reviewRow = overview.find((r) => r.objective.includes("360"))
  const qualityRow = overview.find((r) => r.objective.includes("Quality"))
  const activeProjects = assignments.filter(
    (a) => a.projects.status === "Active",
  )

  return (
    <div className="space-y-6">
      {/* QUARTER FILTER */}
      <QuarterFilter value={selectedQuarter} onChange={setSelectedQuarter} />

      {/* SCORECARD SUMMARY */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Overall Score Card */}
        <Card className="border-l-primary flex flex-col justify-between border-l-4">
          <dt className="text-content-subtle text-label-md">Overall Score</dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-content text-display-xs">
              {overallScore !== null ? `${overallScore}%` : "—"}
            </span>
          </dd>
          <div className="mt-4">
            {overallScore !== null ? (
              <Badge variant={getRatingBadge(overallScore).variant}>
                {getRatingBadge(overallScore).label}
              </Badge>
            ) : (
              <Badge variant="zinc">Belum ada data</Badge>
            )}
          </div>
        </Card>

        {/* KPI Achievement Card */}
        <Card>
          <dt className="text-content-subtle text-label-md">KPI SLA Project</dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-content text-display-xs">
              {slaRow?.result !== null ? `${slaRow?.result}%` : "—"}
            </span>
            {slaRow?.target && (
              <span className="text-content-subtle text-body-sm">
                / {slaRow.target}%
              </span>
            )}
          </dd>
          <p className="text-content-subtle text-body-xs mt-4">
            Weight: {slaRow?.weighted || 0}% of total score
          </p>
        </Card>

        {/* 360 Feedback Rating Card */}
        <Card>
          <dt className="text-content-subtle text-label-md">
            360 Feedback Rating
          </dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-content text-display-xs">
              {reviewRow?.result !== null ? `${reviewRow?.result}%` : "—"}
            </span>
            {reviewRow?.result !== null && (
              <div className="text-warning flex">
                {[...Array(5)].map((_, i) => (
                  <RiStarFill
                    key={i}
                    className={`size-4 ${
                      i < Math.round((reviewRow?.result || 0) / 20)
                        ? ""
                        : "opacity-30"
                    }`}
                  />
                ))}
              </div>
            )}
          </dd>
          <p className="text-content-subtle text-body-xs mt-4">
            Weight: {reviewRow?.weighted || 0}% of total score
          </p>
        </Card>
      </div>

      {/* PERFORMANCE DETAILS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* SLA Progress */}
        <Card>
          <h3 className="text-content mb-4 font-semibold">
            SLA Project Progress
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-label-md mb-2 flex justify-between">
                <span className="text-content-subtle">Achievement</span>
                <span className="font-medium">
                  {slaRow?.result !== null ? `${slaRow?.result}%` : "—"}
                </span>
              </div>
              <ProgressBar
                value={slaRow?.result || 0}
                variant={
                  slaRow?.result != null && slaRow.result >= 90
                    ? "success"
                    : slaRow?.result != null && slaRow.result >= 75
                      ? "default"
                      : slaRow?.result != null
                        ? "warning"
                        : "default"
                }
              />
            </div>
            <p className="text-content-subtle text-body-xs">
              Target: {slaRow?.target || 90}% on-time delivery
            </p>
          </div>
        </Card>

        {/* 360 Review Summary */}
        <Card>
          <h3 className="text-content mb-4 font-semibold">
            360 Review Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-content text-display-xxs">
                {reviewRow?.result !== null ? `${reviewRow?.result}%` : "—"}
              </span>
              {reviewRow?.result != null && (
                <Badge variant={getRatingBadge(reviewRow.result).variant}>
                  {getRatingBadge(reviewRow.result).label}
                </Badge>
              )}
            </div>
            <p className="text-content-subtle text-body-xs">
              Peer review score for {selectedQuarter}
            </p>
          </div>
        </Card>

        {/* Work Quality */}
        <Card>
          <h3 className="text-content mb-4 font-semibold">Work Quality</h3>
          <div className="space-y-4">
            <div>
              <div className="text-label-md mb-2 flex justify-between">
                <span className="text-content-subtle">Quality Score</span>
                <span className="font-medium">
                  {qualityRow?.result !== null ? `${qualityRow?.result}%` : "—"}
                </span>
              </div>
              <ProgressBar
                value={qualityRow?.result || 0}
                variant={
                  qualityRow?.result != null && qualityRow.result >= 90
                    ? "success"
                    : qualityRow?.result != null && qualityRow.result >= 75
                      ? "default"
                      : qualityRow?.result != null
                        ? "warning"
                        : "default"
                }
              />
            </div>
            <p className="text-content-subtle text-body-xs">
              Weight: {qualityRow?.weighted || 0}% of total score
            </p>
          </div>
        </Card>
      </div>

      {/* ASSIGNED PROJECTS */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-content font-semibold">Assigned Projects</h3>
          <Badge variant="info">{activeProjects.length} Active</Badge>
        </div>

        {assignments.length === 0 ? (
          <div className="py-8 text-center">
            <RiFolderLine className="text-content-placeholder mx-auto size-12" />
            <p className="text-content-subtle text-body-sm mt-2">
              No projects assigned in this quarter
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.slice(0, 5).map((assignment) => {
              const slaScores = assignment.project_sla_scores || []
              let slaPercent = 0
              if (slaScores.length > 0) {
                const realAchieve = slaScores.reduce(
                  (sum, s) => sum + s.score_achieved,
                  0,
                )
                const bestAchieve = slaScores.reduce(
                  (sum, s) => sum + s.weight_percentage * 120,
                  0,
                )
                slaPercent =
                  bestAchieve > 0
                    ? Math.round((realAchieve / bestAchieve) * 100)
                    : 0
              }

              const qualityScores = assignment.project_work_quality_scores || []
              const qualityAchieved = qualityScores.filter(
                (q) => q.is_achieved,
              ).length

              return (
                <Link
                  key={assignment.id}
                  href={`/performance/employee/${profile?.id}/project/${assignment.projects.id}`}
                  className="block"
                >
                  <div className="border-border bg-surface-secondary hover:bg-hover flex items-center justify-between rounded-lg border p-3 transition-colors">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-content truncate font-medium">
                        {assignment.projects.name}
                      </h4>
                      <p className="text-content-subtle text-body-xs mt-0.5">
                        {assignment.role_in_project}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <Badge
                        variant={
                          assignment.projects.status === "Active"
                            ? "success"
                            : "zinc"
                        }
                      >
                        {assignment.projects.status}
                      </Badge>
                      <div className="text-content-subtle text-body-xs">
                        SLA: {slaPercent}% • Quality: {qualityAchieved}/
                        {qualityScores.length}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
            {assignments.length > 5 && (
              <p className="text-content-subtle text-body-xs mt-2 text-center">
                + {assignments.length - 5} more projects
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

// Stakeholder Overview Component
function StakeholderOverview({
  selectedQuarter: controlledQuarter,
  onQuarterChange,
}: OverviewTabProps) {
  const [internalQuarter, setInternalQuarter] =
    useState<QuarterFilterValue>("2025-Q1")
  const selectedQuarter = controlledQuarter ?? internalQuarter
  const setSelectedQuarter = onQuarterChange ?? setInternalQuarter
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const result = await getOverviewStats(selectedQuarter)
        if (result.success && result.data) {
          setStats(result.data)
        }
      } catch (error) {
        console.error("Error loading team stats:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedQuarter])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    )
  }

  if (!stats) {
    return (
      <EmptyState
        icon={<RiGroupLine className="text-content-placeholder size-12" />}
        title="No data available"
        description="Unable to load team performance data"
      />
    )
  }

  const distributionTotal =
    stats.distribution.outstanding +
    stats.distribution.aboveExpectation +
    stats.distribution.meetsExpectation +
    stats.distribution.belowExpectation +
    stats.distribution.needsImprovement

  return (
    <div className="space-y-6">
      {/* QUARTER FILTER */}
      <QuarterFilter value={selectedQuarter} onChange={setSelectedQuarter} />

      {/* TEAM METRICS */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
              <RiGroupLine className="text-primary size-6" />
            </div>
            <div>
              <dt className="text-content-subtle text-label-md">
                Total Employees
              </dt>
              <dd className="text-content text-display-xxs">
                {stats.totalEmployees}
              </dd>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-success/10 flex h-12 w-12 items-center justify-center rounded-lg">
              <RiLineChartLine className="text-success size-6" />
            </div>
            <div>
              <dt className="text-content-subtle text-label-md">
                Avg. Performance
              </dt>
              <dd className="text-content text-display-xxs">
                {stats.avgPerformance > 0 ? `${stats.avgPerformance}%` : "—"}
              </dd>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-warning/10 flex h-12 w-12 items-center justify-center rounded-lg">
              <RiCheckboxCircleLine className="text-warning size-6" />
            </div>
            <div>
              <dt className="text-content-subtle text-label-md">
                Pending Reviews
              </dt>
              <dd className="text-content text-display-xxs">
                {stats.pendingReviews}
              </dd>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="bg-info/10 flex h-12 w-12 items-center justify-center rounded-lg">
              <RiBriefcaseLine className="text-info size-6" />
            </div>
            <div>
              <dt className="text-content-subtle text-label-md">
                Active Projects
              </dt>
              <dd className="text-content text-display-xxs">
                {stats.activeProjects}
              </dd>
            </div>
          </div>
        </Card>
      </div>

      {/* PERFORMANCE DISTRIBUTION */}
      <Card>
        <h3 className="text-content mb-4 font-semibold">
          Performance Distribution
        </h3>
        {distributionTotal === 0 ? (
          <div className="py-8 text-center">
            <RiUserLine className="text-content-placeholder mx-auto size-12" />
            <p className="text-content-subtle text-body-sm mt-2">
              No performance data available for this quarter
            </p>
          </div>
        ) : (
          <>
            {/* Distribution Bar */}
            <div className="mb-6 flex h-4 overflow-hidden rounded-full">
              {stats.distribution.outstanding > 0 && (
                <div
                  className="bg-chart-1 w-[var(--width)]"
                  style={
                    {
                      "--width": `${(stats.distribution.outstanding / distributionTotal) * 100}%`,
                    } as React.CSSProperties
                  }
                />
              )}
              {stats.distribution.aboveExpectation > 0 && (
                <div
                  className="bg-chart-2 w-[var(--width)]"
                  style={
                    {
                      "--width": `${(stats.distribution.aboveExpectation / distributionTotal) * 100}%`,
                    } as React.CSSProperties
                  }
                />
              )}
              {stats.distribution.meetsExpectation > 0 && (
                <div
                  className="bg-chart-3 w-[var(--width)]"
                  style={
                    {
                      "--width": `${(stats.distribution.meetsExpectation / distributionTotal) * 100}%`,
                    } as React.CSSProperties
                  }
                />
              )}
              {stats.distribution.belowExpectation > 0 && (
                <div
                  className="bg-chart-4 w-[var(--width)]"
                  style={
                    {
                      "--width": `${(stats.distribution.belowExpectation / distributionTotal) * 100}%`,
                    } as React.CSSProperties
                  }
                />
              )}
              {stats.distribution.needsImprovement > 0 && (
                <div
                  className="bg-chart-5 w-[var(--width)]"
                  style={
                    {
                      "--width": `${(stats.distribution.needsImprovement / distributionTotal) * 100}%`,
                    } as React.CSSProperties
                  }
                />
              )}
            </div>

            {/* Distribution Legend */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {[
                {
                  name: "Outstanding",
                  count: stats.distribution.outstanding,
                  color: "bg-chart-1",
                },
                {
                  name: "Above Exp.",
                  count: stats.distribution.aboveExpectation,
                  color: "bg-chart-2",
                },
                {
                  name: "Meets Exp.",
                  count: stats.distribution.meetsExpectation,
                  color: "bg-chart-3",
                },
                {
                  name: "Below Exp.",
                  count: stats.distribution.belowExpectation,
                  color: "bg-chart-4",
                },
                {
                  name: "Needs Imp.",
                  count: stats.distribution.needsImprovement,
                  color: "bg-chart-5",
                },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className={`size-3 rounded-full ${item.color}`} />
                  <div className="text-label-xs">
                    <span className="text-content font-medium">
                      {item.count}
                    </span>{" "}
                    <span className="text-content-subtle">{item.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Link
          href="/performance"
          onClick={() => {
            /* Switch to KPI tab */
          }}
        >
          <Card className="hover:border-primary cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <RiLineChartLine className="text-primary size-5" />
              </div>
              <div>
                <h4 className="text-content font-medium">Manage KPI</h4>
                <p className="text-content-subtle text-label-xs">
                  View and edit employee KPI scores
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link
          href="/performance"
          onClick={() => {
            /* Switch to 360 Review tab */
          }}
        >
          <Card className="hover:border-primary cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-success/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <RiUserLine className="text-success size-5" />
              </div>
              <div>
                <h4 className="text-content font-medium">360 Reviews</h4>
                <p className="text-content-subtle text-label-xs">
                  Monitor peer review progress
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}

// Main Export
export function OverviewTab({
  selectedQuarter,
  onQuarterChange,
}: OverviewTabProps) {
  const { profile, loading: profileLoading } = useUserProfile()

  if (profileLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    )
  }

  const isStakeholder = canManageByRole(profile.role)

  return isStakeholder ? (
    <StakeholderOverview
      selectedQuarter={selectedQuarter}
      onQuarterChange={onQuarterChange}
    />
  ) : (
    <EmployeeOverview
      selectedQuarter={selectedQuarter}
      onQuarterChange={onQuarterChange}
    />
  )
}

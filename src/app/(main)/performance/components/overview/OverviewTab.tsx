"use client"

import { Badge } from "@/components/Badge"
import { Card } from "@/components/Card"
import { EmptyState } from "@/components/EmptyState"
import { ProgressBar } from "@/components/ProgressBar"
import { QuarterFilter, type QuarterFilterValue } from "@/components/QuarterFilter"
import { Spinner } from "@/components/Spinner"
import { useUserProfile } from "@/hooks/useUserProfile"
import {
    RiBriefcaseLine,
    RiCheckboxCircleLine,
    RiFolderLine,
    RiGroupLine,
    RiLineChartLine,
    RiStarFill,
    RiUserLine,
} from "@remixicon/react"
import Link from "next/link"
import { useEffect, useState } from "react"
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

// Helper functions
function getRatingBadge(score: number): { variant: "success" | "info" | "warning" | "error"; label: string } {
    if (score >= 95) return { variant: "success", label: "Outstanding" }
    if (score >= 85) return { variant: "success", label: "Above Expectation" }
    if (score >= 75) return { variant: "info", label: "Meets Expectation" }
    if (score >= 60) return { variant: "warning", label: "Below Expectation" }
    return { variant: "error", label: "Needs Improvement" }
}

function calculateOverallScore(overview: OverviewRow[]): number | null {
    const validRows = overview.filter(row => row.result !== null && row.weighted !== null)
    if (validRows.length === 0) return null

    const totalWeight = validRows.reduce((sum, row) => sum + (row.weighted || 0), 0)
    const weightedSum = validRows.reduce((sum, row) => {
        return sum + ((row.result || 0) * (row.weighted || 0) / 100)
    }, 0)

    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : null
}

// Employee Overview Component
function EmployeeOverview() {
    const { profile } = useUserProfile()
    const [selectedQuarter, setSelectedQuarter] = useState<QuarterFilterValue>("2025-Q1")
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
                    setAssignments(assignmentsResult.data.assignments as unknown as Assignment[])
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
    const slaRow = overview.find(r => r.objective.includes("SLA"))
    const reviewRow = overview.find(r => r.objective.includes("360"))
    const qualityRow = overview.find(r => r.objective.includes("Quality"))
    const activeProjects = assignments.filter(a => a.projects.status === "Active")

    return (
        <div className="space-y-6">
            {/* QUARTER FILTER */}
            <QuarterFilter value={selectedQuarter} onChange={setSelectedQuarter} />

            {/* SCORECARD SUMMARY */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Overall Score Card */}
                <Card className="flex flex-col justify-between border-l-4 border-l-primary">
                    <dt className="text-sm font-medium text-content-subtle">Overall Score</dt>
                    <dd className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-semibold text-content">
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
                    <dt className="text-sm font-medium text-content-subtle">KPI SLA Project</dt>
                    <dd className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-semibold text-content">
                            {slaRow?.result !== null ? `${slaRow?.result}%` : "—"}
                        </span>
                        {slaRow?.target && (
                            <span className="text-sm text-content-subtle">/ {slaRow.target}%</span>
                        )}
                    </dd>
                    <p className="mt-4 text-xs text-content-subtle">
                        Weight: {slaRow?.weighted || 0}% of total score
                    </p>
                </Card>

                {/* 360 Feedback Rating Card */}
                <Card>
                    <dt className="text-sm font-medium text-content-subtle">360 Feedback Rating</dt>
                    <dd className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-semibold text-content">
                            {reviewRow?.result !== null ? `${reviewRow?.result}%` : "—"}
                        </span>
                        {reviewRow?.result !== null && (
                            <div className="flex text-warning">
                                {[...Array(5)].map((_, i) => (
                                    <RiStarFill
                                        key={i}
                                        className={`size-4 ${i < Math.round((reviewRow?.result || 0) / 20)
                                            ? ""
                                            : "opacity-30"
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </dd>
                    <p className="mt-4 text-xs text-content-subtle">
                        Weight: {reviewRow?.weighted || 0}% of total score
                    </p>
                </Card>
            </div>

            {/* PERFORMANCE DETAILS */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* SLA Progress */}
                <Card>
                    <h3 className="font-semibold text-content mb-4">SLA Project Progress</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
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
                        <p className="text-xs text-content-subtle">
                            Target: {slaRow?.target || 90}% on-time delivery
                        </p>
                    </div>
                </Card>

                {/* 360 Review Summary */}
                <Card>
                    <h3 className="font-semibold text-content mb-4">360 Review Summary</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-content">
                                {reviewRow?.result !== null ? `${reviewRow?.result}%` : "—"}
                            </span>
                            {reviewRow?.result != null && (
                                <Badge variant={getRatingBadge(reviewRow.result).variant}>
                                    {getRatingBadge(reviewRow.result).label}
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-content-subtle">
                            Peer review score for {selectedQuarter}
                        </p>
                    </div>
                </Card>

                {/* Work Quality */}
                <Card>
                    <h3 className="font-semibold text-content mb-4">Work Quality</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
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
                        <p className="text-xs text-content-subtle">
                            Weight: {qualityRow?.weighted || 0}% of total score
                        </p>
                    </div>
                </Card>
            </div>

            {/* ASSIGNED PROJECTS */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-content">Assigned Projects</h3>
                    <Badge variant="info">{activeProjects.length} Active</Badge>
                </div>

                {assignments.length === 0 ? (
                    <div className="py-8 text-center">
                        <RiFolderLine className="mx-auto size-12 text-content-placeholder" />
                        <p className="mt-2 text-sm text-content-subtle">
                            No projects assigned in this quarter
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {assignments.slice(0, 5).map(assignment => {
                            const slaScores = assignment.project_sla_scores || []
                            let slaPercent = 0
                            if (slaScores.length > 0) {
                                const realAchieve = slaScores.reduce((sum, s) => sum + s.score_achieved, 0)
                                const bestAchieve = slaScores.reduce((sum, s) => sum + s.weight_percentage * 120, 0)
                                slaPercent = bestAchieve > 0 ? Math.round((realAchieve / bestAchieve) * 100) : 0
                            }

                            const qualityScores = assignment.project_work_quality_scores || []
                            const qualityAchieved = qualityScores.filter(q => q.is_achieved).length

                            return (
                                <Link
                                    key={assignment.id}
                                    href={`/performance/employee/${profile?.id}/project/${assignment.projects.id}`}
                                    className="block"
                                >
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-secondary hover:bg-hover transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-content truncate">
                                                {assignment.projects.name}
                                            </h4>
                                            <p className="text-xs text-content-subtle mt-0.5">
                                                {assignment.role_in_project}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                            <Badge variant={assignment.projects.status === "Active" ? "success" : "zinc"}>
                                                {assignment.projects.status}
                                            </Badge>
                                            <div className="text-xs text-content-subtle">
                                                SLA: {slaPercent}% • Quality: {qualityAchieved}/{qualityScores.length}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                        {assignments.length > 5 && (
                            <p className="text-xs text-content-subtle text-center mt-2">
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
function StakeholderOverview() {
    const [selectedQuarter, setSelectedQuarter] = useState<QuarterFilterValue>("2025-Q1")
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
                icon={<RiGroupLine className="size-12 text-content-placeholder" />}
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
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <RiGroupLine className="size-6 text-primary" />
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-content-subtle">Total Employees</dt>
                            <dd className="text-2xl font-semibold text-content">{stats.totalEmployees}</dd>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                            <RiLineChartLine className="size-6 text-success" />
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-content-subtle">Avg. Performance</dt>
                            <dd className="text-2xl font-semibold text-content">
                                {stats.avgPerformance > 0 ? `${stats.avgPerformance}%` : "—"}
                            </dd>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                            <RiCheckboxCircleLine className="size-6 text-warning" />
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-content-subtle">Pending Reviews</dt>
                            <dd className="text-2xl font-semibold text-content">{stats.pendingReviews}</dd>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                            <RiBriefcaseLine className="size-6 text-info" />
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-content-subtle">Active Projects</dt>
                            <dd className="text-2xl font-semibold text-content">{stats.activeProjects}</dd>
                        </div>
                    </div>
                </Card>
            </div>

            {/* PERFORMANCE DISTRIBUTION */}
            <Card>
                <h3 className="font-semibold text-content mb-4">Performance Distribution</h3>
                {distributionTotal === 0 ? (
                    <div className="py-8 text-center">
                        <RiUserLine className="mx-auto size-12 text-content-placeholder" />
                        <p className="mt-2 text-sm text-content-subtle">
                            No performance data available for this quarter
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Distribution Bar */}
                        <div className="h-4 rounded-full overflow-hidden flex mb-6">
                            {stats.distribution.outstanding > 0 && (
                                <div
                                    className="bg-chart-1"
                                    style={{ width: `${(stats.distribution.outstanding / distributionTotal) * 100}%` }}
                                />
                            )}
                            {stats.distribution.aboveExpectation > 0 && (
                                <div
                                    className="bg-chart-2"
                                    style={{ width: `${(stats.distribution.aboveExpectation / distributionTotal) * 100}%` }}
                                />
                            )}
                            {stats.distribution.meetsExpectation > 0 && (
                                <div
                                    className="bg-chart-3"
                                    style={{ width: `${(stats.distribution.meetsExpectation / distributionTotal) * 100}%` }}
                                />
                            )}
                            {stats.distribution.belowExpectation > 0 && (
                                <div
                                    className="bg-chart-4"
                                    style={{ width: `${(stats.distribution.belowExpectation / distributionTotal) * 100}%` }}
                                />
                            )}
                            {stats.distribution.needsImprovement > 0 && (
                                <div
                                    className="bg-chart-5"
                                    style={{ width: `${(stats.distribution.needsImprovement / distributionTotal) * 100}%` }}
                                />
                            )}
                        </div>

                        {/* Distribution Legend */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            {[
                                { name: "Outstanding", count: stats.distribution.outstanding, color: "bg-chart-1" },
                                { name: "Above Exp.", count: stats.distribution.aboveExpectation, color: "bg-chart-2" },
                                { name: "Meets Exp.", count: stats.distribution.meetsExpectation, color: "bg-chart-3" },
                                { name: "Below Exp.", count: stats.distribution.belowExpectation, color: "bg-chart-4" },
                                { name: "Needs Imp.", count: stats.distribution.needsImprovement, color: "bg-chart-5" },
                            ].map(item => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className={`size-3 rounded-full ${item.color}`} />
                                    <div className="text-xs">
                                        <span className="font-medium text-content">{item.count}</span>{" "}
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
                <Link href="/performance" onClick={() => {/* Switch to KPI tab */ }}>
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <RiLineChartLine className="size-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-medium text-content">Manage KPI</h4>
                                <p className="text-xs text-content-subtle">View and edit employee KPI scores</p>
                            </div>
                        </div>
                    </Card>
                </Link>

                <Link href="/performance" onClick={() => {/* Switch to 360 Review tab */ }}>
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                                <RiUserLine className="size-5 text-success" />
                            </div>
                            <div>
                                <h4 className="font-medium text-content">360 Reviews</h4>
                                <p className="text-xs text-content-subtle">Monitor peer review progress</p>
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
    )
}

// Main Export
export function OverviewTab() {
    const { profile, loading: profileLoading } = useUserProfile()

    if (profileLoading || !profile) {
        return (
            <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
            </div>
        )
    }

    const isStakeholder = (profile as any).role === "stakeholder"

    return isStakeholder ? <StakeholderOverview /> : <EmployeeOverview />
}

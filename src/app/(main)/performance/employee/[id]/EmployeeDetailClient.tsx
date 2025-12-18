"use client"

import { Avatar } from "@/components/Avatar"
import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/Table"
import { TableSection } from "@/components/TableSection"
import { QuarterFilter, type QuarterFilterValue } from "@/components/QuarterFilter"
import { RiArrowLeftLine, RiFolderLine } from "@remixicon/react"
import { format } from "date-fns"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getEmployeeDetail, getEmployeeOverview } from "../../actions/employee-kpi-actions"

type Employee = {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    job_title: string | null
    role: string | null
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

type OverviewRow = {
    objective: string
    keyResult: string
    weighted: number | null
    target: number
    result: number | null
    projectId: string | null
    assignmentId: string | null
}

interface EmployeeDetailClientProps {
    employee: Employee
    initialAssignments: Assignment[]
    showBackButton?: boolean // Show "Back to KPI" button (for admin/stakeholder POV)
}

export function EmployeeDetailClient({ employee, initialAssignments, showBackButton = false }: EmployeeDetailClientProps) {
    const [selectedQuarter, setSelectedQuarter] = useState<QuarterFilterValue>("2025-Q1")
    const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
    const [overview, setOverview] = useState<OverviewRow[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            try {
                // Load assignments
                const assignmentsResult = await getEmployeeDetail(
                    employee.id,
                    selectedQuarter.includes("All") ? undefined : selectedQuarter
                )


                if (assignmentsResult.success && assignmentsResult.data) {
                    setAssignments(assignmentsResult.data.assignments as unknown as Assignment[])
                }

                // Load overview
                const overviewResult = await getEmployeeOverview(
                    employee.id,
                    selectedQuarter.includes("All") ? undefined : selectedQuarter
                )


                if (overviewResult.success) {
                    setOverview(overviewResult.data)
                }
            } catch (error) {
                console.error("Error loading data:", error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [selectedQuarter, employee.id])

    return (
        <div className="space-y-6">
            {/* Back Button - Only for Admin/Stakeholder POV */}
            {showBackButton && (
                <Link href="/performance">
                    <Button variant="ghost" size="sm">
                        <RiArrowLeftLine className="mr-2 size-4" />
                        Back to KPI
                    </Button>
                </Link>
            )}

            {/* Employee Info */}
            <div className="flex items-center gap-4 mt-4">
                <Avatar size="lg" initials={employee.full_name?.[0] || "?"} src={employee.avatar_url || undefined} />
                <div>
                    <h1 className="text-lg font-semibold text-content dark:text-content">{employee.full_name}</h1>
                    <p className="text-sm text-content-subtle dark:text-content-placeholder">
                        {employee.job_title}
                    </p>
                </div>
            </div>

            {/* QUARTER FILTER */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-content dark:text-content">
                    Performance Overview
                </h2>
                <QuarterFilter value={selectedQuarter} onChange={setSelectedQuarter} />
            </div>

            {/* OVERVIEW TABLE */}
            <TableSection
                title={`Quarter ${selectedQuarter.includes("All") ? "Performance" : selectedQuarter}`}
                description="Aggregated KPI scores from all projects"
            >
                {loading ? (
                    <div className="p-8 text-center text-sm text-content-subtle">Loading overview...</div>
                ) : overview.length === 0 ? (
                    <div className="p-8 text-center text-sm text-content-subtle">
                        No data available for this quarter
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeaderCell>Objective</TableHeaderCell>
                                <TableHeaderCell>Key Result</TableHeaderCell>
                                <TableHeaderCell>Weighted (%)</TableHeaderCell>
                                <TableHeaderCell>Target</TableHeaderCell>
                                <TableHeaderCell>Result</TableHeaderCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {overview.map((row, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>{row.objective}</TableCell>
                                    <TableCell>{row.keyResult}</TableCell>
                                    <TableCell>{row.weighted}%</TableCell>
                                    <TableCell>{row.target}</TableCell>
                                    <TableCell>
                                        {row.result !== null ? (
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-content dark:text-content">
                                                    {row.result}%
                                                </span>
                                                <span className="text-sm text-content-subtle dark:text-content-placeholder">
                                                    {(() => {
                                                        if (row.result >= 95) return "Outstanding"
                                                        if (row.result >= 85) return "Above Expectation"
                                                        if (row.result >= 75) return "Meets Expectation"
                                                        if (row.result >= 60) return "Below Expectation"
                                                        return "Needs Improvement"
                                                    })()}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-content-placeholder dark:text-content-subtle italic">
                                                Belum ada data
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </TableSection>

            {/* PROJECT LIST */}
            <TableSection
                title="Assigned Projects"
                description={`Projects assigned in ${selectedQuarter.includes("All") ? "all quarters" : selectedQuarter}`}
            >
                {loading ? (
                    <div className="p-8 text-center text-sm text-content-subtle">Loading projects...</div>
                ) : assignments.length === 0 ? (
                    <div className="p-8 text-center">
                        <RiFolderLine className="mx-auto size-12 text-content-placeholder dark:text-content-subtle" />
                        <p className="mt-2 text-sm text-content-subtle">No projects assigned in this quarter</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeaderCell>Project</TableHeaderCell>
                                <TableHeaderCell>Quarter</TableHeaderCell>
                                <TableHeaderCell>Status</TableHeaderCell>
                                <TableHeaderCell>SLA</TableHeaderCell>
                                <TableHeaderCell>Quality</TableHeaderCell>
                                <TableHeaderCell>Period</TableHeaderCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {assignments.map((assignment) => (
                                <TableRow key={assignment.id}>
                                    <TableCell>
                                        <Link
                                            href={`/performance/employee/${employee.id}/project/${assignment.projects.id}`}
                                            className="font-medium text-content hover:text-primary dark:text-content dark:hover:text-primary"
                                        >
                                            {assignment.projects.name}
                                        </Link>
                                        {assignment.projects.description && (
                                            <p className="mt-0.5 text-xs text-content-subtle dark:text-content-placeholder line-clamp-1">
                                                {assignment.projects.description}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="info">
                                            {assignment.projects.quarter_id}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={assignment.projects.status === "Active" ? "success" : "zinc"}>
                                            {assignment.projects.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="info">
                                            {(() => {
                                                const slaScores = assignment.project_sla_scores || []
                                                if (slaScores.length === 0) return "0%"
                                                const realAchieve = slaScores.reduce((sum, s) => sum + s.score_achieved, 0)
                                                const bestAchieve = slaScores.reduce((sum, s) => sum + (s.weight_percentage * 120), 0)
                                                const percentage = bestAchieve > 0 ? (realAchieve / bestAchieve) * 100 : 0
                                                return `${percentage.toFixed(1)}%`
                                            })()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="success">
                                            {(() => {
                                                const qualityScores = assignment.project_work_quality_scores || []
                                                const achieved = qualityScores.filter(q => q.is_achieved).length
                                                const total = qualityScores.length
                                                return `${achieved}/${total}`
                                            })()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-content-subtle dark:text-content-placeholder">
                                            {format(new Date(assignment.projects.start_date), "MMM d")} -{" "}
                                            {format(new Date(assignment.projects.end_date), "MMM d, yyyy")}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </TableSection>
        </div>
    )
}

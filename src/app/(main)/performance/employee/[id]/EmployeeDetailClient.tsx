"use client"

import type { QuarterFilterValue } from "@/shared/ui"
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSection,
} from "@/shared/ui"
import {
  RiArrowLeftLine,
  RiFolderLine
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"
import {
  getEmployeeDetail,
  getEmployeeOverview,
} from "../../actions/employee-kpi-actions"

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

interface EmployeeDetailClientProps {
  employee: Employee
  initialAssignments: Assignment[]
  showBackButton?: boolean // Show "Back to KPI" button (for admin/stakeholder POV)
  selectedQuarter?: QuarterFilterValue
}

export function EmployeeDetailClient({
  employee,
  initialAssignments,
  showBackButton = false,
  selectedQuarter: controlledQuarter,
}: EmployeeDetailClientProps) {
  const [internalQuarter] = useState<QuarterFilterValue>("2025-Q1")
  const selectedQuarter = controlledQuarter ?? internalQuarter
  const { data, isLoading } = useSWR(
    ["employee-detail-view", employee.id, selectedQuarter],
    async () => {
      const quarter = selectedQuarter.includes("All") ? undefined : selectedQuarter
      const [assignmentsResult, overviewResult] = await Promise.all([
        getEmployeeDetail(employee.id, quarter),
        getEmployeeOverview(employee.id, quarter),
      ])

      return {
        assignments:
          assignmentsResult.success && assignmentsResult.data
            ? (assignmentsResult.data.assignments as unknown as Assignment[])
            : initialAssignments,
        overview: overviewResult.success ? overviewResult.data : [],
      }
    },
    {
      revalidateOnFocus: false,
      fallbackData: {
        assignments: initialAssignments,
        overview: [],
      },
    },
  )

  const assignments = data?.assignments ?? initialAssignments
  const overview = data?.overview ?? []

  return (
    <div className="flex flex-col">

      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl space-y-4">
        {/* Back Button - Only for Admin/Stakeholder POV */}
        {showBackButton && (
          <Link href="/performance">
            <Button variant="ghost" size="sm">
              <RiArrowLeftLine className="mr-2 size-4" />
              Back to KPI
            </Button>
          </Link>
        )}

        {/* Employee Info (Admin/Stakeholder Only) */}
        {showBackButton && (
          <div className="mt-2 flex items-center gap-4">
            <Avatar
              size="lg"
              initials={employee.full_name?.[0] || "?"}
              src={employee.avatar_url || undefined}
            />
            <div>
              <h1 className="text-heading-md text-foreground-primary">
                {employee.full_name}
              </h1>
              <p className="text-label-md text-foreground-secondary">
                {employee.job_title}
              </p>
            </div>
          </div>
        )}

        {/* QUARTER OVERVIEW */}
        <TableSection
          title={`Quarter ${selectedQuarter.includes("All") ? "Performance" : selectedQuarter
            }`}
        >
          {isLoading ? (
            <div className="text-body-sm text-foreground-secondary px-xl pb-xl text-center">
              Loading overview...
            </div>
          ) : overview.length === 0 ? (
            <div className="px-xl pb-xl">
              <EmptyState
                title="No data available for this quarter"
                description="Performance data will appear here once available"
              />
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow className="h-[40px] hover:bg-transparent">
                  <TableHeaderCell>Objective</TableHeaderCell>
                  <TableHeaderCell>Key Result</TableHeaderCell>
                  <TableHeaderCell>Weighted (%)</TableHeaderCell>
                  <TableHeaderCell>Target</TableHeaderCell>
                  <TableHeaderCell>Result</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overview.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className="group transition-colors hover:bg-surface-state-neutral-light-hover"
                  >
                    <TableCell>{row.objective}</TableCell>
                    <TableCell>{row.keyResult}</TableCell>
                    <TableCell>{row.weighted}%</TableCell>
                    <TableCell>{row.target}</TableCell>
                    <TableCell>
                      {row.result !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="text-foreground-primary font-medium">
                            {row.result}%
                          </span>
                          {(() => {
                            if (row.result >= 95)
                              return (
                                <Badge size="sm" variant="success">
                                  Outstanding
                                </Badge>
                              )
                            if (row.result >= 85)
                              return (
                                <Badge size="sm" variant="success">
                                  Above Expectation
                                </Badge>
                              )
                            if (row.result >= 75)
                              return (
                                <Badge size="sm" variant="info">
                                  Meets Expectation
                                </Badge>
                              )
                            if (row.result >= 60)
                              return (
                                <Badge size="sm" variant="warning">
                                  Below Expectation
                                </Badge>
                              )
                            return (
                              <Badge size="sm" variant="error">
                                Needs Improvement
                              </Badge>
                            )
                          })()}
                        </div>
                      ) : (
                        <span className="text-foreground-disable">
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
        <TableSection title="Assigned Projects">
          {isLoading ? (
            <div className="text-body-sm text-foreground-secondary px-xl pb-xl text-center">
              Loading projects...
            </div>
          ) : assignments.length === 0 ? (
            <div className="px-xl pb-xl">
              <EmptyState
                title="No projects assigned in this quarter"
                description="Projects will appear here once assigned"
                icon={<RiFolderLine className="size-5" />}
              />
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow className="h-[40px] hover:bg-transparent">
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
                  <TableRow
                    key={assignment.id}
                    className="group transition-colors hover:bg-surface-state-neutral-light-hover"
                  >
                    <TableCell>
                      <Link
                        href={`/performance/employee/${employee.id}/project/${assignment.projects.id}`}
                        className="text-foreground-primary hover:text-foreground-primary font-medium"
                        title={
                          assignment.projects.description
                            ? `${assignment.projects.name} — ${assignment.projects.description}`
                            : assignment.projects.name
                        }
                      >
                        {assignment.projects.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">
                        {assignment.projects.quarter_id}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          assignment.projects.status === "Active"
                            ? "success"
                            : "zinc"
                        }
                      >
                        {assignment.projects.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">
                        {(() => {
                          const slaScores = assignment.project_sla_scores || []
                          if (slaScores.length === 0) return "0%"
                          const realAchieve = slaScores.reduce(
                            (sum, s) => sum + s.score_achieved,
                            0,
                          )
                          const bestAchieve = slaScores.reduce(
                            (sum, s) => sum + s.weight_percentage * 120,
                            0,
                          )
                          const percentage =
                            bestAchieve > 0
                              ? (realAchieve / bestAchieve) * 100
                              : 0
                          return `${percentage.toFixed(1)}%`
                        })()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">
                        {(() => {
                          const qualityScores =
                            assignment.project_work_quality_scores || []
                          const achieved = qualityScores.filter(
                            (q) => q.is_achieved,
                          ).length
                          const total = qualityScores.length
                          return `${achieved}/${total}`
                        })()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground-primary">
                        {format(
                          new Date(assignment.projects.start_date),
                          "MMM d",
                        )}{" "}
                        -{" "}
                        {format(
                          new Date(assignment.projects.end_date),
                          "MMM d, yyyy",
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableSection>
      </div>
    </div>
  )
} 

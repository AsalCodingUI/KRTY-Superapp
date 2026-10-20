"use client"

import {
  getEmployeeDetail,
  getEmployeeOverview,
} from "@/entities/performance/api/client"
import { EmptyState } from "@/components/empty-state"
import type { QuarterFilterValue } from "@/components/quarter-filter"
import { TableSection } from "@/components/table-section"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RiArrowLeftLine, RiFolderLine } from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { EmployeeProjectView } from "./project/[projectId]/EmployeeProjectView"

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
  weighted: number
  target: number
  result: number | null
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
  const projectBackHref = showBackButton
    ? `/performance/employee/${employee.id}`
    : "/performance"
  const [internalQuarter] = useState<QuarterFilterValue>(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    const q = m <= 3 ? "Q1" : m <= 6 ? "Q2" : m <= 9 ? "Q3" : "Q4"
    return `${y}-${q}`
  })
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Assignment | null>(
    null,
  )
  const router = useRouter()
  const selectedQuarter = controlledQuarter ?? internalQuarter
  const { data, isLoading } = useQuery({
    queryKey: ["employee-detail-view", employee.id, selectedQuarter],
    queryFn: async () => {
      const quarter = selectedQuarter.includes("All")
        ? undefined
        : selectedQuarter
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
    initialData: {
      assignments: initialAssignments,
      overview: [],
    },
  })

  const assignments = (data?.assignments ?? initialAssignments) as Assignment[]
  const overview = (data?.overview ?? []) as OverviewRow[]
  const openProjectModal = (assignment: Assignment) => {
    setSelectedProject(assignment)
    setIsProjectModalOpen(true)
  }
  const handleProjectRowClick = (assignment: Assignment) => {
    if (showBackButton) {
      router.push(
        `/performance/employee/${employee.id}/project/${assignment.projects.id}?back=${encodeURIComponent(projectBackHref)}`,
      )
      return
    }
    openProjectModal(assignment)
  }

  return (
    <div className={showBackButton ? "flex flex-col" : "flex flex-col"}>
      <div
        className={
          showBackButton
            ? "flex flex-col space-y-5 rounded-xl px-4 py-5 xl:px-5"
            : "flex flex-col space-y-5 rounded-xl"
        }
      >
        {/* Back Button - Only for Admin/Stakeholder POV */}
        {showBackButton && (
          <Link href="/performance">
            <Button variant="ghost">
              <RiArrowLeftLine className="mr-2 size-4" />
              Back to KPI
            </Button>
          </Link>
        )}

        {/* Employee Info (Admin/Stakeholder Only) */}
        {showBackButton && (
          <div className="flex items-center gap-4">
            <Avatar className="size-12">
              <AvatarImage src={employee.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {employee.full_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-foreground text-lg font-semibold">
                {employee.full_name}
              </h1>
              <p className="text-muted-foreground text-sm font-medium">
                {employee.job_title}
              </p>
            </div>
          </div>
        )}

        {/* QUARTER OVERVIEW */}
        <TableSection
          title={`Quarter ${
            selectedQuarter.includes("All") ? "Performance" : selectedQuarter
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-8" />
            </div>
          ) : overview.length === 0 ? (
            <div className="px-3 pb-3">
              <EmptyState
                title="No data available for this quarter"
                description="Performance data is not available yet."
                placement="inner"
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-[40px] hover:bg-transparent">
                  <TableHead>Objective</TableHead>
                  <TableHead>Key Result</TableHead>
                  <TableHead>Weighted (%)</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className="group hover:bg-accent transition-colors"
                  >
                    <TableCell>{row.objective}</TableCell>
                    <TableCell>{row.keyResult}</TableCell>
                    <TableCell>{row.weighted}%</TableCell>
                    <TableCell>{row.target}</TableCell>
                    <TableCell>
                      {row.result !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium">
                            {row.result}%
                          </span>
                          {(() => {
                            if (row.result >= 95)
                              return (
                                <Badge variant="success">Outstanding</Badge>
                              )
                            if (row.result >= 85)
                              return (
                                <Badge variant="success">
                                  Above Expectation
                                </Badge>
                              )
                            if (row.result >= 75)
                              return (
                                <Badge variant="info">Meets Expectation</Badge>
                              )
                            if (row.result >= 60)
                              return (
                                <Badge variant="warning">
                                  Below Expectation
                                </Badge>
                              )
                            return (
                              <Badge variant="destructive">
                                Needs Improvement
                              </Badge>
                            )
                          })()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">
                          No data yet
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
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-8" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="px-3 pb-3">
              <EmptyState
                title="No projects assigned in this quarter"
                description="Projects will appear after assignment."
                icon={<RiFolderLine className="size-5" />}
                placement="inner"
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-[40px] hover:bg-transparent">
                  <TableHead>Project</TableHead>
                  <TableHead>Quarter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Period</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow
                    key={assignment.id}
                    className="group hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleProjectRowClick(assignment)}
                  >
                    <TableCell>
                      {showBackButton ? (
                        <Link
                          href={`/performance/employee/${employee.id}/project/${assignment.projects.id}?back=${encodeURIComponent(projectBackHref)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-foreground hover:text-foreground font-medium"
                          title={
                            assignment.projects.description
                              ? `${assignment.projects.name} — ${assignment.projects.description}`
                              : assignment.projects.name
                          }
                        >
                          {assignment.projects.name}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openProjectModal(assignment)
                          }}
                          className="text-foreground hover:text-foreground text-left font-medium"
                          title={
                            assignment.projects.description
                              ? `${assignment.projects.name} — ${assignment.projects.description}`
                              : assignment.projects.name
                          }
                        >
                          {assignment.projects.name}
                        </button>
                      )}
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
                            : "secondary"
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
                      <span className="text-foreground">
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

      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle className="sr-only">
              Project Performance Detail
            </DialogTitle>
          </DialogHeader>
          <div>
            {selectedProject && (
              <EmployeeProjectView
                assignment={selectedProject}
                hideBackButton
                backHref="/performance"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

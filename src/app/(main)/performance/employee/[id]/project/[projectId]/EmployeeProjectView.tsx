"use client"

import { Badge } from "@/shared/ui"
import { Button } from "@/shared/ui"
import { Card } from "@/shared/ui"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/shared/ui"
import { TabNavigation, TabNavigationLink } from "@/shared/ui"
import {
  calculateSLAPercentage,
  calculateWorkQualityPercentage,
  getScoreColor,
  getScoreLabel,
  mapPercentageToScore,
  type Milestone,
} from "@/entities/performance/lib/kpiCalculations"
import { RiArrowLeftLine, RiCheckLine, RiCloseLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  getCompetenciesForRole,
  getProjectScores,
} from "../../../../actions/project-scoring-actions"

type Employee = {
  id: string
  full_name: string | null
}

type Assignment = {
  id: string
  role_in_project: string
  projects: {
    id: string
    name: string
    description: string | null
    start_date: string
    end_date: string
    quarter_id: string
    status: string
  }
}

type Competency = {
  id: string
  name: string
  description: string | null
  isAchieved: boolean
}

type SLAScore = {
  milestone_name: string
  weight_percentage: number
  actual_result: string
  score_achieved: number
  target_percentage: number | null
}

type QualityScore = {
  competency_id: string
  is_achieved: boolean
}

type CompetencyLibraryItem = {
  id: string
  name: string
  description: string | null
}

type TabType = "sla" | "quality"

interface EmployeeProjectViewProps {
  employee: Employee
  assignment: Assignment
}

export function EmployeeProjectView({
  employee,
  assignment,
}: EmployeeProjectViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("sla")
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      name: "Wireframe",
      weight: 30,
      result: "On Time",
      realAchieve: 3000,
      targetPercentage: 120,
    },
    {
      name: "High Fidelity",
      weight: 60,
      result: "On Time",
      realAchieve: 6000,
      targetPercentage: 120,
    },
    {
      name: "Handover",
      weight: 10,
      result: "On Time",
      realAchieve: 1000,
      targetPercentage: 100,
    },
  ])
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load existing scores
        const scoresResult = await getProjectScores(assignment.id)
        if (scoresResult.success && scoresResult.data) {
          // Load SLA scores if they exist
          if (scoresResult.data.slaScores.length > 0) {
            const loadedMilestones: Milestone[] =
              scoresResult.data.slaScores.map((score: SLAScore) => ({
                name: score.milestone_name,
                weight: score.weight_percentage,
                result: score.actual_result as Milestone["result"],
                realAchieve: score.score_achieved,
                targetPercentage: score.target_percentage || 120,
              }))
            setMilestones(loadedMilestones)
          }

          // Load competencies for this role
          const compResult = await getCompetenciesForRole(
            assignment.role_in_project,
          )
          if (compResult.success) {
            const loadedCompetencies = compResult.data.map(
              (comp: CompetencyLibraryItem) => {
                const existingScore = scoresResult.data.qualityScores.find(
                  (qs: QualityScore) => qs.competency_id === comp.id,
                )
                return {
                  id: comp.id,
                  name: comp.name,
                  description: comp.description,
                  isAchieved: existingScore?.is_achieved || false,
                }
              },
            )
            setCompetencies(loadedCompetencies)
          }
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [assignment.id, assignment.role_in_project])

  const totalPercentage = calculateSLAPercentage(milestones)
  const finalScore = mapPercentageToScore(totalPercentage)
  const qualityPercentage = calculateWorkQualityPercentage(competencies)

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <Link href={`/performance/employee/${employee.id}`}>
          <Button variant="ghost" size="sm">
            <RiArrowLeftLine className="mr-2 size-4" />
            Back to {employee.full_name || "Employee"}
          </Button>
        </Link>

        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="text-display-xxs text-content dark:text-content">
              {assignment.projects.name}
            </h1>
            {assignment.projects.description && (
              <p className="text-content-subtle dark:text-content-placeholder mt-1">
                {assignment.projects.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="zinc">Read-Only View</Badge>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {assignment.projects.quarter_id}
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {assignment.role_in_project}
            </Badge>
          </div>
        </div>
      </div>

      {/* KPI OVERVIEW */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <dt className="text-label-md text-content-subtle dark:text-content-subtle">
            SLA Score
          </dt>
          <dd className="text-display-xxs text-content dark:text-content mt-2">
            {totalPercentage.toFixed(1)}%
          </dd>
          <Badge className={`mt-2 ${getScoreColor(finalScore)}`}>
            {getScoreLabel(finalScore)}
          </Badge>
        </Card>
        <Card>
          <dt className="text-label-md text-content-subtle dark:text-content-subtle">
            Work Quality
          </dt>
          <dd className="text-display-xxs text-content dark:text-content mt-2">
            {competencies.filter((c) => c.isAchieved).length}/
            {competencies.length}
          </dd>
          <Badge
            className={`mt-2 ${getScoreColor(mapPercentageToScore(qualityPercentage))}`}
          >
            {getScoreLabel(mapPercentageToScore(qualityPercentage))}
          </Badge>
        </Card>
      </div>

      {/* TAB NAVIGATION */}
      <TabNavigation>
        <TabNavigationLink
          active={activeTab === "sla"}
          onClick={() => setActiveTab("sla")}
        >
          SLA Calculation
        </TabNavigationLink>
        <TabNavigationLink
          active={activeTab === "quality"}
          onClick={() => setActiveTab("quality")}
        >
          Work Quality
        </TabNavigationLink>
      </TabNavigation>

      {/* TAB CONTENT */}
      {activeTab === "sla" ? (
        <div className="space-y-6">
          {/* SLA CALCULATION & PARAMETER - SIDE BY SIDE */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
            {/* SLA CALCULATION TABLE - 70% */}
            <Card className="border-0 p-0 lg:col-span-7">
              <h3 className="text-heading-md text-content dark:text-content mb-6">
                SLA Calculation
              </h3>

              {/* Read-only Table */}
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Milestone</TableHeaderCell>
                    <TableHeaderCell className="text-center">
                      Weight (%)
                    </TableHeaderCell>
                    <TableHeaderCell className="text-center">
                      Result
                    </TableHeaderCell>
                    <TableHeaderCell className="text-center">
                      Real Achieve
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {milestones.map((milestone, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {milestone.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {milestone.weight}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            milestone.result === "Faster"
                              ? "success"
                              : milestone.result === "On Time"
                                ? "info"
                                : "warning"
                          }
                        >
                          {milestone.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {milestone.realAchieve.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="text-center font-semibold">
                      {milestones.reduce((sum, m) => sum + m.weight, 0)}%
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>

            {/* PARAMETER MATRIX - 30% */}
            <Card className="border-0 p-0 lg:col-span-3">
              <h3 className="text-heading-md text-content dark:text-content mb-6">
                Parameter
              </h3>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>%</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Faster</TableCell>
                    <TableCell>120%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>On Time</TableCell>
                    <TableCell>100%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Delay</TableCell>
                    <TableCell>80%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-0 p-0">
          <div className="mb-4">
            <h3 className="text-heading-md text-content dark:text-content">
              Work Quality Assessment
            </h3>
            <p className="text-body-sm text-content-subtle dark:text-content-placeholder">
              Based on {assignment.role_in_project} competencies
            </p>
          </div>

          {loading ? (
            <div className="text-body-sm text-content-subtle p-8 text-center">
              Loading competencies...
            </div>
          ) : competencies.length === 0 ? (
            <div className="text-body-sm text-content-subtle p-8 text-center">
              No competencies found for this role
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Competency</TableHeaderCell>
                  <TableHeaderCell>Description</TableHeaderCell>
                  <TableHeaderCell className="text-center">
                    Status
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {competencies.map((comp) => (
                  <TableRow key={comp.id}>
                    <TableCell className="font-medium">{comp.name}</TableCell>
                    <TableCell
                      className="text-foreground-secondary"
                      title={comp.description || "-"}
                    >
                      <span className="block truncate">
                        {comp.description || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {comp.isAchieved ? (
                        <Badge variant="success">
                          <RiCheckLine className="mr-1 size-3.5" />
                          Achieved
                        </Badge>
                      ) : (
                        <Badge variant="zinc">
                          <RiCloseLine className="mr-1 size-3.5" />
                          Not Achieved
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  )
}

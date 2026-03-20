"use client"

import {
  calculateSLAPercentage,
  calculateWorkQualityPercentage,
  getScoreColor,
  getScoreLabel,
  mapPercentageToScore,
  type Milestone,
} from "@/entities/performance/lib/kpiCalculations"
import {
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
  RiCheckLine,
  RiCloseLine,
} from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  getCompetenciesForRole,
  getProjectScores,
} from "../../../../actions/project-scoring-actions"

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

interface EmployeeProjectViewProps {
  assignment: Assignment
  backHref?: string
  hideBackButton?: boolean
}

export function EmployeeProjectView({
  assignment,
  backHref,
  hideBackButton = false,
}: EmployeeProjectViewProps) {
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
    <div className="flex flex-col">
      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
        <div className="space-y-5 p-5">
          {/* HEADER */}
          <div>
            {!hideBackButton && (
              <Link href={backHref || "/performance"}>
                <Button variant="ghost" size="sm">
                  <RiArrowLeftLine className="mr-2 size-4" />
                  Back to KPI
                </Button>
              </Link>
            )}

            <div className={`${hideBackButton ? "" : "mt-4"} flex items-start justify-between`}>
              <div>
                <h1 className="text-heading-md text-foreground-primary">
                  {assignment.projects.name}
                </h1>
                <div className="mt-1">
                  <p className="text-label-sm text-foreground-secondary">
                    {assignment.projects.description || "..."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="zinc">Read-Only View</Badge>
                <Badge variant="info">{assignment.projects.quarter_id}</Badge>
                <Badge variant="info">{assignment.role_in_project}</Badge>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3">
              <dt className="text-label-sm text-foreground-secondary">
                SLA Score
              </dt>
              <div className="flex items-center gap-2">
                <dd className="text-heading-md text-foreground-primary">
                  {totalPercentage.toFixed(1)}%
                </dd>
                <Badge size="sm" className={`${getScoreColor(finalScore)}`}>
                  {getScoreLabel(finalScore)}
                </Badge>
              </div>
            </div>
            <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3">
              <dt className="text-label-sm text-foreground-secondary">
                Work Quality
              </dt>
              <div className="flex items-center gap-2">
                <dd className="text-heading-md text-foreground-primary">
                  {competencies.filter((c) => c.isAchieved).length}/
                  {competencies.length}
                </dd>
                <Badge size="sm" className={`${getScoreColor(mapPercentageToScore(qualityPercentage))}`}>
                  {getScoreLabel(mapPercentageToScore(qualityPercentage))}
                </Badge>
              </div>
            </div>
          </div>

          {/* SLA CALCULATION & PARAMETER */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-10">
            <TableSection title="SLA Calculation" className="lg:col-span-7">
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
            </TableSection>

            <TableSection title="Parameter" className="lg:col-span-3">
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
            </TableSection>
          </div>

          <TableSection
            title="Work Quality Assessment"
          >
            {loading ? (
              <div className="text-body-sm text-foreground-secondary p-8 text-center">
                Loading competencies...
              </div>
            ) : competencies.length === 0 ? (
              <EmptyState
                placement="inner"
                title="No competencies yet"
                description="No competencies found for this role."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="w-[200px]">Competency</TableHeaderCell>
                      <TableHeaderCell className="min-w-[520px]">Description</TableHeaderCell>
                      <TableHeaderCell className="w-[140px] text-center">
                        Status
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {competencies.map((comp) => (
                      <TableRow key={comp.id}>
                        <TableCell className="font-medium">{comp.name}</TableCell>
                        <TableCell className="text-foreground-secondary whitespace-normal break-words">
                          {comp.description || "..."}
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
              </div>
            )}
          </TableSection>
        </div>
      </div>
    </div>
  )
}

"use client"

import { Badge } from "@/shared/ui"
import { Button } from "@/shared/ui"
import { Card } from "@/shared/ui"
import { Input } from "@/shared/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui"
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
  SLA_PERCENTAGES,
  type Milestone,
  type SLAResult,
} from "@/entities/performance/lib/kpiCalculations"
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiCloseLine,
  RiSave3Line,
} from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  getCompetenciesForRole,
  getProjectScores,
  saveSLAScores,
  saveWorkQualityScores,
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
  } // Object, not array - Supabase returns single object for !inner join
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

interface ProjectScoringClientProps {
  employee: Employee
  assignment: Assignment
}

export function ProjectScoringClient({
  employee,
  assignment,
}: ProjectScoringClientProps) {
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
  const [saving, setSaving] = useState(false)

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
                result: score.actual_result as SLAResult,
                realAchieve: score.score_achieved,
                targetPercentage: score.target_percentage || 120, // Default to 120 if not set
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

  const handleMilestoneChange = (
    index: number,
    field: keyof Milestone,
    value: string | number | SLAResult,
  ) => {
    const updated = [...milestones]
    updated[index] = { ...updated[index], [field]: value }

    // Auto-calculate realAchieve if result or weight changed
    if (field === "result" || field === "weight") {
      const percentage = SLA_PERCENTAGES[updated[index].result]
      updated[index].realAchieve = updated[index].weight * percentage
    }

    setMilestones(updated)
  }

  const handleSaveSLA = async () => {
    setSaving(true)
    try {
      const milestonesData = milestones.map((m) => ({
        name: m.name,
        weight: m.weight,
        result: m.result,
        scoreAchieved: m.realAchieve,
        targetPercentage: m.targetPercentage,
      }))

      const result = await saveSLAScores(assignment.id, milestonesData)
      if (result.success) {
        toast.success("SLA tersimpan")
      } else {
        toast.error("Gagal simpan")
      }
    } catch (error) {
      console.error("Error saving SLA:", error)
      toast.error("Gagal simpan")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleCompetency = (index: number) => {
    const updated = [...competencies]
    updated[index].isAchieved = !updated[index].isAchieved
    setCompetencies(updated)
  }

  const handleSaveQuality = async () => {
    setSaving(true)
    try {
      const competenciesData = competencies.map((c) => ({
        competencyId: c.id,
        isAchieved: c.isAchieved,
      }))

      const result = await saveWorkQualityScores(
        assignment.id,
        competenciesData,
      )
      if (result.success) {
        toast.success("Kualitas tersimpan")
      } else {
        toast.error("Gagal simpan")
      }
    } catch (error) {
      console.error("Error saving quality:", error)
      toast.error("Gagal simpan")
    } finally {
      setSaving(false)
    }
  }

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
          {/* SLA CALCULATOR - FULL WIDTH */}
          <Card className="border-0 p-0">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-heading-md text-content dark:text-content">
                SLA Calculator
              </h3>
              <Button onClick={handleSaveSLA} disabled={saving} size="sm">
                <RiSave3Line className="mr-2 size-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>

            {/* Table-style Form */}
            <div className="space-y-4">
              {/* Header Row - using flex like Timeline Engine */}
              <div className="text-label-md text-content dark:text-content border-border flex gap-4 border-b px-1 pb-2">
                <div className="flex-1">Milestone</div>
                <div className="w-28 text-center">Weight (%)</div>
                <div className="w-40 text-center">Result</div>
                <div className="w-32 text-center">Real Achieve</div>
              </div>

              {/* Data Rows - using flex like Timeline Engine */}
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-center gap-4">
                  {/* Milestone Name */}
                  <Input className="flex-1" value={milestone.name} disabled />

                  {/* Weight */}
                  <Input
                    type="number"
                    className="w-28 text-center"
                    value={milestone.weight}
                    onChange={(e) =>
                      handleMilestoneChange(
                        index,
                        "weight",
                        Number(e.target.value),
                      )
                    }
                  />

                  {/* Result */}
                  <Select
                    value={milestone.result}
                    onValueChange={(v) =>
                      handleMilestoneChange(index, "result", v as SLAResult)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Handover only has On Time and Delay, no Faster */}
                      {milestone.name === "Handover" ? (
                        <>
                          <SelectItem value="On Time">On Time</SelectItem>
                          <SelectItem value="Delay">Delay</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Faster">Faster</SelectItem>
                          <SelectItem value="On Time">On Time</SelectItem>
                          <SelectItem value="Delay">Delay</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Real Achieve (Read-only) */}
                  <Input
                    className="w-32 text-center"
                    value={milestone.realAchieve.toFixed(1)}
                    disabled
                  />
                </div>
              ))}

              {/* Total Row */}
              <div className="border-border border-t pt-4">
                <div className="text-content dark:text-content flex justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    {milestones.reduce((sum, m) => sum + m.weight, 0)}%
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* PARAMETER MATRIX & FINAL SCORE - BELOW */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-0 p-0">
              <h3 className="text-heading-md text-content dark:text-content mb-4">
                Parameter Matrix
              </h3>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>SLA Status</TableHeaderCell>
                    <TableHeaderCell>Percentage</TableHeaderCell>
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

            <Card className="border-0 p-0">
              <h3 className="text-heading-md text-content dark:text-content mb-4">
                Final Score
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-body-sm text-content-subtle dark:text-content-placeholder">
                    Total Nilai
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-display-xxs text-content dark:text-content">
                      {totalPercentage.toFixed(1)}%
                    </p>
                    <Badge className={getScoreColor(finalScore)}>
                      {getScoreLabel(finalScore)}
                    </Badge>
                  </div>
                </div>

                {/* Ruler Visual */}
                <div>
                  <p className="text-body-sm text-content-subtle dark:text-content-placeholder mb-2">
                    Score Ruler
                  </p>
                  <div className="text-body-xs grid grid-cols-5 gap-2 text-center">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <div
                        key={score}
                        className={`rounded p-2 ${
                          score === finalScore
                            ? getScoreColor(score)
                            : "bg-muted text-content-placeholder dark:bg-hover"
                        }`}
                      >
                        <div className="font-semibold">{score}</div>
                        <div className="text-label-xs mt-1">
                          {score === 1 && "< 76%"}
                          {score === 2 && "76-83.9%"}
                          {score === 3 && "84-91.9%"}
                          {score === 4 && "92-99.9%"}
                          {score === 5 && "≥ 100%"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-0 p-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-heading-md text-content dark:text-content">
                Work Quality Assessment
              </h3>
              <p className="text-body-sm text-content-subtle dark:text-content-placeholder">
                Based on {assignment.role_in_project} competencies
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-label-md text-content-subtle dark:text-content-placeholder">
                  Quality Score
                </p>
                <p className="text-display-xxs text-content dark:text-content">
                  {competencies.filter((c) => c.isAchieved).length}/
                  {competencies.length}
                </p>
              </div>
              <Button onClick={handleSaveQuality} disabled={saving}>
                <RiSave3Line className="mr-2 size-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
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
                    Achieved
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {competencies.map((comp, index) => (
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
                      <Button
                        variant={comp.isAchieved ? "primary" : "tertiary"}
                        size="sm"
                        onClick={() => handleToggleCompetency(index)}
                      >
                        {comp.isAchieved ? (
                          <>
                            <RiCheckLine className="mr-1 size-3.5" />Y
                          </>
                        ) : (
                          <>
                            <RiCloseLine className="mr-1 size-3.5" />N
                          </>
                        )}
                      </Button>
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

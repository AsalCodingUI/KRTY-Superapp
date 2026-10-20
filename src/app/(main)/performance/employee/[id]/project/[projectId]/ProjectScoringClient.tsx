"use client"

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
import { EmptyState } from "@/components/empty-state"
import { TableSection } from "@/components/table-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiCloseLine,
  RiSave3Line,
} from "@/shared/ui/lucide-icons"
import Link from "next/link"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react"
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

interface ProjectScoringClientProps {
  employee: Employee
  assignment: Assignment
  backHref?: string
  hideBackButton?: boolean
  onDirtyChange?: (dirty: boolean) => void
}

export type ProjectScoringClientHandle = {
  saveAll: () => Promise<void>
}

export const ProjectScoringClient = forwardRef<
  ProjectScoringClientHandle,
  ProjectScoringClientProps
>(function ProjectScoringClient(
  { employee, assignment, backHref, hideBackButton = false, onDirtyChange },
  ref,
) {
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
  const [dirtySLA, setDirtySLA] = useState(false)
  const [dirtyQuality, setDirtyQuality] = useState(false)

  const isDirty = dirtySLA || dirtyQuality

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

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
    setDirtySLA(true)
  }

  const handleSaveSLA = useCallback(async () => {
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
        setDirtySLA(false)
      } else {
        toast.error("Gagal simpan")
      }
    } catch (error) {
      console.error("Error saving SLA:", error)
      toast.error("Gagal simpan")
    } finally {
      setSaving(false)
    }
  }, [assignment.id, milestones])

  const handleToggleCompetency = (index: number) => {
    const updated = [...competencies]
    updated[index].isAchieved = !updated[index].isAchieved
    setCompetencies(updated)
    setDirtyQuality(true)
  }

  const handleSaveQuality = useCallback(async () => {
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
        setDirtyQuality(false)
      } else {
        toast.error("Gagal simpan")
      }
    } catch (error) {
      console.error("Error saving quality:", error)
      toast.error("Gagal simpan")
    } finally {
      setSaving(false)
    }
  }, [assignment.id, competencies])

  useImperativeHandle(
    ref,
    () => ({
      saveAll: async () => {
        await handleSaveSLA()
        await handleSaveQuality()
      },
    }),
    [handleSaveSLA, handleSaveQuality],
  )

  useImperativeHandle(
    ref,
    () => ({
      saveAll: async () => {
        await handleSaveSLA()
        await handleSaveQuality()
      },
    }),
    [handleSaveSLA, handleSaveQuality],
  )

  const totalPercentage = calculateSLAPercentage(milestones)
  const finalScore = mapPercentageToScore(totalPercentage)
  const qualityPercentage = calculateWorkQualityPercentage(competencies)

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <div className="space-y-4 py-5">
          {/* HEADER */}
          <div>
            {!hideBackButton && (
              <Link href={backHref || `/performance/employee/${employee.id}`}>
                <Button variant="ghost">
                  <RiArrowLeftLine className="mr-2 size-4" />
                  Back to {employee.full_name || "Employee"}
                </Button>
              </Link>
            )}

            <div
              className={`${hideBackButton ? "" : "mt-4"} flex items-start justify-between`}
            >
              <div>
                <h1 className="text-foreground text-2xl font-medium tracking-tight tabular-nums">
                  {assignment.projects.name}
                </h1>
                {assignment.projects.description && (
                  <p className="text-muted-foreground mt-1 text-sm font-medium">
                    {assignment.projects.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info">{assignment.projects.quarter_id}</Badge>
                <Badge variant="info">{assignment.role_in_project}</Badge>
              </div>
            </div>
          </div>

          {/* KPI OVERVIEW */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 py-2 md:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1">
              <dt className="text-muted-foreground text-sm">SLA Score</dt>
              <div className="flex items-center gap-2">
                <dd className="text-foreground text-2xl font-medium tracking-tight tabular-nums">
                  {totalPercentage.toFixed(1)}%
                </dd>
                <Badge
                  variant="secondary"
                  className={`${getScoreColor(finalScore)}`}
                >
                  {getScoreLabel(finalScore)}
                </Badge>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <dt className="text-muted-foreground text-sm">Work Quality</dt>
              <div className="flex items-center gap-2">
                <dd className="text-foreground text-2xl font-medium tracking-tight tabular-nums">
                  {competencies.filter((c) => c.isAchieved).length}/
                  {competencies.length}
                </dd>
                <Badge
                  variant="secondary"
                  className={`${getScoreColor(mapPercentageToScore(qualityPercentage))}`}
                >
                  {getScoreLabel(mapPercentageToScore(qualityPercentage))}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-10">
              <TableSection
                title="SLA Calculation"
                className="lg:col-span-7"
                actions={
                  <Button onClick={handleSaveSLA} disabled={saving}>
                    <RiSave3Line className="mr-2 size-4" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                }
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Milestone</TableHead>
                      <TableHead className="text-center">Weight (%)</TableHead>
                      <TableHead className="text-center">Result</TableHead>
                      <TableHead className="text-center">
                        Real Achieve
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {milestones.map((milestone, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {milestone.name}
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            className="mx-auto w-20 text-center"
                            value={milestone.weight}
                            onChange={(e) =>
                              handleMilestoneChange(
                                index,
                                "weight",
                                Number(e.target.value),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Select
                            value={milestone.result}
                            onValueChange={(v) =>
                              handleMilestoneChange(
                                index,
                                "result",
                                v as SLAResult,
                              )
                            }
                          >
                            <SelectTrigger className="mx-auto w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {milestone.name === "Handover" ? (
                                <>
                                  <SelectItem value="On Time">
                                    On Time
                                  </SelectItem>
                                  <SelectItem value="Delay">Delay</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="Faster">Faster</SelectItem>
                                  <SelectItem value="On Time">
                                    On Time
                                  </SelectItem>
                                  <SelectItem value="Delay">Delay</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
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
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>%</TableHead>
                    </TableRow>
                  </TableHeader>
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
              actions={
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {competencies.filter((c) => c.isAchieved).length}/
                    {competencies.length} Achieved
                  </Badge>
                  <Button onClick={handleSaveQuality} disabled={saving}>
                    <RiSave3Line className="mr-2 size-4" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              }
            >
              {loading ? (
                <div className="text-muted-foreground p-8 text-center text-sm">
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
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Competency</TableHead>
                        <TableHead className="min-w-[520px]">
                          Description
                        </TableHead>
                        <TableHead className="w-[160px] text-center">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competencies.map((comp, index) => (
                        <TableRow key={comp.id}>
                          <TableCell className="font-medium">
                            {comp.name}
                          </TableCell>
                          <TableCell
                            className="text-muted-foreground break-words whitespace-normal"
                            title={comp.description || "-"}
                          >
                            {comp.description || "..."}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant={comp.isAchieved ? "default" : "outline"}
                              onClick={() => handleToggleCompetency(index)}
                            >
                              {comp.isAchieved ? (
                                <>
                                  <RiCheckLine className="mr-1 size-3.5" />
                                  Achieved
                                </>
                              ) : (
                                <>
                                  <RiCloseLine className="mr-1 size-3.5" />
                                  Not Achieved
                                </>
                              )}
                            </Button>
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
    </div>
  )
})

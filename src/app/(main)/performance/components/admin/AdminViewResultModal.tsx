"use client"

import {
  calculateSkillPercentage,
  getRatingBadgeVariant,
  getRatingLevel,
  getSkillRating,
} from "@/entities/performance/lib/performanceUtils"
import { Database } from "@/shared/types/database.types"
import { RadarChart } from "@/components/charts/radar-chart"
import { EmptyState } from "@/components/empty-state"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RiBarChartBoxLine } from "@/shared/ui/lucide-icons"
import { ReviewStatsHeader } from "../360-review/ReviewStatsHeader"

const toBadgeVariant = (variant: ReturnType<typeof getRatingBadgeVariant>) =>
  variant === "error" ? "destructive" : variant === "default" ? "secondary" : variant

type PerformanceSummary =
  Database["public"]["Tables"]["performance_summaries"]["Row"]

// Type for the employee data passed from parent
type ReviewStatus = {
  userId: string
  name: string
  jobTitle: string
  reviewedBy: { name: string }[]
  pendingBy: { name: string }[]
  percentage: number
  cycleIdUsed: string | null
  summaryData: PerformanceSummary | null
  debugInfo?: string
}

interface AdminViewResultModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  employee: ReviewStatus | null
  selectedQuarter: string
  currentYear: number
}

export function AdminViewResultModal({
  isOpen,
  onOpenChange,
  employee,
  selectedQuarter,
  currentYear,
}: AdminViewResultModalProps) {
  // Calculate skill ratings using imported utilities
  const calculateSkillRatings = () => {
    if (!employee?.summaryData) return null

    const leadership = calculateSkillPercentage(
      Number(employee.summaryData.score_leadership),
    )
    const quality = calculateSkillPercentage(
      Number(employee.summaryData.score_quality),
    )
    const reliability = calculateSkillPercentage(
      Number(employee.summaryData.score_reliability),
    )
    const communication = calculateSkillPercentage(
      Number(employee.summaryData.score_communication),
    )
    const initiative = calculateSkillPercentage(
      Number(employee.summaryData.score_initiative),
    )

    return {
      leadership: getSkillRating(leadership),
      quality: getSkillRating(quality),
      reliability: getSkillRating(reliability),
      communication: getSkillRating(communication),
      initiative: getSkillRating(initiative),
    }
  }

  // Prepare radar chart data
  const getRadarData = () => {
    if (!employee?.summaryData) return []
    return [
      {
        skill: "Quality",
        Self: 0,
        Peers: Number(employee.summaryData.score_quality) || 0,
      },
      {
        skill: "Reliability",
        Self: 0,
        Peers: Number(employee.summaryData.score_reliability) || 0,
      },
      {
        skill: "Communication",
        Self: 0,
        Peers: Number(employee.summaryData.score_communication) || 0,
      },
      {
        skill: "Initiative",
        Self: 0,
        Peers: Number(employee.summaryData.score_initiative) || 0,
      },
      {
        skill: "Leadership",
        Self: 0,
        Peers: Number(employee.summaryData.score_leadership) || 0,
      },
    ]
  }

  const skillRatings = calculateSkillRatings()
  const radarData = getRadarData()
  const summaryData = employee?.summaryData
  const overallScore = summaryData ? Number(summaryData.overall_score) : 0
  const overallPercentage = summaryData
    ? (summaryData.overall_percentage ?? 0)
    : 0
  const ratingLevel = summaryData ? getRatingLevel(overallPercentage) : "-"
  const totalReviewers =
    summaryData?.total_user ?? employee?.reviewedBy.length ?? 0
  const displayQuarter = selectedQuarter.includes("-")
    ? selectedQuarter
    : `${currentYear}-${selectedQuarter}`

  if (!employee) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Performance Review: {employee.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-body-sm text-muted-foreground">
            {employee.jobTitle} • {displayQuarter}
          </p>
          {summaryData ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
              <div className="lg:col-span-4">
                <Accordion type="multiple" defaultValue={["executive-summary"]}>
                  <AccordionItem value="executive-summary">
                    <AccordionTrigger className="text-label-md px-4 py-3">
                      <span className="font-medium">Executive Summary</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground text-body-sm whitespace-pre-line">
                        {summaryData.additional_feedback ||
                          "No summary available."}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="keep-doing">
                    <AccordionTrigger className="text-label-md px-4 py-3">
                      <span className="font-medium">Keep Doing</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground text-body-sm whitespace-pre-line">
                        {summaryData.feedback_continue || "No data available."}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="start-doing">
                    <AccordionTrigger className="text-label-md px-4 py-3">
                      <span className="font-medium">Start Doing</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground text-body-sm whitespace-pre-line">
                        {summaryData.feedback_start || "No data available."}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="stop-doing">
                    <AccordionTrigger className="text-label-md px-4 py-3">
                      <span className="font-medium">Stop Doing</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground text-body-sm whitespace-pre-line">
                        {summaryData.feedback_stop || "No data available."}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-3">
                <ReviewStatsHeader
                  selectedQuarter={displayQuarter}
                  totalReviewers={totalReviewers}
                  overallScore={overallScore}
                  overallPercentage={overallPercentage}
                  ratingLevel={ratingLevel}
                />

                <Card className="gap-0 p-4">
                  <h3 className="text-label-sm text-muted-foreground mb-4 font-medium">
                    Competency Matrix
                  </h3>
                  <div className="flex justify-center">
                    <RadarChart
                      data={radarData}
                      index="skill"
                      categories={["Self", "Peers"]}
                      colors={["chart-1", "chart-2"]}
                      showLegend={false}
                      showTooltip={false}
                      className="h-64"
                    />
                  </div>
                  {skillRatings && (
                    <div className="border-border space-y-3 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-label-sm text-muted-foreground">
                          Leadership
                        </span>
                        <Badge
                          variant={toBadgeVariant(getRatingBadgeVariant(
                            skillRatings.leadership,
                          ))}
                        >
                          {skillRatings.leadership}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-sm text-muted-foreground">
                          Quality
                        </span>
                        <Badge
                          variant={toBadgeVariant(getRatingBadgeVariant(skillRatings.quality))}
                        >
                          {skillRatings.quality}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-sm text-muted-foreground">
                          Reliability
                        </span>
                        <Badge
                          variant={toBadgeVariant(getRatingBadgeVariant(
                            skillRatings.reliability,
                          ))}
                        >
                          {skillRatings.reliability}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-sm text-muted-foreground">
                          Communication
                        </span>
                        <Badge
                          variant={toBadgeVariant(getRatingBadgeVariant(
                            skillRatings.communication,
                          ))}
                        >
                          {skillRatings.communication}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-sm text-muted-foreground">
                          Initiative
                        </span>
                        <Badge
                          variant={toBadgeVariant(getRatingBadgeVariant(
                            skillRatings.initiative,
                          ))}
                        >
                          {skillRatings.initiative}
                        </Badge>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No performance data available"
              description="Review data is not ready yet."
              icon={<RiBarChartBoxLine className="size-5" />}
              placement="inner"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

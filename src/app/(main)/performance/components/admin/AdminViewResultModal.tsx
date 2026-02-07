"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui"
import { Badge } from "@/shared/ui"
import { Card } from "@/shared/ui"
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui"
import { EmptyState, RadarChart } from "@/shared/ui"
import { Database } from "@/shared/types/database.types"
import {
  calculateSkillPercentage,
  getRatingBadgeVariant,
  getRatingLevel,
  getSkillRating,
} from "@/entities/performance/lib/performanceUtils"
import { ReviewStatsHeader } from "../360-review/ReviewStatsHeader"

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
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Performance Review: {employee.name}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        <DialogBody className="space-y-6">
          <p className="text-body-sm text-content-subtle">
            {employee.jobTitle} • {displayQuarter}
          </p>
          {summaryData ? (
            <div className="grid grid-cols-1 gap-md lg:grid-cols-6">
              <div className="lg:col-span-4">
                <Accordion type="multiple" defaultValue={["executive-summary"]}>
                  <AccordionItem value="executive-summary">
                    <AccordionTrigger className="text-label-md px-4 py-3">
                      <span className="font-medium">Executive Summary</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-content-subtle text-body-sm whitespace-pre-line">
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
                      <p className="text-content-subtle text-body-sm whitespace-pre-line">
                        {summaryData.feedback_continue || "No data available."}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="start-doing">
                    <AccordionTrigger className="text-label-md px-4 py-3">
                      <span className="font-medium">Start Doing</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-content-subtle text-body-sm whitespace-pre-line">
                        {summaryData.feedback_start || "No data available."}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="stop-doing">
                    <AccordionTrigger className="text-label-md px-4 py-3">
                      <span className="font-medium">Stop Doing</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-content-subtle text-body-sm whitespace-pre-line">
                        {summaryData.feedback_stop || "No data available."}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-md">
                <ReviewStatsHeader
                  selectedQuarter={displayQuarter}
                  totalReviewers={totalReviewers}
                  overallScore={overallScore}
                  overallPercentage={overallPercentage}
                  ratingLevel={ratingLevel}
                />

                <Card>
                  <h3 className="text-label-sm text-foreground-secondary mb-4 font-medium">
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
                        <span className="text-label-sm text-foreground-secondary">
                          Leadership
                        </span>
                        <Badge
                          variant={getRatingBadgeVariant(
                            skillRatings.leadership,
                          )}
                        >
                          {skillRatings.leadership}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-sm text-foreground-secondary">
                          Quality
                        </span>
                        <Badge
                          variant={getRatingBadgeVariant(skillRatings.quality)}
                        >
                          {skillRatings.quality}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-sm text-foreground-secondary">
                          Reliability
                        </span>
                        <Badge
                          variant={getRatingBadgeVariant(
                            skillRatings.reliability,
                          )}
                        >
                          {skillRatings.reliability}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-sm text-foreground-secondary">
                          Communication
                        </span>
                        <Badge
                          variant={getRatingBadgeVariant(
                            skillRatings.communication,
                          )}
                        >
                          {skillRatings.communication}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-sm text-foreground-secondary">
                          Initiative
                        </span>
                        <Badge
                          variant={getRatingBadgeVariant(
                            skillRatings.initiative,
                          )}
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
              description="Performance review data for this employee will appear here once processed"
              icon={null}
              variant="compact"
            />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

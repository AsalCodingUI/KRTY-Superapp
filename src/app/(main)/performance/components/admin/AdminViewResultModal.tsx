"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/Accordion"
import { Badge } from "@/components/Badge"
import { Card } from "@/components/Card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/Dialog"
import { EmptyState } from "@/components/EmptyState"
import { RadarChart } from "@/components/RadarChart"
import { Database } from "@/lib/database.types"
import {
    calculateSkillPercentage,
    getRatingBadgeVariant,
    getRatingLevel,
    getSkillRating
} from "@/lib/performanceUtils"

type PerformanceSummary = Database["public"]["Tables"]["performance_summaries"]["Row"]

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
    currentYear
}: AdminViewResultModalProps) {
    // Calculate skill ratings using imported utilities
    const calculateSkillRatings = () => {
        if (!employee?.summaryData) return null

        const leadership = calculateSkillPercentage(Number(employee.summaryData.score_leadership))
        const quality = calculateSkillPercentage(Number(employee.summaryData.score_quality))
        const reliability = calculateSkillPercentage(Number(employee.summaryData.score_reliability))
        const communication = calculateSkillPercentage(Number(employee.summaryData.score_communication))
        const initiative = calculateSkillPercentage(Number(employee.summaryData.score_initiative))

        return {
            leadership: getSkillRating(leadership),
            quality: getSkillRating(quality),
            reliability: getSkillRating(reliability),
            communication: getSkillRating(communication),
            initiative: getSkillRating(initiative)
        }
    }

    // Prepare radar chart data
    const getRadarData = () => {
        if (!employee?.summaryData) return []
        return [
            { skill: "Quality", Self: 0, Peers: Number(employee.summaryData.score_quality) || 0 },
            { skill: "Reliability", Self: 0, Peers: Number(employee.summaryData.score_reliability) || 0 },
            { skill: "Communication", Self: 0, Peers: Number(employee.summaryData.score_communication) || 0 },
            { skill: "Initiative", Self: 0, Peers: Number(employee.summaryData.score_initiative) || 0 },
            { skill: "Leadership", Self: 0, Peers: Number(employee.summaryData.score_leadership) || 0 },
        ]
    }

    const skillRatings = calculateSkillRatings()
    const radarData = getRadarData()
    const summaryData = employee?.summaryData
    const overallScore = summaryData ? Number(summaryData.overall_score) : 0
    const overallPercentage = summaryData ? summaryData.overall_percentage ?? 0 : 0
    const ratingLevel = summaryData ? getRatingLevel(overallPercentage) : "-"

    if (!employee) return null

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Performance Review: {employee.name}</DialogTitle>
                    <p className="text-sm text-content-subtle">{employee.jobTitle} • {selectedQuarter} {currentYear}</p>
                </DialogHeader>

                {summaryData ? (
                    <div className="space-y-6 mt-4">
                        {/* Stats Header - Similar to ReviewStatsHeader */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="p-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-content-subtle dark:text-content-placeholder">Quarter</span>
                                    <Badge>{selectedQuarter} {currentYear}</Badge>
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-content-subtle dark:text-content-placeholder">Reviewer Count</span>
                                    <p className="text-sm font-medium text-content-subtle dark:text-content-subtle">{employee.reviewedBy.length} Peers</p>
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-content-subtle dark:text-content-placeholder">Score</span>
                                    <p className="text-sm font-medium text-content-subtle dark:text-content-subtle">{overallScore.toFixed(1)}</p>
                                    <Badge variant={getRatingBadgeVariant(ratingLevel)}>
                                        {ratingLevel}
                                    </Badge>
                                </div>
                            </Card>
                        </div>

                        {/* Main Content - Matching EmployeeReviewView layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            {/* LEFT COLUMN - Accordion Feedback */}
                            <div className="space-y-4">
                                <Accordion type="multiple" defaultValue={["executive-summary"]}>
                                    <AccordionItem value="executive-summary">
                                        <AccordionTrigger>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Executive Summary</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <p className="text-sm text-content-subtle dark:text-content-subtle whitespace-pre-line leading-relaxed">
                                                {summaryData.additional_feedback || "No summary available."}
                                            </p>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="keep-doing">
                                        <AccordionTrigger>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="continue">CONTINUE</Badge>
                                                <span className="font-medium">Keep Doing</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <p className="text-sm text-content-subtle dark:text-content-subtle whitespace-pre-line">
                                                {summaryData.feedback_continue || "No data available."}
                                            </p>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="start-doing">
                                        <AccordionTrigger>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="start">START</Badge>
                                                <span className="font-medium">Start Doing</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <p className="text-sm text-content-subtle dark:text-content-subtle whitespace-pre-line">
                                                {summaryData.feedback_start || "No data available."}
                                            </p>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="stop-doing">
                                        <AccordionTrigger>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="stop">STOP</Badge>
                                                <span className="font-medium">Stop Doing</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <p className="text-sm text-content-subtle dark:text-content-subtle whitespace-pre-line">
                                                {summaryData.feedback_stop || "No data available."}
                                            </p>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>

                            {/* RIGHT COLUMN - Competency Matrix */}
                            <Card>
                                <h3 className="font-semibold mb-4 text-content dark:text-content">Competency Matrix</h3>
                                <div className="flex justify-center">
                                    <RadarChart
                                        data={radarData}
                                        index="skill"
                                        categories={["Self", "Peers"]}
                                        colors={["indigo", "emerald"]}
                                        showLegend={false}
                                        showTooltip={false}
                                        className="h-64"
                                    />
                                </div>
                                {/* Skill Ratings List */}
                                {skillRatings && (
                                    <div className="mt-6 space-y-3 border-t border-border pt-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-content-subtle dark:text-content-subtle">Leadership</span>
                                            <Badge variant={getRatingBadgeVariant(skillRatings.leadership)}>{skillRatings.leadership}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-content-subtle dark:text-content-subtle">Quality</span>
                                            <Badge variant={getRatingBadgeVariant(skillRatings.quality)}>{skillRatings.quality}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-content-subtle dark:text-content-subtle">Reliability</span>
                                            <Badge variant={getRatingBadgeVariant(skillRatings.reliability)}>{skillRatings.reliability}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-content-subtle dark:text-content-subtle">Communication</span>
                                            <Badge variant={getRatingBadgeVariant(skillRatings.communication)}>{skillRatings.communication}</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-content-subtle dark:text-content-subtle">Initiative</span>
                                            <Badge variant={getRatingBadgeVariant(skillRatings.initiative)}>{skillRatings.initiative}</Badge>
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
            </DialogContent>
        </Dialog>
    )
}

"use client"

import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { getQuarterMonths, getRatingBadgeVariant } from "@/lib/performanceUtils"
import { RiPencilLine } from "@remixicon/react"
import Link from "next/link"

interface ReviewStatsHeaderProps {
    // Quarter Review Card
    selectedQuarter: string
    totalReviewers: number

    // Overall Score Card
    overallScore: number
    overallPercentage: number
    ratingLevel: string

    // Feedback Cycle Card
    isCycleActive: boolean
    cycleDescription?: string
}

export function ReviewStatsHeader({
    selectedQuarter,
    totalReviewers,
    overallScore,
    overallPercentage,
    ratingLevel,
    isCycleActive,
    cycleDescription = "Collaborative peer review for performance assessment"
}: ReviewStatsHeaderProps) {


    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quarter Review Card */}
            <Card>
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-content-subtle dark:text-content-placeholder">Quarter Review</h3>
                        <Badge variant="zinc">{selectedQuarter}</Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="mt-2 text-2xl font-semibold text-content dark:text-content">{getQuarterMonths(selectedQuarter)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-content dark:text-content">{totalReviewers}</span>
                        <span className="text-sm font-medium text-content-subtle dark:text-content-placeholder">Users</span>
                    </div>
                </div>
            </Card>

            {/* Overall Score Card */}
            <Card>
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-content-subtle dark:text-content-placeholder">Overall Score</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="mt-2 text-2xl font-semibold text-content dark:text-content">{overallPercentage}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-content-subtle dark:text-content-placeholder">Score</span>
                        <p className="text-sm font-medium text-content-subtle dark:text-content-subtle">{overallScore.toFixed(1)}</p>
                        <Badge variant={getRatingBadgeVariant(ratingLevel)}>
                            {ratingLevel}
                        </Badge>
                    </div>
                </div>
            </Card>

            {/* 360 Feedback Cycle Card */}
            <Card>
                <div className="flex flex-col h-full">
                    {/* Header with Title and Badge */}
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-content dark:text-content">360 Feedback Cycle</h3>
                        {isCycleActive ? (
                            <Badge variant="success">Active</Badge>
                        ) : (
                            <Badge variant="zinc">Inactive</Badge>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-content-subtle dark:text-content-placeholder leading-relaxed mb-4">
                        {cycleDescription}
                    </p>

                    {/* Button at Bottom */}
                    <div className="mt-auto">
                        {isCycleActive ? (
                            <Link href="/performance-review/new">
                                <Button size="sm" className="w-full">
                                    <RiPencilLine className="mr-2 size-4" /> Create Review
                                </Button>
                            </Link>
                        ) : (
                            <Button size="sm" disabled variant="secondary" className="w-full opacity-50">
                                Cycle Closed
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}

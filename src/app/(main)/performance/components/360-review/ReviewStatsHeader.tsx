"use client"

import { Badge } from "@/shared/ui"
import { Button } from "@/shared/ui"
import { Card } from "@/shared/ui"
import {
  getQuarterMonths,
  getRatingBadgeVariant,
} from "@/entities/performance/lib/performanceUtils"
import { RiPencilLine } from "@/shared/ui/lucide-icons"
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
  cycleDescription = "Collaborative peer review for performance assessment",
}: ReviewStatsHeaderProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Quarter Review Card */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-label-md text-content-subtle dark:text-content-placeholder">
              Quarter Review
            </h3>
            <Badge variant="zinc">{selectedQuarter}</Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-display-xxs text-content dark:text-content mt-2">
              {getQuarterMonths(selectedQuarter)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label-md text-content dark:text-content">
              {totalReviewers}
            </span>
            <span className="text-label-md text-content-subtle dark:text-content-placeholder">
              Users
            </span>
          </div>
        </div>
      </Card>

      {/* Overall Score Card */}
      <Card>
        <div className="space-y-3">
          <h3 className="text-label-md text-content-subtle dark:text-content-placeholder">
            Overall Score
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-display-xxs text-content dark:text-content mt-2">
              {overallPercentage}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-label-md text-content-subtle dark:text-content-placeholder">
              Score
            </span>
            <p className="text-label-md text-content-subtle dark:text-content-subtle">
              {overallScore.toFixed(1)}
            </p>
            <Badge variant={getRatingBadgeVariant(ratingLevel)}>
              {ratingLevel}
            </Badge>
          </div>
        </div>
      </Card>

      {/* 360 Feedback Cycle Card */}
      <Card>
        <div className="flex h-full flex-col">
          {/* Header with Title and Badge */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-label-md text-content dark:text-content">
              360 Feedback Cycle
            </h3>
            {isCycleActive ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="zinc">Inactive</Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-body-xs text-content-subtle dark:text-content-placeholder mb-4">
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
              <Button
                size="sm"
                disabled
                variant="secondary"
                className="w-full opacity-50"
              >
                Cycle Closed
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

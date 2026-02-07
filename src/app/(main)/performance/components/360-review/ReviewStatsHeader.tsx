"use client"

import { Badge, Card } from "@/shared/ui"
import { getQuarterMonths, getRatingBadgeVariant } from "@/entities/performance/lib/performanceUtils"

interface ReviewStatsHeaderProps {
  // Quarter Review Card
  selectedQuarter: string
  totalReviewers: number

  // Overall Score Card
  overallScore: number
  overallPercentage: number
  ratingLevel: string
}

export function ReviewStatsHeader({
  selectedQuarter,
  totalReviewers,
  overallScore,
  overallPercentage,
  ratingLevel,
}: ReviewStatsHeaderProps) {
  return (
    <div className="grid grid-cols-1 gap-md">
      {/* Quarter Review Card */}
      <Card className="border-neutral-primary bg-surface-neutral-primary rounded-[10px] border p-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-label-sm text-foreground-secondary">
              Quarter Review
            </h3>
            <Badge variant="zinc" size="sm">
              {selectedQuarter}
            </Badge>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-heading-md text-foreground-primary">
              {getQuarterMonths(selectedQuarter)}
            </p>
            <span className="text-label-sm text-foreground-secondary whitespace-nowrap">
              {totalReviewers} Users
            </span>
          </div>
        </div>
      </Card>

      {/* Overall Score Card */}
      <Card className="border-neutral-primary bg-surface-neutral-primary rounded-[10px] border p-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-label-sm text-foreground-secondary">
            Overall Score
          </h3>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-heading-md text-foreground-primary">
              {overallPercentage}%
            </p>
            <div className="flex items-center gap-2">
              <span className="text-label-sm text-foreground-secondary">
                Score
              </span>
              <p className="text-label-sm text-foreground-secondary">
                {overallScore.toFixed(1)}
              </p>
              <Badge variant={getRatingBadgeVariant(ratingLevel)} size="sm">
                {ratingLevel}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

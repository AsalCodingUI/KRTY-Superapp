"use client"

import { getQuarterMonths, getRatingBadgeVariant } from "@/entities/performance/lib/performanceUtils"
import { Badge, Card } from "@/shared/ui"

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
    <div className="grid grid-cols-1 gap-lg">
      {/* Quarter Review Card */}
      <Card className="border-border bg-card rounded-lg border p-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-label-sm text-muted-foreground">
              Quarter Review
            </h3>
            <Badge variant="zinc" size="sm">
              {selectedQuarter}
            </Badge>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-heading-md text-foreground">
              {getQuarterMonths(selectedQuarter)}
            </p>
            <span className="text-label-sm text-muted-foreground whitespace-nowrap">
              {totalReviewers} Users
            </span>
          </div>
        </div>
      </Card>

      {/* Overall Score Card */}
      <Card className="border-border bg-card rounded-lg border p-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-label-sm text-muted-foreground">
            Overall Score
          </h3>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-heading-md text-foreground">
              {overallPercentage}%
            </p>
            <div className="flex items-center gap-2">
              <span className="text-label-sm text-muted-foreground">
                Score
              </span>
              <p className="text-label-sm text-muted-foreground">
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

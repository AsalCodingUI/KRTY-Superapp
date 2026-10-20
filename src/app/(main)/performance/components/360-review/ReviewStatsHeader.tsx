"use client"

import {
  getQuarterMonths,
  getRatingBadgeVariant,
} from "@/entities/performance/lib/performanceUtils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

const toBadgeVariant = (variant: ReturnType<typeof getRatingBadgeVariant>) =>
  variant === "error"
    ? "destructive"
    : variant === "default"
      ? "secondary"
      : variant

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
    <div className="grid grid-cols-1 gap-3">
      {/* Quarter Review Card */}
      <Card className="border-border gap-0 rounded-lg border p-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-muted-foreground text-sm font-medium">
              Quarter Review
            </h3>
            <Badge variant="secondary">{selectedQuarter}</Badge>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-foreground text-lg font-semibold">
              {getQuarterMonths(selectedQuarter)}
            </p>
            <span className="text-muted-foreground text-sm font-medium whitespace-nowrap">
              {totalReviewers} Users
            </span>
          </div>
        </div>
      </Card>

      {/* Overall Score Card */}
      <Card className="border-border gap-0 rounded-lg border p-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-muted-foreground text-sm font-medium">
            Overall Score
          </h3>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-foreground text-lg font-semibold">
              {overallPercentage}%
            </p>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">
                Score
              </span>
              <p className="text-muted-foreground text-sm font-medium">
                {overallScore.toFixed(1)}
              </p>
              <Badge
                variant={toBadgeVariant(getRatingBadgeVariant(ratingLevel))}
              >
                {ratingLevel}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

"use client"

import { Badge } from "@/shared/ui"
import { Card } from "@/shared/ui"
import { RiBarChartBoxLine, RiGroupLine, RiStarLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"

interface EmployeePerformanceCardsProps {
  slaScore: number | null
  reviewScore: number | null
  workQualityScore: number | null
  quarter: string
}

export function EmployeePerformanceCards({
  slaScore,
  reviewScore,
  workQualityScore,
  quarter,
}: EmployeePerformanceCardsProps) {
  const getScoreBadge = (score: number | null) => {
    if (score === null) return { variant: "zinc" as const, label: "No Data" }
    if (score >= 95)
      return { variant: "success" as const, label: "Outstanding" }
    if (score >= 85)
      return { variant: "success" as const, label: "Above Expectation" }
    if (score >= 75)
      return { variant: "info" as const, label: "Meets Expectation" }
    if (score >= 60)
      return { variant: "warning" as const, label: "Below Expectation" }
    return { variant: "error" as const, label: "Needs Improvement" }
  }

  const slaData = getScoreBadge(slaScore)
  const reviewData = getScoreBadge(reviewScore)
  const workQualityData = getScoreBadge(workQualityScore)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* SLA Project Score */}
      <Link href="/performance?tab=kpi">
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-label-md text-content-subtle">SLA Project</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-display-xxs text-content">
                  {slaScore !== null ? `${slaScore}%` : "—"}
                </span>
              </div>
              <p className="text-body-xs text-content-subtle mt-1">{quarter}</p>
            </div>
            <div className="bg-muted text-content-subtle flex h-10 w-10 items-center justify-center rounded-lg">
              <RiBarChartBoxLine className="size-5" />
            </div>
          </div>
          <div className="border-border mt-4 border-t pt-3">
            <Badge variant={slaData.variant}>{slaData.label}</Badge>
          </div>
        </Card>
      </Link>

      {/* 360 Review Score */}
      <Link href="/performance?tab=360review">
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-label-md text-content-subtle">360 Review</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-display-xxs text-content">
                  {reviewScore !== null ? `${reviewScore}%` : "—"}
                </span>
              </div>
              <p className="text-body-xs text-content-subtle mt-1">{quarter}</p>
            </div>
            <div className="bg-muted text-content-subtle flex h-10 w-10 items-center justify-center rounded-lg">
              <RiGroupLine className="size-5" />
            </div>
          </div>
          <div className="border-border mt-4 border-t pt-3">
            <Badge variant={reviewData.variant}>{reviewData.label}</Badge>
          </div>
        </Card>
      </Link>

      {/* Work Quality Score */}
      <Link href="/performance?tab=kpi">
        <Card className="p-4 transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-label-md text-content-subtle">Work Quality</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-display-xxs text-content">
                  {workQualityScore !== null ? `${workQualityScore}%` : "—"}
                </span>
              </div>
              <p className="text-body-xs text-content-subtle mt-1">{quarter}</p>
            </div>
            <div className="bg-muted text-content-subtle flex h-10 w-10 items-center justify-center rounded-lg">
              <RiStarLine className="size-5" />
            </div>
          </div>
          <div className="border-border mt-4 border-t pt-3">
            <Badge variant={workQualityData.variant}>
              {workQualityData.label}
            </Badge>
          </div>
        </Card>
      </Link>
    </div>
  )
}

"use client"

import { EmptyState } from "@/components/empty-state"
import { Card } from "@/components/ui/card"
import { RiBarChartBoxLine } from "@/shared/ui/lucide-icons"

interface AdminPerformanceDistributionProps {
  distribution: {
    outstanding: number
    aboveExpectation: number
    meetsExpectation: number
    belowExpectation: number
    needsImprovement: number
  }
}

export function AdminPerformanceDistribution({
  distribution,
}: AdminPerformanceDistributionProps) {
  const items = [
    { label: "Outstanding", count: distribution.outstanding },
    { label: "Above Expectation", count: distribution.aboveExpectation },
    { label: "Meets Expectation", count: distribution.meetsExpectation },
    { label: "Below Expectation", count: distribution.belowExpectation },
    { label: "Needs Improvement", count: distribution.needsImprovement },
  ]

  const total = items.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className="gap-0 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-muted-foreground text-sm font-medium">
          Performance Distribution
        </p>
        <span className="text-muted-foreground/70 text-xs tabular-nums">
          {total} employees
        </span>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<RiBarChartBoxLine className="size-5" />}
          title="No performance data"
          description="Performance distribution will appear after review data is available."
          placement="inner"
          className="min-h-[160px] px-0 py-6"
        />
      ) : (
        <div className="divide-border divide-y">
          {items.map((item) => {
            const percentage =
              total > 0 ? Math.round((item.count / total) * 100) : 0

            return (
              <div key={item.label} className="px-3 py-2">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-foreground text-sm">{item.label}</p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {item.count} ({percentage}%)
                  </p>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

"use client"

import { Card, EmptyState } from "@/shared/ui"
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
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-label-md text-foreground-secondary">
          Performance Distribution
        </p>
        <span className="text-body-xs text-foreground-tertiary tabular-nums">
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
        <div className="border-neutral-primary divide-neutral-primary overflow-hidden rounded-lg border divide-y">
          {items.map((item) => {
            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0

            return (
              <div key={item.label} className="px-3 py-2">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="text-body-sm text-foreground-primary">
                    {item.label}
                  </p>
                  <p className="text-body-xs text-foreground-secondary tabular-nums">
                    {item.count} ({percentage}%)
                  </p>
                </div>
                <div className="bg-surface-neutral-secondary h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-foreground-brand-primary h-full rounded-full"
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

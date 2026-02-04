"use client"

import { Card } from "@/shared/ui"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

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
  const data = [
    {
      name: "Outstanding",
      count: distribution.outstanding,
      color: "hsl(var(--chart-1))",
    },
    {
      name: "Above Exp.",
      count: distribution.aboveExpectation,
      color: "hsl(var(--chart-2))",
    },
    {
      name: "Meets Exp.",
      count: distribution.meetsExpectation,
      color: "hsl(var(--chart-3))",
    },
    {
      name: "Below Exp.",
      count: distribution.belowExpectation,
      color: "hsl(var(--chart-4))",
    },
    {
      name: "Needs Imp.",
      count: distribution.needsImprovement,
      color: "hsl(var(--chart-5))",
    },
  ]

  const total = Object.values(distribution).reduce(
    (sum, count) => sum + count,
    0,
  )

  return (
    <Card>
      <h3 className="text-content mb-4 text-lg font-semibold">
        Performance Distribution
      </h3>

      {total === 0 ? (
        <div className="py-8 text-center">
          <p className="text-content-subtle text-sm">
            No performance data available
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--content-subtle))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--content-subtle))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--content))" }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {data.map((item) => {
              const percentage =
                total > 0 ? Math.round((item.count / total) * 100) : 0
              return (
                <div key={item.name} className="text-center">
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <div
                      className="size-3 rounded-full bg-[var(--chart-color)]"
                      style={
                        { "--chart-color": item.color } as React.CSSProperties
                      }
                    />
                    <span className="text-content text-sm font-medium">
                      {item.count}
                    </span>
                  </div>
                  <div className="text-content-subtle text-xs">{item.name}</div>
                  <div className="text-content-placeholder text-xs">
                    {percentage}%
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}

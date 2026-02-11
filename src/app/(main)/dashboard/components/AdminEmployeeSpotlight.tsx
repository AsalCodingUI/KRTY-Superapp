"use client"

import { Avatar, Badge } from "@/shared/ui"
import { Card } from "@/shared/ui"
import { RiArrowDownLine, RiArrowUpLine, RiStarLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"

interface Employee {
  employee_id: string
  employee_name: string | null
  employee_avatar: string | null
  employee_job_title: string | null
  overall_percentage: number
}

interface AdminEmployeeSpotlightProps {
  topPerformers: Employee[]
  employeesNeedingAttention: Employee[]
}

export function AdminEmployeeSpotlight({
  topPerformers,
  employeesNeedingAttention,
}: AdminEmployeeSpotlightProps) {
  const getRatingBadge = (score: number) => {
    if (score >= 95)
      return { variant: "success" as const, label: "Outstanding" }
    if (score >= 85) return { variant: "success" as const, label: "Above Exp." }
    if (score >= 75) return { variant: "info" as const, label: "Meets Exp." }
    if (score >= 60) return { variant: "warning" as const, label: "Below Exp." }
    return { variant: "error" as const, label: "Needs Imp." }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Top Performers */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <RiStarLine className="text-chart-1 size-5" />
          <h3 className="text-heading-md text-foreground-primary">
            Top Performers
          </h3>
        </div>

        {topPerformers.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-body-sm text-foreground-secondary">
              No performance data available
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topPerformers.map((employee) => {
              const badge = getRatingBadge(employee.overall_percentage)
              return (
                <Link
                  key={employee.employee_id}
                  href={`/performance/employee/${employee.employee_id}`}
                >
                  <div className="border-neutral-primary bg-surface-neutral-secondary hover:border-success flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-sm">
                    <div className="bg-success/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <RiArrowUpLine className="text-success size-4" />
                    </div>
                    <Avatar
                      size="sm"
                      initials={employee.employee_name?.[0] || "?"}
                      src={employee.employee_avatar || undefined}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-foreground-primary text-label-md truncate">
                        {employee.employee_name}
                      </h4>
                      <p className="text-body-xs text-foreground-secondary truncate">
                        {employee.employee_job_title}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-heading-md text-foreground-primary">
                        {employee.overall_percentage}%
                      </div>
                      <Badge
                        variant={badge.variant}
                        className="text-body-xs mt-1"
                      >
                        {badge.label}
                      </Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>

      {/* Employees Needing Attention */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <RiArrowDownLine className="text-danger size-5" />
          <h3 className="text-heading-md text-foreground-primary">
            Needs Attention
          </h3>
        </div>

        {employeesNeedingAttention.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-body-sm text-foreground-secondary">
              All employees performing well! 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {employeesNeedingAttention.map((employee) => {
              const badge = getRatingBadge(employee.overall_percentage)
              return (
                <Link
                  key={employee.employee_id}
                  href={`/performance/employee/${employee.employee_id}`}
                >
                  <div className="border-neutral-primary bg-surface-neutral-secondary hover:border-warning flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-sm">
                    <div className="bg-warning/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <RiArrowDownLine className="text-warning size-4" />
                    </div>
                    <Avatar
                      size="sm"
                      initials={employee.employee_name?.[0] || "?"}
                      src={employee.employee_avatar || undefined}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-foreground-primary text-label-md truncate">
                        {employee.employee_name}
                      </h4>
                      <p className="text-body-xs text-foreground-secondary truncate">
                        {employee.employee_job_title}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-heading-md text-foreground-primary">
                        {employee.overall_percentage}%
                      </div>
                      <Badge
                        variant={badge.variant}
                        className="text-body-xs mt-1"
                      >
                        {badge.label}
                      </Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

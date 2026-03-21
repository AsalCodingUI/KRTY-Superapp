"use client"

import { Avatar, Badge } from "@/shared/ui"
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
    <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
      <div className="border-neutral-primary rounded-lg border px-4 py-3">
        <p className="text-label-sm text-foreground-secondary mb-3">
          Top Performers
        </p>

        {topPerformers.length === 0 ? (
          <div className="py-5 text-center">
            <p className="text-body-xs text-foreground-tertiary">
              No performance data available
            </p>
          </div>
        ) : (
          <div className="border-neutral-primary divide-neutral-primary overflow-hidden rounded-lg border divide-y">
            {topPerformers.map((employee) => {
              const badge = getRatingBadge(employee.overall_percentage)
              return (
                <Link
                  key={employee.employee_id}
                  href={`/performance/employee/${employee.employee_id}`}
                >
                  <div className="hover:bg-surface-neutral-secondary flex items-center gap-3 px-3 py-2 transition-colors">
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
      </div>

      <div className="border-neutral-primary rounded-lg border px-4 py-3">
        <p className="text-label-sm text-foreground-secondary mb-3">
          Needs Attention
        </p>

        {employeesNeedingAttention.length === 0 ? (
          <div className="py-5 text-center">
            <p className="text-body-xs text-foreground-tertiary">
              All employees performing well.
            </p>
          </div>
        ) : (
          <div className="border-neutral-primary divide-neutral-primary overflow-hidden rounded-lg border divide-y">
            {employeesNeedingAttention.map((employee) => {
              const badge = getRatingBadge(employee.overall_percentage)
              return (
                <Link
                  key={employee.employee_id}
                  href={`/performance/employee/${employee.employee_id}`}
                >
                  <div className="hover:bg-surface-neutral-secondary flex items-center gap-3 px-3 py-2 transition-colors">
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
      </div>
    </div>
  )
}

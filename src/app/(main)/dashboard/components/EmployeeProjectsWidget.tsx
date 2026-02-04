"use client"

import { Badge } from "@/shared/ui"
import { Card } from "@/shared/ui"
import { RiCheckLine, RiFolderLine } from "@remixicon/react"
import { format } from "date-fns"
import Link from "next/link"

interface Project {
  id: string
  name: string
  status: string
  quarter_id: string
  end_date: string
  sla_percentage: number
  quality_achieved: number
  quality_total: number
}

interface EmployeeProjectsWidgetProps {
  projects: Project[]
  userId: string
}

export function EmployeeProjectsWidget({
  projects,
  userId,
}: EmployeeProjectsWidgetProps) {
  if (projects.length === 0) {
    return (
      <Card>
        <h3 className="text-heading-md text-content mb-4">Active Projects</h3>
        <div className="py-8 text-center">
          <RiFolderLine className="text-content-placeholder mx-auto size-12" />
          <p className="text-body-sm text-content-subtle mt-2">
            No active projects assigned
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-heading-md text-content">Active Projects</h3>
        <Link href="/performance?tab=kpi">
          <Badge variant="info">View All</Badge>
        </Link>
      </div>

      <div className="space-y-3">
        {projects.slice(0, 5).map((project) => {
          const daysUntilDeadline = Math.ceil(
            (new Date(project.end_date).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          )
          const isOverdue = daysUntilDeadline < 0
          const isUrgent = daysUntilDeadline >= 0 && daysUntilDeadline <= 7

          return (
            <Link
              key={project.id}
              href={`/performance/employee/${userId}/project/${project.id}`}
              className="block"
            >
              <div className="border-border bg-surface-secondary hover:border-primary flex items-start justify-between gap-4 rounded-lg border p-3 transition-all hover:shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="text-content text-label-md truncate">
                      {project.name}
                    </h4>
                    <Badge variant="info" className="text-body-xs shrink-0">
                      {project.quarter_id}
                    </Badge>
                  </div>

                  <div className="text-body-xs text-content-subtle flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span>SLA:</span>
                      <span className="text-content font-medium">
                        {project.sla_percentage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <RiCheckLine className="size-3" />
                      <span className="text-content font-medium">
                        {project.quality_achieved}/{project.quality_total}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    {isOverdue ? (
                      <Badge variant="error" className="text-body-xs">
                        Overdue
                      </Badge>
                    ) : isUrgent ? (
                      <Badge variant="warning" className="text-body-xs">
                        Due in {daysUntilDeadline} days
                      </Badge>
                    ) : (
                      <span className="text-body-xs text-content-placeholder">
                        Due {format(new Date(project.end_date), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {projects.length > 5 && (
        <div className="mt-4 text-center">
          <Link href="/performance?tab=kpi">
            <span className="text-label-md- text-primary hover:">
              +{projects.length - 5} more projects
            </span>
          </Link>
        </div>
      )}
    </Card>
  )
}

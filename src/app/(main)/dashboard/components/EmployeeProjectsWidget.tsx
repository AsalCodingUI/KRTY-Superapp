"use client"

import { Badge, EmptyState } from "@/shared/ui"
import { RiCheckLine, RiFolderLine } from "@/shared/ui/lucide-icons"
import { format, isValid } from "date-fns"
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
  showHeader?: boolean
}

export function EmployeeProjectsWidget({
  projects,
  userId,
  showHeader = true,
}: EmployeeProjectsWidgetProps) {
  if (projects.length === 0) {
    return (
      <div className="border-neutral-primary rounded-lg border p-4">
        {showHeader && (
          <h3 className="text-label-md text-foreground-primary mb-4">
            Active Projects
          </h3>
        )}
        <EmptyState
          title="No active projects assigned"
          description="Projects will show up here once they are assigned."
          placement="inner"
          icon={<RiFolderLine className="size-5" />}
        />
      </div>
    )
  }

  return (


    <div className="border-neutral-primary divide-neutral-primary overflow-hidden rounded-lg border divide-y">
      {projects.slice(0, 5).map((project, index) => {
        const endDate = new Date(project.end_date)
        const endDateValid = isValid(endDate)
        const daysUntilDeadline = endDateValid
          ? Math.ceil(
            (endDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
          )
          : Number.NaN
        const isOverdue = daysUntilDeadline < 0
        const isUrgent = daysUntilDeadline >= 0 && daysUntilDeadline <= 7

        return (
          <Link
            key={project.id || `${project.name}-${project.quarter_id}-${index}`}
            href={`/performance/employee/${userId}/project/${project.id}`}
            className="block"
          >
            <div className="flex items-start justify-between gap-4 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h4 className="text-foreground-primary text-label-md truncate">
                    {project.name}
                  </h4>
                  <Badge variant="info" className="text-body-xs shrink-0">
                    {project.quarter_id}
                  </Badge>
                </div>

                <div className="text-body-xs text-foreground-secondary flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span>SLA:</span>
                    <span className="text-foreground-primary font-medium">
                      {project.sla_percentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RiCheckLine className="size-3" />
                    <span className="text-foreground-primary font-medium">
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
                  ) : endDateValid ? (
                    <span className="text-body-xs text-foreground-tertiary">
                      Due {format(endDate, "MMM d, yyyy")}
                    </span>
                  ) : (
                    <span className="text-body-xs text-foreground-tertiary">
                      Due —
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>


  )
}

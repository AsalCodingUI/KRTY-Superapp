"use client"

import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
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
      <div className="py-2">
        {showHeader && (
          <h3 className="text-foreground mb-4 text-sm font-medium">
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
    <div className="divide-border divide-y">
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
                  <h4 className="text-foreground truncate text-sm font-medium">
                    {project.name}
                  </h4>
                  <Badge variant="info" className="shrink-0 text-xs">
                    {project.quarter_id}
                  </Badge>
                </div>

                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span>SLA:</span>
                    <span className="text-foreground font-medium">
                      {project.sla_percentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RiCheckLine className="size-3" />
                    <span className="text-foreground font-medium">
                      {project.quality_achieved}/{project.quality_total}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  {isOverdue ? (
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                  ) : isUrgent ? (
                    <Badge variant="warning" className="text-xs">
                      Due in {daysUntilDeadline} days
                    </Badge>
                  ) : endDateValid ? (
                    <span className="text-muted-foreground/70 text-xs">
                      Due {format(endDate, "MMM d, yyyy")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/70 text-xs">
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

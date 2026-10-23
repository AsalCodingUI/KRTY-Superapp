"use client"

import { EmptyValue } from "@/components/empty-value"
import { ArrowUpRight } from "lucide-react"
import { HomeCard, HomeEmpty, HomeIconLink, HomeRow } from "./home-card"
import { ProjectAvatar } from "@/components/project-avatar"
import { Badge } from "@/components/ui/badge"
import { format, isValid } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"

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
  className?: string
}

export function EmployeeProjectsWidget({
  projects,
  userId,
  className,
}: EmployeeProjectsWidgetProps) {
  const t = useT("dashboard")
  const dateLocale = useDateLocale()
  return (
    <HomeCard
      title={t("projectsTitle")}
      badge={
        projects.length > 0 ? (
          <Badge variant="secondary">{projects.length}</Badge>
        ) : null
      }
      actions={
        <HomeIconLink href="/projects" label={t("openProjects")}>
          <ArrowUpRight />
        </HomeIconLink>
      }
      className={className}
    >
      <div className="flex flex-col">
        {projects.length === 0 ? (
          <HomeEmpty>{t("projectsEmpty")}</HomeEmpty>
        ) : (
          projects.slice(0, 6).map((project, index) => {
            const endDate = new Date(project.end_date)
            const endDateValid = isValid(endDate)
            const daysLeft = endDateValid
              ? Math.ceil((endDate.getTime() - Date.now()) / 86_400_000)
              : Number.NaN
            return (
              <HomeRow
                key={
                  project.id || `${project.name}-${project.quarter_id}-${index}`
                }
                href={`/performance/employee/${userId}/project/${project.id}`}
                leading={
                  <ProjectAvatar
                    id={project.id}
                    name={project.name}
                    className="size-6 rounded-md text-[11px]"
                  />
                }
                title={<span className="font-medium">{project.name}</span>}
                subtitle={t("projectSubtitle", {
                  quarter: project.quarter_id,
                  sla: project.sla_percentage,
                  achieved: project.quality_achieved,
                  total: project.quality_total,
                })}
                trailing={
                  daysLeft < 0 ? (
                    <Badge variant="destructive">{t("projectOverdue")}</Badge>
                  ) : daysLeft <= 7 ? (
                    <Badge variant="warning">
                      {daysLeft === 0
                        ? t("projectDueToday")
                        : t(
                            daysLeft === 1
                              ? "projectDaysLeftOne"
                              : "projectDaysLeft",
                            { n: daysLeft },
                          )}
                    </Badge>
                  ) : (
                    <span className="text-tertiary-foreground text-[13px]">
                      {endDateValid ? (
                        format(endDate, "d MMM yyyy", { locale: dateLocale })
                      ) : (
                        <EmptyValue />
                      )}
                    </span>
                  )
                }
              />
            )
          })
        )}
      </div>
    </HomeCard>
  )
}

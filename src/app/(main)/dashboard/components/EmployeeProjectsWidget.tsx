"use client"

import { EmptyValue } from "@/components/empty-value"
import { ArrowUpRight } from "lucide-react"
import { HomeCard, HomeEmpty, HomeIconLink, HomeRow } from "./home-card"
import { ProjectAvatar } from "@/components/project-avatar"
import { Badge } from "@/components/ui/badge"
import { format, isValid } from "date-fns"
import { id as idLocale } from "date-fns/locale"

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
  return (
    <HomeCard
      title="Project aktif"
      badge={
        projects.length > 0 ? (
          <Badge variant="secondary">{projects.length}</Badge>
        ) : null
      }
      actions={
        <HomeIconLink href="/projects" label="Buka project">
          <ArrowUpRight />
        </HomeIconLink>
      }
      className={className}
    >
      <div className="flex flex-col">
        {projects.length === 0 ? (
          <HomeEmpty>Project muncul di sini setelah kamu ditugaskan.</HomeEmpty>
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
                subtitle={`${project.quarter_id} · SLA ${project.sla_percentage}% · Kualitas ${project.quality_achieved}/${project.quality_total}`}
                trailing={
                  daysLeft < 0 ? (
                    <Badge variant="destructive">Lewat tenggat</Badge>
                  ) : daysLeft <= 7 ? (
                    <Badge variant="warning">
                      {daysLeft === 0 ? "Hari ini" : `${daysLeft} hari lagi`}
                    </Badge>
                  ) : (
                    <span className="text-tertiary-foreground text-[13px]">
                      {endDateValid ? (
                        format(endDate, "d MMM yyyy", { locale: idLocale })
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

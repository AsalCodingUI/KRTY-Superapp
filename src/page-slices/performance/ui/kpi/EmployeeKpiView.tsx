"use client"

import {
  getEmployeeKpi,
  type KpiProject,
} from "@/app/(main)/performance/actions/kpi-actions"
import { Spinner } from "@/components/ui/spinner"
import { useQuery } from "@tanstack/react-query"
import { KpiSummary } from "./KpiSummary"
import { ProjectKpiList } from "./ProjectKpiList"

/** One person's KPI for a period: nilai akhir, parts, and their projects. */
export function EmployeeKpiView({
  userId,
  scope,
  hrefFor,
}: {
  userId: string
  scope: string
  hrefFor: (project: KpiProject) => string
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["kpi", userId, scope],
    queryFn: () => getEmployeeKpi(userId, scope),
    staleTime: 30_000,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }
  if (!data?.success) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        {data?.error ?? "Gagal memuat KPI."}
      </p>
    )
  }

  const { parts, final, projects } = data.data
  return (
    <div className="flex flex-col">
      <KpiSummary parts={parts} final={final} />
      <ProjectKpiList
        projects={projects}
        hrefFor={hrefFor}
        showQuarter={!/^\d{4}-Q[1-4]$/.test(scope)}
      />
    </div>
  )
}

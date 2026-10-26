"use client"

import { useBreadcrumbs } from "@/components/page-breadcrumbs"
import { PageHeader } from "@/components/page-header"
import { QuarterFilter } from "@/components/quarter-filter"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useT } from "@/shared/i18n/client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { MyKpiView } from "./MyKpiView"
import { normalizePeriod, periodYears } from "./period"
import { ProjectKpiSheet, projectSheetHref } from "./ProjectKpiSheet"

/**
 * A stakeholder's view of one member's KPI (/performance/employee/[id]):
 * the member's own KPI page (MyKpiView), read-only, plus the lock state and
 * what needs fixing.
 */
export function EmployeeKpiPage({
  employee,
}: {
  employee: {
    id: string
    full_name: string | null
    avatar_url: string | null
    job_title: string | null
  }
}) {
  const t = useT("performance")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = normalizePeriod(searchParams.get("period"))
  const backHref = `/performance?period=${encodeURIComponent(period)}`
  useBreadcrumbs([
    { label: t("teamKpi"), href: backHref },
    { label: employee.full_name || t("employee") },
  ])

  const setPeriod = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col pb-4">
      <PageHeader
        className="pt-6 pb-4"
        back={{ href: backHref, label: t("teamKpi") }}
        title={
          <span className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={employee.avatar_url || undefined} alt="" />
              <AvatarFallback className="text-xs">
                {(employee.full_name || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {employee.full_name}
          </span>
        }
        actions={
          <>
            <QuarterFilter
              value={period}
              onChange={setPeriod}
              years={periodYears()}
            />
          </>
        }
      />
      <MyKpiView
        variant="stakeholder"
        userId={employee.id}
        name={employee.full_name?.split(" ")[0] || t("employee")}
        scope={period}
        hrefFor={(p) =>
          projectSheetHref(pathname, { periode: period }, p.projectId)
        }
      />
      <ProjectKpiSheet defaultMember={employee.id} />
    </div>
  )
}

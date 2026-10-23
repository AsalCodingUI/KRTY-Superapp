"use client"

import { useBreadcrumbs } from "@/components/page-breadcrumbs"
import { PageHeader } from "@/components/page-header"
import { QuarterFilter } from "@/components/quarter-filter"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { EmployeeKpiView } from "./EmployeeKpiView"
import { normalizePeriod, periodYears } from "./period"

/** Admin view of one member's KPI (/performance/employee/[id]). */
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = normalizePeriod(searchParams.get("periode"))
  const backHref = `/performance?periode=${encodeURIComponent(period)}`
  useBreadcrumbs([
    { label: "KPI tim", href: backHref },
    { label: employee.full_name || "Karyawan" },
  ])

  const setPeriod = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("periode", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col pb-4">
      <PageHeader
        className="pt-6 pb-4"
        back={{ href: backHref, label: "KPI tim" }}
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
          <QuarterFilter
            value={period}
            onChange={setPeriod}
            years={periodYears()}
          />
        }
      />
      <EmployeeKpiView
        userId={employee.id}
        scope={period}
        hrefFor={(p) =>
          `/performance/employee/${employee.id}/project/${p.projectId}?periode=${encodeURIComponent(period)}`
        }
      />
    </div>
  )
}

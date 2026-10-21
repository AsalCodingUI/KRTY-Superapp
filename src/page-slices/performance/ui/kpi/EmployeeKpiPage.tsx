"use client"

import { QuarterFilter } from "@/components/quarter-filter"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RiArrowLeftLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
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

  const setPeriod = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("periode", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-3">
        <Link
          href={`/performance?periode=${encodeURIComponent(period)}`}
          className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm"
        >
          <RiArrowLeftLine className="size-4" />
          KPI tim
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarImage src={employee.avatar_url || undefined} alt="" />
              <AvatarFallback>
                {(employee.full_name || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold">{employee.full_name}</h1>
              {employee.job_title && (
                <p className="text-muted-foreground text-sm">
                  {employee.job_title}
                </p>
              )}
            </div>
          </div>
          <QuarterFilter
            value={period}
            onChange={setPeriod}
            years={periodYears()}
          />
        </div>
      </div>
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

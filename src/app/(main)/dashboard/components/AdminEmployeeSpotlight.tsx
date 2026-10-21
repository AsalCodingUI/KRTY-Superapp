"use client"

import { EmptyState } from "@/components/empty-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { RiStarLine } from "@/shared/ui/lucide-icons"
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
    return { variant: "destructive" as const, label: "Needs Imp." }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Card className="gap-3">
        <p className="text-foreground text-sm font-medium">Top Performers</p>

        {topPerformers.length === 0 ? (
          <EmptyState
            icon={<RiStarLine className="size-5" />}
            title="Belum ada performa teratas"
            description="Muncul setelah ada data KPI di kuartal ini."
            placement="inner"
            className="min-h-[160px] px-0 py-6"
          />
        ) : (
          <div className="divide-border divide-y">
            {topPerformers.map((employee) => {
              const badge = getRatingBadge(employee.overall_percentage)
              return (
                <Link
                  key={employee.employee_id}
                  href={`/performance/employee/${employee.employee_id}`}
                >
                  <div className="hover:bg-muted flex items-center gap-3 px-3 py-2 transition-colors">
                    <Avatar className="size-7">
                      <AvatarImage
                        src={employee.employee_avatar || undefined}
                      />
                      <AvatarFallback className="text-[10px]">
                        {employee.employee_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-foreground truncate text-sm font-medium">
                        {employee.employee_name}
                      </h4>
                      <p className="text-muted-foreground truncate text-xs">
                        {employee.employee_job_title}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-foreground text-lg font-medium tabular-nums">
                        {employee.overall_percentage}%
                      </div>
                      <Badge variant={badge.variant} className="mt-1 text-xs">
                        {badge.label}
                      </Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>

      <Card className="gap-3">
        <p className="text-foreground text-sm font-medium">Needs Attention</p>

        {employeesNeedingAttention.length === 0 ? (
          <EmptyState
            icon={<RiStarLine className="size-5" />}
            title="Tidak ada yang perlu diperhatikan"
            description="Semua anggota sedang dalam rentang yang diharapkan."
            placement="inner"
            className="min-h-[160px] px-0 py-6"
          />
        ) : (
          <div className="divide-border divide-y">
            {employeesNeedingAttention.map((employee) => {
              const badge = getRatingBadge(employee.overall_percentage)
              return (
                <Link
                  key={employee.employee_id}
                  href={`/performance/employee/${employee.employee_id}`}
                >
                  <div className="hover:bg-muted flex items-center gap-3 px-3 py-2 transition-colors">
                    <Avatar className="size-7">
                      <AvatarImage
                        src={employee.employee_avatar || undefined}
                      />
                      <AvatarFallback className="text-[10px]">
                        {employee.employee_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-foreground truncate text-sm font-medium">
                        {employee.employee_name}
                      </h4>
                      <p className="text-muted-foreground truncate text-xs">
                        {employee.employee_job_title}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-foreground text-lg font-medium tabular-nums">
                        {employee.overall_percentage}%
                      </div>
                      <Badge variant={badge.variant} className="mt-1 text-xs">
                        {badge.label}
                      </Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

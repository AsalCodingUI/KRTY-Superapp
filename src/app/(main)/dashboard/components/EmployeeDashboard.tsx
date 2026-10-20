"use client"

import dynamic from "next/dynamic"
import {
  QuarterFilter,
  type QuarterFilterValue,
} from "@/components/quarter-filter"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import type { EmployeeDashboardData } from "../actions/dashboard-employee-actions"

const EmployeeAttendanceWidget = dynamic(
  () =>
    import("./EmployeeAttendanceWidget").then(
      (mod) => mod.EmployeeAttendanceWidget,
    ),
  { loading: () => null },
)

const EmployeePerformanceCards = dynamic(
  () =>
    import("./EmployeePerformanceCards").then(
      (mod) => mod.EmployeePerformanceCards,
    ),
  { loading: () => null },
)

const EmployeeProjectsWidget = dynamic(
  () =>
    import("./EmployeeProjectsWidget").then(
      (mod) => mod.EmployeeProjectsWidget,
    ),
  { loading: () => null },
)

interface EmployeeDashboardProps {
  data: EmployeeDashboardData
  initialQuarter?: string
}

function getCurrentQuarterValue(): QuarterFilterValue {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  let quarter = "Q1"
  if (month >= 4 && month <= 6) quarter = "Q2"
  else if (month >= 7 && month <= 9) quarter = "Q3"
  else if (month >= 10) quarter = "Q4"
  return `${year}-${quarter}`
}

export function EmployeeDashboard({
  data,
  initialQuarter,
}: EmployeeDashboardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const firstName = data.user.full_name?.split(" ")[0] || "User"
  const availableYears = useMemo(() => {
    const y = new Date().getFullYear()
    return [y - 1, y, y + 1]
  }, [])
  const validInitialQuarter =
    typeof initialQuarter === "string" &&
    /^\d{4}-(Q[1-4]|All)$/.test(initialQuarter)
      ? (initialQuarter as QuarterFilterValue)
      : getCurrentQuarterValue()
  const [selectedQuarter, setSelectedQuarter] =
    useState<QuarterFilterValue>(validInitialQuarter)
  const selectedYear = (() => {
    if (selectedQuarter === "All") return availableYears[1]
    const parsed = Number(selectedQuarter.split("-")[0])
    return Number.isNaN(parsed) ? availableYears[1] : parsed
  })()

  const handleYearChange = (yearStr: string) => {
    const year = Number(yearStr)
    const quarter = selectedQuarter.split("-")[1] || "Q1"
    const normalizedQuarter = quarter === "All" ? "All" : quarter
    const nextQuarter = `${year}-${normalizedQuarter}` as QuarterFilterValue
    setSelectedQuarter(nextQuarter)

    const params = new URLSearchParams(searchParams.toString())
    params.set("quarter", nextQuarter)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleQuarterChange = (value: QuarterFilterValue) => {
    setSelectedQuarter(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set("quarter", value)
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 pb-4">
        <h1 className="text-foreground truncate text-xl font-semibold tracking-tight">
          Dashboard Overview
        </h1>
      </div>

      <div className="flex flex-col">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-foreground text-lg font-semibold">
              Welcome back, {firstName}
            </h1>
            <div className="flex items-center gap-2">
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => v !== null && handleYearChange(v)}
              >
                <SelectTrigger className="w-[96px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <QuarterFilter
                value={selectedQuarter}
                onChange={handleQuarterChange}
                showYear={false}
              />
            </div>
          </div>

          <section className="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-5">
            <div className="bg-background md:bg-sidebar flex h-full flex-col gap-1 px-4 py-3 [&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1">
              <p className="text-muted-foreground text-sm font-medium">
                Leave Balance
              </p>
              <p className="text-foreground text-lg font-semibold">
                {data.leaveBalance} days
              </p>
            </div>
            <div className="bg-background md:bg-sidebar flex h-full flex-col gap-1 px-4 py-3 [&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1">
              <p className="text-muted-foreground text-sm font-medium">
                On Time SLA
              </p>
              <p className="text-foreground text-lg font-semibold">
                {data.performanceOverview.slaScore !== null
                  ? `${Number(data.performanceOverview.slaScore).toFixed(1)}%`
                  : "0.0%"}
              </p>
            </div>
            <div className="bg-background md:bg-sidebar flex h-full flex-col gap-1 px-4 py-3 [&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1">
              <p className="text-muted-foreground text-sm font-medium">
                360 Review
              </p>
              <p className="text-foreground text-lg font-semibold">
                {data.performanceOverview.reviewScore !== null
                  ? `${Number(data.performanceOverview.reviewScore).toFixed(1)}%`
                  : "0.0%"}
              </p>
            </div>
            <div className="bg-background md:bg-sidebar flex h-full flex-col gap-1 px-4 py-3 [&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1">
              <p className="text-muted-foreground text-sm font-medium">
                Work Quality
              </p>
              <p className="text-foreground text-lg font-semibold">
                {data.performanceOverview.workQualityScore !== null
                  ? `${Number(data.performanceOverview.workQualityScore).toFixed(1)}%`
                  : "0.0%"}
              </p>
            </div>
            <div className="bg-background md:bg-sidebar flex h-full flex-col gap-1 px-4 py-3 [&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1">
              <p className="text-muted-foreground text-sm font-medium">
                Quarter
              </p>
              <p className="text-foreground text-lg font-semibold">
                {data.performanceOverview.quarter}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">
                Leave & Attendance
              </p>
              <EmployeeAttendanceWidget
                userId={data.user.id}
                userFullName={data.user.full_name}
                recentAttendance={data.recentAttendance}
                recentLeaveRequests={data.recentLeaveRequests}
              />
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-sm font-medium">
                Performance
              </p>
              <EmployeePerformanceCards
                slaScore={data.performanceOverview.slaScore}
                reviewScore={data.performanceOverview.reviewScore}
                workQualityScore={data.performanceOverview.workQualityScore}
                quarter={data.performanceOverview.quarter}
                competencyScores={data.competencyScores}
                upcomingReviews={data.upcomingReviews}
                upcomingOneOnOne={data.upcomingOneOnOne}
              />
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">
              Active Projects
            </p>
            <EmployeeProjectsWidget
              projects={data.activeProjects}
              userId={data.user.id}
              showHeader={false}
            />
          </section>
        </div>
      </div>
    </div>
  )
}

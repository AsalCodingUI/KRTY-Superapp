"use client"

import {
  QuarterFilter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type QuarterFilterValue,
} from "@/shared/ui"
import {
  RiBarChartBoxLine,
} from "@/shared/ui/lucide-icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import type { EmployeeDashboardData } from "../actions/dashboard-employee-actions"
import { EmployeeAttendanceWidget } from "./EmployeeAttendanceWidget"
import { EmployeePerformanceCards } from "./EmployeePerformanceCards"
import { EmployeeProjectsWidget } from "./EmployeeProjectsWidget"

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

export function EmployeeDashboard({ data, initialQuarter }: EmployeeDashboardProps) {
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
      <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
        <RiBarChartBoxLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">
          Dashboard Overview
        </p>
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-heading-md text-foreground-primary">
              Welcome back, {firstName}
            </h1>
            <div className="flex items-center gap-2">
              <Select
                value={selectedYear.toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-[96px]" size="sm">
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

          <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-label-sm text-foreground-secondary">
                Leave & Attendance
              </p>
              <EmployeeAttendanceWidget
                userId={data.user.id}
                userFullName={data.user.full_name}
                leaveBalance={data.leaveBalance}
                recentAttendance={data.recentAttendance}
                recentLeaveRequests={data.recentLeaveRequests}
              />
            </div>

            <div className="space-y-2">
              <p className="text-label-sm text-foreground-secondary">
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
          </div>

          <div className="space-y-2">
            <p className="text-label-sm text-foreground-secondary">
              Active Projects
            </p>
            <EmployeeProjectsWidget
              projects={data.activeProjects}
              userId={data.user.id}
              showHeader={false}
            />
          </div>

        </div>
      </div>
    </div>
  )
}

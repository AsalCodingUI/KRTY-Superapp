"use client"

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
import { useT } from "@/shared/i18n/client"

import {
  CalendarDays,
  ChartColumnIncreasing as ChartColumn,
  Clock,
  Plus,
} from "@/components/icons"
import {
  HomeAction,
  HomeActions,
  HomeColumn,
  HomeGreeting,
  HomeGrid,
} from "./home-card"
import { EmployeeAttendanceWidget } from "./EmployeeAttendanceWidget"
import { EmployeePerformanceCards } from "./EmployeePerformanceCards"
import { EmployeeProjectsWidget } from "./EmployeeProjectsWidget"
import { HomeKpiCard } from "./HomeKpiCard"

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
  const t = useT("dashboard")
  const firstName =
    data.user.full_name?.split(" ")[0] || t("greetingFallbackName")
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
    params.set("period", nextQuarter)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleQuarterChange = (value: QuarterFilterValue) => {
    setSelectedQuarter(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", value)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const [leaveOpen, setLeaveOpen] = useState(false)

  return (
    <HomeColumn>
      <HomeGreeting title={t("greetingName", { name: firstName })} />

      <HomeActions
        aside={
          <>
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
          </>
        }
      >
        <HomeAction primary onClick={() => setLeaveOpen(true)} icon={<Plus />}>
          {t("actionRequestLeave")}
        </HomeAction>
        <HomeAction href="/leave" icon={<Clock />}>
          {t("actionAttendance")}
        </HomeAction>
        <HomeAction href="/performance" icon={<ChartColumn />}>
          {t("actionMyKpi")}
        </HomeAction>
        <HomeAction href="/calendar" icon={<CalendarDays />}>
          {t("actionCalendar")}
        </HomeAction>
      </HomeActions>

      <HomeGrid>
        <EmployeeAttendanceWidget
          userId={data.user.id}
          userFullName={data.user.full_name}
          recentAttendance={data.recentAttendance}
          recentLeaveRequests={data.recentLeaveRequests}
          leaveBalance={data.leaveBalance}
          isLeaveModalOpen={leaveOpen}
          onLeaveModalChange={setLeaveOpen}
        />
      </HomeGrid>

      <HomeGrid>
        <HomeKpiCard
          userId={data.user.id}
          // The KPI reads "2026-All" for a whole year, like the filter.
          period={
            selectedQuarter === "All" ? `${selectedYear}-All` : selectedQuarter
          }
        />
        <EmployeePerformanceCards
          period={
            selectedQuarter === "All" ? `${selectedYear}-All` : selectedQuarter
          }
          upcomingReviews={data.upcomingReviews}
          upcomingOneOnOne={data.upcomingOneOnOne}
        />
      </HomeGrid>

      <EmployeeProjectsWidget
        projects={data.activeProjects}
        userId={data.user.id}
      />
    </HomeColumn>
  )
}

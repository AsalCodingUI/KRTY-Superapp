"use client"

import {
  getEmployeeOverview,
  getOverviewStats,
} from "@/app/(main)/performance/actions/employee-kpi-actions"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import {
  QuarterFilter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TabNavigation,
  TabNavigationLink,
  type QuarterFilterValue,
} from "@/shared/ui"
import { RiBarChartBoxLine } from "@/shared/ui/lucide-icons"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

// Dynamic imports for tab components - only load when needed
const KPITab = dynamic(
  () =>
    import("@/app/(main)/performance/components/kpi/KPITab").then(
      (mod) => mod.KPITab,
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    ),
  },
)

const Review360Tab = dynamic(
  () =>
    import("@/app/(main)/performance/components/360-review/Review360Tab").then(
      (mod) => mod.Review360Tab,
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    ),
  },
)

const OneOnOneMeetingTab = dynamic(
  () =>
    import("@/app/(main)/performance/components/meeting/OneOnOneMeetingTab").then(
      (mod) => mod.OneOnOneMeetingTab,
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    ),
  },
)

const ListProjectTab = dynamic(
  () =>
    import("@/app/(main)/performance/components/admin/ListProjectTab").then(
      (mod) => mod.ListProjectTab,
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    ),
  },
)

const WorkQualityTab = dynamic(
  () =>
    import("@/app/(main)/performance/components/admin/WorkQualityTab").then(
      (mod) => mod.WorkQualityTab,
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    ),
  },
)

type TabType =
  | "kpi"
  | "360-review"
  | "one-on-one"
  | "list-project"
  | "competency-library"

export function PerformancePage() {
  const [activeTab, setActiveTab] = useState<TabType>("kpi")
  const [selectedQuarter, setSelectedQuarter] =
    useState<QuarterFilterValue>("2025-Q1")
  const [statsData, setStatsData] = useState<{
    totalEmployees: number
    avgPerformance: number
    pendingReviews: number
    activeProjects: number
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [employeeStatsLoading, setEmployeeStatsLoading] = useState(true)
  const [employeeOverview, setEmployeeOverview] = useState<
    Array<{
      objective: string
      result: number | null
    }>
  >([])
  const [employeeReviewScore, setEmployeeReviewScore] = useState<number | null>(
    null,
  )
  const [employeeReviewLoading, setEmployeeReviewLoading] = useState(true)
  const [isCycleActive, setIsCycleActive] = useState(false)
  const { profile } = useUserProfile()
  const supabase = createClient()

  const isStakeholder = canManageByRole(profile?.role)
  const availableYears = [2025, 2026, 2027]
  const selectedYear = (() => {
    if (selectedQuarter === "All") return availableYears[0]
    const parsed = Number(selectedQuarter.split("-")[0])
    return Number.isNaN(parsed) ? availableYears[0] : parsed
  })()

  const handleYearChange = (yearStr: string) => {
    const year = Number(yearStr)
    const quarter = selectedQuarter.split("-")[1] || "Q1"
    const normalizedQuarter = quarter === "All" ? "All" : quarter
    setSelectedQuarter(`${year}-${normalizedQuarter}`)
  }
  useEffect(() => {
    let isMounted = true
    setStatsLoading(true)
    getOverviewStats(selectedQuarter)
      .then((result) => {
        if (!isMounted) return
        if (result.success && result.data) {
          setStatsData(result.data)
        } else {
          setStatsData(null)
        }
      })
      .catch(() => {
        if (isMounted) setStatsData(null)
      })
      .finally(() => {
        if (isMounted) setStatsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedQuarter])

  useEffect(() => {
    const checkCycle = async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from("review_cycles")
        .select("id")
        .lte("start_date", now)
        .gte("end_date", now)
        .eq("is_active", true)
        .single()

      setIsCycleActive(Boolean(data))
    }

    checkCycle()
  }, [supabase])

  useEffect(() => {
    if (!profile?.id || isStakeholder) return
    let isMounted = true
    setEmployeeStatsLoading(true)
    getEmployeeOverview(profile.id, selectedQuarter)
      .then((result) => {
        if (!isMounted) return
        if (result.success && result.data) {
          setEmployeeOverview(result.data)
        } else {
          setEmployeeOverview([])
        }
      })
      .catch(() => {
        if (isMounted) setEmployeeOverview([])
      })
      .finally(() => {
        if (isMounted) setEmployeeStatsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [profile?.id, selectedQuarter, isStakeholder])

  useEffect(() => {
    if (!profile?.id || isStakeholder) return
    let isMounted = true
    const loadReviewScore = async () => {
      setEmployeeReviewLoading(true)
      try {
        const { data: cycles } = await supabase
          .from("review_cycles")
          .select("id")
          .eq("name", selectedQuarter)
          .limit(1)

        const cycleId = cycles?.[0]?.id
        if (!cycleId) {
          if (isMounted) setEmployeeReviewScore(null)
          return
        }

        const { data: summaries } = await supabase
          .from("performance_summaries")
          .select("overall_percentage")
          .eq("reviewee_id", profile.id)
          .eq("cycle_id", cycleId)
          .limit(1)

        if (isMounted) {
          setEmployeeReviewScore(
            summaries?.[0]?.overall_percentage ?? null,
          )
        }
      } finally {
        if (isMounted) setEmployeeReviewLoading(false)
      }
    }

    loadReviewScore()
    return () => {
      isMounted = false
    }
  }, [profile?.id, selectedQuarter, isStakeholder, supabase])

  const adminStats = [
    {
      label: "Total Employees",
      value: statsLoading ? "—" : statsData?.totalEmployees ?? "—",
    },
    {
      label: "Avg. Performance",
      value: statsLoading
        ? "—"
        : statsData?.avgPerformance
          ? `${statsData.avgPerformance}%`
          : "—",
    },
    {
      label: "Pending Reviews",
      value: statsLoading ? "—" : statsData?.pendingReviews ?? "—",
    },
    {
      label: "Active Project",
      value: statsLoading ? "—" : statsData?.activeProjects ?? "—",
    },
    {
      label: "360 Review",
      value: isCycleActive ? "Active" : "No Active",
    },
  ]

  const getEmployeeMetric = (key: string) => {
    const row = employeeOverview.find((item) => item.objective === key)
    if (employeeStatsLoading) return "0.0"
    if (!row || row.result === null) return "0.0"
    return Number(row.result).toFixed(1)
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-[14px] px-5 pt-4 pb-3">
        <RiBarChartBoxLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">
          Individual Performance
        </p>
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-[14px]">
        {isStakeholder ? (
          <>
            <div className="grid grid-cols-1 gap-md px-5 py-2 sm:grid-cols-2 lg:grid-cols-5">
              {adminStats.map((item) => (
                <div
                  key={item.label}
                  className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-[10px] border px-4 py-3"
                >
                  <p className="text-label-sm text-foreground-secondary">
                    {item.label}
                  </p>
                  <p className="text-heading-md text-foreground-primary">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-5 pt-2 border-b border-neutral-primary">
              <TabNavigation className="border-b-0" value={activeTab}>
                <TabNavigationLink
                  active={activeTab === "kpi"}
                  onClick={() => setActiveTab("kpi")}
                >
                  KPI
                </TabNavigationLink>
                <TabNavigationLink
                  active={activeTab === "360-review"}
                  onClick={() => setActiveTab("360-review")}
                >
                  360 Review
                </TabNavigationLink>
                <TabNavigationLink
                  active={activeTab === "one-on-one"}
                  onClick={() => setActiveTab("one-on-one")}
                >
                  Jadwal 1:1
                </TabNavigationLink>

                <TabNavigationLink
                  active={activeTab === "list-project"}
                  onClick={() => setActiveTab("list-project")}
                >
                  List Project
                </TabNavigationLink>
                <TabNavigationLink
                  active={activeTab === "competency-library"}
                  onClick={() => setActiveTab("competency-library")}
                >
                  Competency Library
                </TabNavigationLink>
              </TabNavigation>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-md px-5 py-2 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: "On Time SLA Project",
                  value: getEmployeeMetric("On Time SLA Project"),
                },
                {
                  label: "360 Review",
                  value: employeeReviewLoading
                    ? "0.0"
                    : employeeReviewScore !== null
                      ? Number(employeeReviewScore).toFixed(1)
                      : "0.0",
                },
                {
                  label: "Work Quality Competency",
                  value: getEmployeeMetric("Work Quality Competency"),
                },
                {
                  label: "360 Feedback Cycle",
                  value: isCycleActive ? "Active" : "No Active",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-[10px] border px-4 py-3"
                >
                  <p className="text-label-sm text-foreground-secondary">
                    {item.label}
                  </p>
                  <p className="text-heading-md text-foreground-primary">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-neutral-primary px-5 pt-2">
              <TabNavigation className="border-b-0" value={activeTab}>
                <TabNavigationLink
                  active={activeTab === "kpi"}
                  onClick={() => setActiveTab("kpi")}
                >
                  KPI
                </TabNavigationLink>
                <TabNavigationLink
                  active={activeTab === "360-review"}
                  onClick={() => setActiveTab("360-review")}
                >
                  360 Review
                </TabNavigationLink>
                <TabNavigationLink
                  active={activeTab === "one-on-one"}
                  onClick={() => setActiveTab("one-on-one")}
                >
                  Jadwal 1:1
                </TabNavigationLink>
              </TabNavigation>

              <div className="flex items-center gap-2 pb-2">
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
                  onChange={setSelectedQuarter}
                  showYear={false}
                />
              </div>
            </div>
          </>
        )}

        <div className="p-5">
          {activeTab === "kpi" && (
            <KPITab
              selectedQuarter={selectedQuarter}
              onQuarterChange={setSelectedQuarter}
            />
          )}
          {activeTab === "360-review" && (
            <Review360Tab
              selectedQuarter={selectedQuarter}
              onQuarterChange={setSelectedQuarter}
            />
          )}
          {activeTab === "one-on-one" && <OneOnOneMeetingTab />}
          {activeTab === "list-project" && isStakeholder && <ListProjectTab />}
          {activeTab === "competency-library" && isStakeholder && (
            <WorkQualityTab />
          )}
        </div>
      </div>
    </div>
  )
}

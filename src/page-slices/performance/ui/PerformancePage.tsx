"use client"

import {
  getEmployeeOverview,
  getOverviewStats,
} from "@/app/(main)/performance/actions/employee-kpi-actions"
import { createClient } from "@/shared/api/supabase/client"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import {
  Badge,
  Button,
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
import { useMountedTabs } from "@/shared/hooks/useMountedTabs"
import { useEffect, useState } from "react"

// Dynamic imports for tab components - only load when needed
const KPITab = dynamic(
  () =>
    import("@/app/(main)/performance/components/kpi/KPITab").then(
      (mod) => mod.KPITab,
    ),
  {
    loading: () => null,
  },
)

const Review360Tab = dynamic(
  () =>
    import("@/app/(main)/performance/components/360-review/Review360Tab").then(
      (mod) => mod.Review360Tab,
    ),
  {
    loading: () => null,
  },
)

const OneOnOneMeetingTab = dynamic(
  () =>
    import("@/app/(main)/performance/components/meeting/OneOnOneMeetingTab").then(
      (mod) => mod.OneOnOneMeetingTab,
    ),
  {
    loading: () => null,
  },
)

const ListProjectTab = dynamic(
  () =>
    import("@/app/(main)/performance/components/admin/ListProjectTab").then(
      (mod) => mod.ListProjectTab,
    ),
  {
    loading: () => null,
  },
)

const WorkQualityTab = dynamic(
  () =>
    import("@/app/(main)/performance/components/admin/WorkQualityTab").then(
      (mod) => mod.WorkQualityTab,
    ),
  {
    loading: () => null,
  },
)

const LeadReviewTab = dynamic(
  () =>
    import("@/app/(main)/performance/components/lead/LeadReviewTab").then(
      (mod) => mod.LeadReviewTab,
    ),
  {
    loading: () => null,
  },
)

type TabType =
  | "kpi"
  | "360-review"
  | "one-on-one"
  | "lead-review"
  | "list-project"
  | "competency-library"

export function PerformancePage() {
  const { activeTab, setActiveTab } = useTabRoute<TabType>({
    basePath: "/performance",
    tabs: [
      "kpi",
      "360-review",
      "one-on-one",
      "lead-review",
      "list-project",
      "competency-library",
    ],
    defaultTab: "kpi",
    mode: "history",
  })
  const { isMounted } = useMountedTabs(activeTab)
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
  const [activeCycleRange, setActiveCycleRange] = useState<string | null>(null)
  const [isLead, setIsLead] = useState(false)

  const { profile } = useUserProfile()
  const supabase = createClient()

  const isStakeholder = canManageByRole(profile?.role)

  useEffect(() => {
    if (
      !isStakeholder &&
      (activeTab === "list-project" || activeTab === "competency-library")
    ) {
      setActiveTab("kpi")
    }
  }, [activeTab, isStakeholder, setActiveTab])
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

  const formatCycleRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return null
    }

    const startText = startDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    })
    const endText = endDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    return `${startText} - ${endText}`
  }

  const getRatingBadge = (score: number | null) => {
    const normalizedScore = score ?? 0
    if (normalizedScore >= 95)
      return { variant: "success", label: "Outstanding" } as const
    if (normalizedScore >= 85)
      return { variant: "success", label: "Above" } as const
    if (normalizedScore >= 75)
      return { variant: "info", label: "Meets" } as const
    if (normalizedScore >= 60)
      return { variant: "warning", label: "Below" } as const
    return { variant: "error", label: "Needs" } as const
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
    let isMounted = true
    const checkLead = async () => {
      if (!profile?.id) {
        if (isMounted) setIsLead(false)
        return
      }
      const { count, error } = await supabase
        .from("project_assignments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_lead", true)

      if (!isMounted) return
      if (error) {
        console.error("Error checking lead assignments:", error)
        setIsLead(false)
        return
      }
      setIsLead(Boolean(count && count > 0))
    }

    checkLead()
    return () => {
      isMounted = false
    }
  }, [profile?.id, supabase])

  useEffect(() => {
    const checkCycle = async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from("review_cycles")
        .select("id, start_date, end_date")
        .lte("start_date", now)
        .gte("end_date", now)
        .eq("is_active", true)
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle()

      setIsCycleActive(Boolean(data))
      setActiveCycleRange(
        data?.start_date && data?.end_date
          ? formatCycleRange(data.start_date, data.end_date)
          : null,
      )
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

        const cycleIds = cycles
          ?.map((cycle: { id: string }) => cycle.id)
          .filter(Boolean) as string[] | undefined

        if (!cycleIds || cycleIds.length === 0) {
          if (isMounted) setEmployeeReviewScore(null)
          return
        }

        const { data: summaries } = await supabase
          .from("performance_summaries")
          .select("overall_percentage")
          .eq("reviewee_id", profile.id)
          .in("cycle_id", cycleIds)
          .order("created_at", { ascending: false })
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
    if (employeeStatsLoading) return null
    if (!row || row.result === null) return 0
    return Number(row.result)
  }

  const formatPercent = (value: number | null) => {
    if (value === null) return "0.0%"
    return `${Number(value).toFixed(1)}%`
  }

  const employeeStats = [
    {
      key: "sla",
      label: "On Time SLA Project",
      score: getEmployeeMetric("On Time SLA Project"),
    },
    {
      key: "review",
      label: "360 Review",
      score:
        employeeReviewLoading || employeeReviewScore === null
          ? 0
          : Number(employeeReviewScore),
    },
    {
      key: "quality",
      label: "Work Quality Competency",
      score: getEmployeeMetric("Work Quality Competency"),
    },
  ]

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
        <RiBarChartBoxLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">
          Individual Performance
        </p>
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
        {isStakeholder ? (
          <>
            <div className="grid grid-cols-1 gap-md px-5 py-2 sm:grid-cols-2 lg:grid-cols-5">
              {adminStats.map((item) => (
                <div
                  key={item.label}
                  className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3"
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

                {isLead && (
                  <TabNavigationLink
                    active={activeTab === "lead-review"}
                    onClick={() => setActiveTab("lead-review")}
                  >
                    Team KPI
                  </TabNavigationLink>
                )}

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
              {employeeStats.map((item) => {
                const badge = getRatingBadge(item.score)
                return (
                  <div
                    key={item.key}
                    className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3"
                  >
                    <p className="text-label-sm text-foreground-secondary">
                      {item.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-heading-md text-foreground-primary">
                        {formatPercent(item.score)}
                      </p>
                      <Badge size="sm" variant={badge.variant}>
                        {badge.label}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3 lg:col-span-2">
                <p className="text-label-sm text-foreground-secondary">
                  360 Feedback Cycle
                </p>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-heading-md text-foreground-primary whitespace-nowrap">
                      {isCycleActive && activeCycleRange
                        ? activeCycleRange
                        : "No Active"}
                    </p>
                    {isCycleActive ? (
                      <Badge size="sm" variant="success">
                        Active
                      </Badge>
                    ) : null}
                  </div>
                  <Button variant="secondary" size="sm" disabled={!isCycleActive}>
                    Create Review
                  </Button>
                </div>
              </div>
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

                {isLead && (
                  <TabNavigationLink
                    active={activeTab === "lead-review"}
                    onClick={() => setActiveTab("lead-review")}
                  >
                    Team KPI
                  </TabNavigationLink>
                )}
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
          {isMounted("kpi") && (
            <div className={activeTab === "kpi" ? "block" : "hidden"}>
              <KPITab selectedQuarter={selectedQuarter} />
            </div>
          )}
          {isMounted("360-review") && (
            <div className={activeTab === "360-review" ? "block" : "hidden"}>
              <Review360Tab
                selectedQuarter={selectedQuarter}
                onQuarterChange={setSelectedQuarter}
              />
            </div>
          )}
          {isMounted("one-on-one") && (
            <div className={activeTab === "one-on-one" ? "block" : "hidden"}>
              <OneOnOneMeetingTab selectedQuarter={selectedQuarter} />
            </div>
          )}
          {isLead && isMounted("lead-review") && (
            <div className={activeTab === "lead-review" ? "block" : "hidden"}>
              <LeadReviewTab />
            </div>
          )}
          {isStakeholder && isMounted("list-project") && (
            <div className={activeTab === "list-project" ? "block" : "hidden"}>
              <ListProjectTab />
            </div>
          )}
          {isStakeholder && isMounted("competency-library") && (
            <div
              className={
                activeTab === "competency-library" ? "block" : "hidden"
              }
            >
              <WorkQualityTab />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

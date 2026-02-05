"use client"

import { getOverviewStats } from "@/app/(main)/performance/actions/employee-kpi-actions"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import type { QuarterFilterValue } from "@/shared/ui"
import { TabNavigation, TabNavigationLink } from "@/shared/ui"
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
  const [isCycleActive, setIsCycleActive] = useState(false)
  const { profile } = useUserProfile()
  const supabase = createClient()

  const isStakeholder = canManageByRole(profile?.role)
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

  const stats = [
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

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-[14px] px-5 pt-4 pb-3">
        <RiBarChartBoxLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">
          Individual Performance
        </p>
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-[14px]">
        <div className="grid grid-cols-1 gap-md px-5 py-2 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((item) => (
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

            {/* ADMIN TABS (Stakeholder Only) */}
            {isStakeholder && (
              <>
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
              </>
            )}
          </TabNavigation>
        </div>

        <div className="p-5">
          {activeTab === "kpi" && <KPITab />}
          {activeTab === "360-review" && <Review360Tab />}
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

"use client"

import { useMountedTabs } from "@/shared/hooks/useMountedTabs"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { createClient } from "@/shared/api/supabase/client"
import { canManageByRole } from "@/shared/lib/roles"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TabNavigation,
  TabNavigationLink,
} from "@/shared/ui"
import { RiBarChartBoxLine } from "@/shared/ui/lucide-icons"
import dynamic from "next/dynamic"
import type { QuarterFilterValue } from "@/shared/ui"
import { useEffect, useMemo, useState } from "react"

function getCurrentQuarterValue(): QuarterFilterValue {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const q = m <= 3 ? "Q1" : m <= 6 ? "Q2" : m <= 9 ? "Q3" : "Q4"
  return `${y}-${q}`
}

// Dynamic imports for tab components - only load when needed
const OverviewTab = dynamic(
  () =>
    import("./components/overview/OverviewTab").then((mod) => mod.OverviewTab),
  {
    loading: () => null,
  },
)

const KPITab = dynamic(
  () => import("./components/kpi/KPITab").then((mod) => mod.KPITab),
  {
    loading: () => null,
  },
)

const Review360Tab = dynamic(
  () =>
    import("./components/360-review/Review360Tab").then(
      (mod) => mod.Review360Tab,
    ),
  {
    loading: () => null,
  },
)

const OneOnOneMeetingTab = dynamic(
  () =>
    import("./components/meeting/OneOnOneMeetingTab").then(
      (mod) => mod.OneOnOneMeetingTab,
    ),
  {
    loading: () => null,
  },
)

const ListProjectTab = dynamic(
  () =>
    import("./components/admin/ListProjectTab").then(
      (mod) => mod.ListProjectTab,
    ),
  {
    loading: () => null,
  },
)

const WorkQualityTab = dynamic(
  () =>
    import("./components/admin/WorkQualityTab").then(
      (mod) => mod.WorkQualityTab,
    ),
  {
    loading: () => null,
  },
)

const LeadReviewTab = dynamic(
  () =>
    import("./components/lead/LeadReviewTab").then((mod) => mod.LeadReviewTab),
  {
    loading: () => null,
  },
)

type TabType =
  | "overview"
  | "kpi"
  | "360-review"
  | "one-on-one"
  | "lead-review"
  | "list-project"
  | "competency-library"

export default function PerformanceClientPage() {
  const { activeTab, setActiveTab } = useTabRoute<TabType>({
    basePath: "/performance",
    tabs: [
      "overview",
      "kpi",
      "360-review",
      "one-on-one",
      "lead-review",
      "list-project",
      "competency-library",
    ],
    defaultTab: "overview",
    mode: "history",
  })
  const { isMounted } = useMountedTabs(activeTab)
  const { profile } = useUserProfile()
  const supabase = useMemo(() => createClient(), [])
  const [isLead, setIsLead] = useState(false)
  const [selectedQuarter] = useState<QuarterFilterValue>(getCurrentQuarterValue)

  const isStakeholder = canManageByRole(profile?.role)

  useEffect(() => {
    let isMounted = true

    const checkLead = async () => {
      if (!profile?.id) {
        if (isMounted) setIsLead(false)
        return
      }
      const { data, error } = await supabase
        .from("project_assignments")
        .select("id")
        .eq("user_id", profile.id)
        .eq("is_lead", true)
        .limit(1)

      if (!isMounted) return
      if (error || !data || data.length === 0) {
        setIsLead(false)
        return
      }
      setIsLead(true)
    }

    checkLead()
    return () => {
      isMounted = false
    }
  }, [profile?.id, supabase])

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
        <RiBarChartBoxLine className="size-4 text-foreground-secondary" />
        <p className="text-label-md text-foreground-primary">
          Individual Performance
        </p>
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
        <div className="px-5 pt-2 border-b border-neutral-primary">
          <div className="xl:hidden pb-2">
            <Select
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabType)}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="kpi">KPI</SelectItem>
                <SelectItem value="360-review">360 Review</SelectItem>
                <SelectItem value="one-on-one">Jadwal 1:1</SelectItem>
                {isLead && <SelectItem value="lead-review">Team KPI</SelectItem>}
                {isStakeholder && (
                  <>
                    <SelectItem value="list-project">List Project</SelectItem>
                    <SelectItem value="competency-library">Competency Library</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="hidden xl:block">
            <TabNavigation value={activeTab} className="border-b-0">
              <TabNavigationLink
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </TabNavigationLink>
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
        </div>

          {/* TAB CONTENT */}
          <div className="p-5">
            {isMounted("overview") && (
              <div className={activeTab === "overview" ? "block space-y-5" : "hidden space-y-5"}>
                <OverviewTab />
              </div>
            )}
            {isMounted("kpi") && (
              <div className={activeTab === "kpi" ? "block space-y-5" : "hidden space-y-5"}>
                <KPITab />
              </div>
            )}
            {isMounted("360-review") && (
              <div className={activeTab === "360-review" ? "block space-y-5" : "hidden space-y-5"}>
                <Review360Tab />
              </div>
            )}
            {isMounted("one-on-one") && (
              <div className={activeTab === "one-on-one" ? "block space-y-5" : "hidden space-y-5"}>
                <OneOnOneMeetingTab selectedQuarter={selectedQuarter} />
              </div>
            )}
            {isLead && isMounted("lead-review") && (
              <div className={activeTab === "lead-review" ? "block space-y-5" : "hidden space-y-5"}>
                <LeadReviewTab />
              </div>
            )}
            {isStakeholder && isMounted("list-project") && (
              <div className={activeTab === "list-project" ? "block space-y-5" : "hidden space-y-5"}>
                <ListProjectTab selectedQuarter={selectedQuarter} />
              </div>
            )}
            {isStakeholder && isMounted("competency-library") && (
              <div
                className={
                  activeTab === "competency-library"
                    ? "block space-y-5"
                    : "hidden space-y-5"
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

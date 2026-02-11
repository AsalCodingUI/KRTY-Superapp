"use client"

import { useTabRoute } from "@/shared/hooks/useTabRoute"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { createClient } from "@/shared/api/supabase/client"
import { canManageByRole } from "@/shared/lib/roles"
import { TabNavigation, TabNavigationLink } from "@/shared/ui"
import { RiBarChartBoxLine } from "@/shared/ui/lucide-icons"
import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"

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
  const { profile } = useUserProfile()
  const supabase = useMemo(() => createClient(), [])
  const [isLead, setIsLead] = useState(false)

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
        <div className="space-y-6 p-5">
          {/* TAB NAVIGATION */}
          <TabNavigation value={activeTab}>
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

          {/* TAB CONTENT */}
          <div>
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "kpi" && <KPITab />}
            {activeTab === "360-review" && <Review360Tab />}
            {activeTab === "one-on-one" && (
              <OneOnOneMeetingTab selectedQuarter="2025-Q1" />
            )}
            {activeTab === "lead-review" && isLead && <LeadReviewTab />}
            {activeTab === "list-project" && isStakeholder && (
              <ListProjectTab />
            )}
            {activeTab === "competency-library" && isStakeholder && (
              <WorkQualityTab />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

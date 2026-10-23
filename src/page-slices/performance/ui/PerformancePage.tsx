"use client"

import { cn } from "@/lib/utils"
import { TAB_ENTER, useTabSwitched } from "@/shared/hooks/useTabSwitched"
import { PageHeader } from "@/components/page-header"
import { QuarterFilter } from "@/components/quarter-filter"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { useViewMode, ViewToggle } from "@/components/view-toggle"
import { createClient } from "@/shared/api/supabase/client"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { EmployeeKpiView } from "./kpi/EmployeeKpiView"
import { normalizePeriod, periodYears } from "./kpi/period"
import { TeamKpiList } from "./kpi/TeamKpiList"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import dynamic from "next/dynamic"

/** Stats band + list placeholder while a tab's chunk loads (as loading.tsx). */
function TabFallback() {
  return (
    <>
      <div className="bleed gutter-x border-border flex gap-10 border-b py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-4 h-64 w-full" />
    </>
  )
}

// KPI is the default tab and stays eager; the rest load when opened.
const loading = () => <TabFallback />
const ReviewMonitoring = dynamic(
  () => import("./review/ReviewMonitoring").then((m) => m.ReviewMonitoring),
  { loading },
)
const MyReview = dynamic(
  () => import("./review/MyReview").then((m) => m.MyReview),
  { loading },
)
const OneOnOne = dynamic(
  () => import("./meeting/OneOnOne").then((m) => m.OneOnOne),
  { loading },
)
const LeadTeam = dynamic(
  () => import("./kpi/LeadTeam").then((m) => m.LeadTeam),
  { loading },
)
const CompetencyLibrary = dynamic(
  () =>
    import("./competency/CompetencyLibrary").then((m) => m.CompetencyLibrary),
  { loading },
)

type Tab = "kpi" | "360-review" | "one-on-one" | "team" | "competency-library"

const TABS: readonly Tab[] = [
  "kpi",
  "360-review",
  "one-on-one",
  "team",
  "competency-library",
]

/**
 * Performance: KPI, 360 review, 1:1 and (for leads) the team to score.
 * One period filter for every tab, kept in the URL (?periode=2026-Q4).
 */
export function PerformancePage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { profile, loading } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const period = normalizePeriod(searchParams.get("periode"))
  const [view, setView] = useViewMode("performance-kpi")
  const supabase = useMemo(() => createClient(), [])

  const { activeTab, setActiveTab } = useTabRoute<Tab>({
    basePath: "/performance",
    tabs: TABS,
    defaultTab: "kpi",
    preserveQuery: true,
  })
  const tabSwitched = useTabSwitched(activeTab)

  const { data: isLead = false } = useQuery({
    queryKey: ["is-lead", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { count } = await supabase
        .from("project_assignments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile!.id)
        .eq("is_lead", true)
      return Boolean(count)
    },
  })

  const setPeriod = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("periode", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const tabs: { value: Tab; label: string }[] = [
    { value: "kpi", label: isAdmin ? "KPI tim" : "KPI saya" },
    { value: "360-review", label: "360 review" },
    { value: "one-on-one", label: "Jadwal 1:1" },
    ...(isLead ? [{ value: "team" as Tab, label: "Tim saya" }] : []),
    ...(isAdmin
      ? [{ value: "competency-library" as Tab, label: "Kompetensi" }]
      : []),
  ]

  if (loading || !profile) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }

  const allowed = tabs.some((t) => t.value === activeTab)
  const tab: Tab = allowed ? activeTab : "kpi"

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title="Performance"
        actions={
          <>
            {tab === "kpi" && isAdmin && (
              <ViewToggle value={view} onValueChange={setView} />
            )}
            {tab !== "competency-library" && (
              <QuarterFilter
                value={period}
                onChange={setPeriod}
                years={periodYears()}
              />
            )}
          </>
        }
      />

      <div className="bleed gutter-x border-border border-b">
        <TabNavigation className="border-b-0">
          {tabs.map((t) => (
            <TabNavigationLink
              key={t.value}
              active={tab === t.value}
              onClick={() => setActiveTab(t.value)}
            >
              {t.label}
            </TabNavigationLink>
          ))}
        </TabNavigation>
      </div>

      {/* Each tab brings its own stats band / toolbar, then the list. */}
      <div key={tab} className={cn("pb-4", tabSwitched && TAB_ENTER)}>
        {tab === "kpi" &&
          (isAdmin ? (
            <TeamKpiList scope={period} view={view} />
          ) : (
            <EmployeeKpiView
              userId={profile.id}
              scope={period}
              hrefFor={(p) =>
                `/performance/employee/${profile.id}/project/${p.projectId}?periode=${encodeURIComponent(period)}`
              }
            />
          ))}
        {tab === "360-review" &&
          (isAdmin ? (
            <ReviewMonitoring period={period} />
          ) : (
            <MyReview period={period} />
          ))}
        {tab === "one-on-one" && <OneOnOne period={period} />}
        {tab === "team" && <LeadTeam period={period} />}
        {tab === "competency-library" && isAdmin && <CompetencyLibrary />}
      </div>
    </div>
  )
}

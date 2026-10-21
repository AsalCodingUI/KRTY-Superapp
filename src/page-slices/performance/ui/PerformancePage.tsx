"use client"

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
import { CompetencyLibrary } from "./competency/CompetencyLibrary"
import { EmployeeKpiView } from "./kpi/EmployeeKpiView"
import { LeadTeam } from "./kpi/LeadTeam"
import { normalizePeriod, periodYears } from "./kpi/period"
import { TeamKpiList } from "./kpi/TeamKpiList"
import { OneOnOne } from "./meeting/OneOnOne"
import { MyReview } from "./review/MyReview"
import { ReviewMonitoring } from "./review/ReviewMonitoring"
import { Spinner } from "@/components/ui/spinner"

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b">
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
        <div className="flex h-10 items-center gap-2 pb-2">
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
        </div>
      </div>

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
  )
}

"use client"

import { cn } from "@/lib/utils"
import { TAB_ENTER, useTabSwitched } from "@/shared/hooks/useTabSwitched"
import { PageHeader } from "@/components/page-header"
import { QuarterFilter } from "@/components/quarter-filter"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import { useT } from "@/shared/i18n/client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { MyKpiView } from "./kpi/MyKpiView"
import { normalizePeriod, periodYears } from "./kpi/period"
import { TeamKpiList } from "./kpi/TeamKpiList"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import dynamic from "next/dynamic"
import { ProjectKpiSheet, projectSheetHref } from "./kpi/ProjectKpiSheet"

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
const OneOnOne = dynamic(
  () => import("./meeting/OneOnOne").then((m) => m.OneOnOne),
  { loading },
)
const CompetencyLibrary = dynamic(
  () =>
    import("./competency/CompetencyLibrary").then((m) => m.CompetencyLibrary),
  { loading },
)

type Tab = "kpi" | "360-review" | "one-on-one" | "competency-library"

const TABS: readonly Tab[] = [
  "kpi",
  "360-review",
  "one-on-one",
  "competency-library",
]

/**
 * Performance: KPI, 360 review and 1:1. A lead scores their team in the
 * project's "Penilaian" page.
 * One period filter for every tab, kept in the URL (?period=2026-Q4).
 */
export function PerformancePage() {
  const t = useT("performance")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { profile, loading } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const period = normalizePeriod(searchParams.get("period"))

  const { activeTab, setActiveTab } = useTabRoute<Tab>({
    basePath: "/performance",
    tabs: TABS,
    defaultTab: "kpi",
    preserveQuery: true,
  })
  const tabSwitched = useTabSwitched(activeTab)

  const setPeriod = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const tabs: { value: Tab; label: string }[] = [
    { value: "kpi", label: isAdmin ? t("teamKpi") : t("myKpi") },
    ...(isAdmin ? [{ value: "360-review" as Tab, label: t("tab360") }] : []),
    // Members get 360 and 1:1 as cards on their KPI page.
    ...(isAdmin
      ? [{ value: "one-on-one" as Tab, label: t("tabOneOnOne") }]
      : []),
    ...(isAdmin
      ? [{ value: "competency-library" as Tab, label: t("tabCompetency") }]
      : []),
  ]

  if (loading || !profile) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }

  const allowed = tabs.some((item) => item.value === activeTab)
  const tab: Tab = allowed ? activeTab : "kpi"

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={t("pageTitle")}
        actions={
          <>
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

      {/* A member without a team has one page: no tabs. */}
      {tabs.length > 1 && (
        <div className="bleed gutter-x border-border border-b">
          <TabNavigation className="border-b-0">
            {tabs.map((item) => (
              <TabNavigationLink
                key={item.value}
                active={tab === item.value}
                onClick={() => setActiveTab(item.value)}
              >
                {item.label}
              </TabNavigationLink>
            ))}
          </TabNavigation>
        </div>
      )}

      {/* Each tab brings its own stats band / toolbar, then the list. */}
      <div
        key={tab}
        className={cn(
          "pb-4",
          // A lead's own KPI is cards, not a stats band: give them room
          // under the tabs.
          tab === "kpi" && !isAdmin && tabs.length > 1 && "pt-4",
          tabSwitched && TAB_ENTER,
        )}
      >
        {tab === "kpi" &&
          (isAdmin ? (
            <TeamKpiList scope={period} />
          ) : (
            <MyKpiView
              userId={profile.id}
              scope={period}
              hrefFor={(p) =>
                projectSheetHref(
                  pathname,
                  { period },
                  { id: p.projectId, name: p.name },
                )
              }
            />
          ))}
        {tab === "360-review" && <ReviewMonitoring period={period} />}
        {tab === "one-on-one" && <OneOnOne period={period} />}
        {tab === "competency-library" && isAdmin && <CompetencyLibrary />}
      </div>
      <ProjectKpiSheet defaultMember={profile.id} />
    </div>
  )
}

"use client"

import { useBreadcrumbTrail, type Crumb } from "@/components/page-breadcrumbs"
import { matchProjectPath } from "@/shared/config/project-sections"
import { useProjectSummary } from "@/shared/hooks/useProjectSummary"
import { useLeadSites } from "@/page-slices/leads/model/data"
import { globalItems, scopePages, workspaces } from "@/shared/config/workspaces"
import { PROJECT_SECTION_KEYS } from "@/components/nav-project"
import { useT } from "@/shared/i18n/client"
import { usePathname } from "next/navigation"
import { useCallback, useMemo } from "react"
import {
  TabHistoryButtons,
  TabStrip,
  useAppTabsSync,
} from "@/widgets/app-tabs/ui/AppTabs"
import type { TabIcon } from "@/widgets/app-tabs/model/tabs-store"

// Every nav item any role can see (static config, built once).
let navItems: ReturnType<(typeof workspaces)[number]["items"]> | undefined
const allNavItems = () =>
  (navItems ??= [
    ...globalItems(),
    ...scopePages(),
    ...workspaces.flatMap((ws) => [
      ...ws.items({ role: "stakeholder", is_super_admin: true }),
      ...ws.items({ role: "employee" }),
    ]),
  ])

/** Current section, taken from the navigation config (fallback: path). */
function useSection(): Crumb {
  const pathname = usePathname()
  const t = useT("nav")
  const match = useMemo(
    () =>
      allNavItems()
        .filter(
          (item) =>
            pathname === item.href || pathname.startsWith(`${item.href}/`),
        )
        .sort((a, b) => b.href.length - a.href.length)[0],
    [pathname],
  )
  if (match) return { label: t(match.name), href: match.href }
  if (pathname.startsWith("/settings")) return { label: t("settings") }
  const seg = pathname.split("/").filter(Boolean)[0] ?? "dashboard"
  return {
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
    href: `/${seg}`,
  }
}

/** The nav item an href belongs to (longest match). */
function navItemFor(href: string) {
  const path = href.split("?")[0]
  return allNavItems()
    .filter((item) => path === item.href || path.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]
}

/**
 * The row above the page sheet, on the chrome: ‹ › through the active
 * tab's history, then the tabs (widgets/app-tabs); the active tab is cut
 * from the sheet's color and opens into it. Each tab is named after its
 * page: the last step (section, project trail, or what the page adds with
 * useBreadcrumbs). Phones have neither: their tab bar and the page title.
 * The Mac app puts it in its 52pt strip, beside the traffic lights.
 */
export function SiteHeader({
  history = true,
}: {
  /** ‹ › before the tabs (the Mac app has them by its sidebar toggle). */
  history?: boolean
} = {}) {
  const t = useT("nav")
  const section = useSection()
  const pathname = usePathname()
  const projectPath = matchProjectPath(pathname)
  const { data: project } = useProjectSummary(projectPath?.ref)
  const extra = useBreadcrumbTrail()
  // A Leads site (/leads/<id>): its tab shows the site's tile, as its row.
  const leadId = /^\/leads\/([^/]+)/.exec(pathname)?.[1]
  const { data: leadSites } = useLeadSites(Boolean(leadId))
  const lead = leadId ? leadSites?.find((s) => s.id === leadId) : undefined

  const sectionLabel = projectPath
    ? PROJECT_SECTION_KEYS[projectPath.section.slug]
      ? t(PROJECT_SECTION_KEYS[projectPath.section.slug])
      : projectPath.section.name
    : null
  const last: Crumb | undefined = extra.at(-1)
  // A project page reads "Owlpine · Tugas" unless the page names itself.
  const title =
    last?.label ??
    (projectPath
      ? project?.name
        ? sectionLabel && projectPath.slug
          ? `${project.name} · ${sectionLabel}`
          : project.name
        : ""
      : section.label)
  const icon = useMemo<TabIcon | undefined>(
    () =>
      projectPath && project
        ? { kind: "project", id: project.id, name: project.name }
        : lead
          ? { kind: "project", id: lead.id, name: lead.name }
          : section.href
          ? { kind: "nav", href: section.href }
          : undefined,
    [projectPath, project, lead, section.href],
  )
  useAppTabsSync({ title, icon })
  const navIcon = useCallback(
    (href: string) => navItemFor(href)?.icon ?? null,
    [],
  )
  // A tab not visited yet is named after its section until it loads.
  const describe = useCallback(
    (href: string) => {
      const item = navItemFor(href)
      return item ? { title: t(item.name), href: item.href } : null
    },
    [t],
  )

  return (
    <header
      data-slot="app-tabs"
      data-chrome-dark=""
      className="on-chrome text-foreground flex min-w-0 shrink-0 items-center gap-1 py-1.5 max-md:hidden"
    >
      {/* ‹ › lead the tabs (the sidebar toggle is in the sidebar's
          workspace row; the Mac app's by its traffic lights). */}
      {history && (
        <div className="flex items-center pr-1">
          <TabHistoryButtons />
        </div>
      )}
      <TabStrip navIcon={navIcon} describe={describe} />
    </header>
  )
}

"use client"

import { useBreadcrumbTrail, type Crumb } from "@/components/page-breadcrumbs"
import { matchProjectPath } from "@/shared/config/project-sections"
import { useProjectSummary } from "@/shared/hooks/useProjectSummary"
import { workspaces } from "@/shared/config/workspaces"
import { PROJECT_SECTION_KEYS } from "@/components/nav-project"
import { useT } from "@/shared/i18n/client"
import { usePathname } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useSidebar } from "@/components/ui/sidebar"
import { useMacChrome } from "@/components/desktop-shell"
import {
  TabHistoryButtons,
  TabStrip,
  useAppTabsSync,
} from "@/widgets/app-tabs/ui/AppTabs"
import type { TabIcon } from "@/widgets/app-tabs/model/tabs-store"

// Every nav item any role can see (static config, built once).
let navItems: ReturnType<(typeof workspaces)[number]["items"]> | undefined
const allNavItems = () =>
  (navItems ??= workspaces.flatMap((ws) => [
    ...ws.items({ role: "stakeholder", is_super_admin: true }),
    ...ws.items({ role: "employee" }),
  ]))

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

/** The sidebar icon of the nav item an href belongs to (longest match). */
function navIconFor(href: string) {
  const path = href.split("?")[0]
  return (
    allNavItems()
      .filter((item) => path === item.href || path.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.icon ?? null
  )
}

/**
 * The row above the page sheet, on the chrome: ‹ › through the active
 * tab's history, then the tabs (widgets/app-tabs); the active tab is cut
 * from the sheet's color and opens into it. Each tab is named after its
 * page: the last step (section, project trail, or what the page adds with
 * useBreadcrumbs). Phones have neither: their tab bar and the page title.
 * The Mac app puts it in its 52pt strip, beside the traffic lights.
 */
export function SiteHeader() {
  const t = useT("nav")
  const section = useSection()
  const pathname = usePathname()
  const projectPath = matchProjectPath(pathname)
  const { data: project } = useProjectSummary(projectPath?.ref)
  const extra = useBreadcrumbTrail()

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
        : section.href
          ? { kind: "nav", href: section.href }
          : undefined,
    [projectPath, project, section.href],
  )
  useAppTabsSync({ title, icon })
  const collapsed = useSidebar().state === "collapsed"
  const mac = useMacChrome()
  const navIcon = useCallback((href: string) => navIconFor(href), [])

  return (
    <header
      data-slot="app-tabs"
      data-chrome-dark=""
      className="on-chrome text-foreground flex h-11 min-w-0 shrink-0 items-stretch gap-1 max-md:hidden"
    >
      {/* ‹ › sit beside the sidebar toggle; with the sidebar collapsed
          (or in the Mac app's strip) they lead the tabs instead. */}
      {(collapsed || mac) && (
        <div className="flex items-center self-center pr-2">
          <TabHistoryButtons />
        </div>
      )}
      <TabStrip navIcon={navIcon} />
    </header>
  )
}

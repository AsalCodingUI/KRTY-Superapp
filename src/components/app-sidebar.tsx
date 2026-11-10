"use client"

import { projectHref } from "@/shared/lib/url-params"
import { AnimatePresence, m, type Variants } from "motion/react"
import { TRANSITION } from "@/shared/lib/motion"
import * as React from "react"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/app/siteConfig"
import { AppIcon } from "@/components/app-icon"
import { useMacChrome } from "@/components/desktop-shell"
import { AccountMenu, WorkspaceTabs } from "@/components/app-topbar"
import { GlobalSearch } from "@/widgets/global-search/ui/GlobalSearch"
import { Notifications } from "@/widgets/notifications/ui/Notifications"

import { NavMain } from "@/components/nav-main"
import { NavProject } from "@/components/nav-project"
import { PrefetchLink } from "@/components/prefetch-link"
import { ProjectAvatar } from "@/components/project-avatar"
import { SidebarNotices } from "@/components/sidebar-notices"
import { useWorkspaceNav } from "@/components/workspace-nav"
import { useWhatsNewUnseen } from "@/page-slices/whats-new/model/unseen"
import {
  asStage,
  STAGE_LABEL_KEYS,
  type ProjectStage,
} from "@/page-slices/projects/lib/status"
import { ProjectStageIcon } from "@/page-slices/projects/ui/ProjectStageIcon"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
  useSidebar,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { createClient } from "@/shared/api/supabase/client"
import { matchProjectPath } from "@/shared/config/project-sections"
import {
  globalItems,
  itemMatch,
  matchesRoute,
  resolveActiveChild,
  type WorkspaceItem,
  type WorkspaceProfile,
} from "@/shared/config/workspaces"
import { accessLevel, canOpenPage } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { isAdminRole } from "@/shared/lib/roles"
import { useQuery } from "@tanstack/react-query"
import { Settings, Sparkles } from "@/components/icons"
import { usePathname } from "next/navigation"
import { replaceUrl } from "@/shared/lib/url-params"

type SidebarProject = {
  id: string
  name: string
  href: string
  stage: ProjectStage | null
}

/**
 * Active projects for the Project workspace: every active project for
 * stakeholders, the user's own assignments for everyone else.
 */
/** Projects under way: not-started ones wait on the Projects page. */
const SIDEBAR_STATUSES = ["Active", "Review"]

function useSidebarProjects(
  profile: { id: string; role: string } | null,
  enabled: boolean,
) {
  return useQuery<SidebarProject[]>({
    queryKey: ["sidebar-projects", profile?.id, profile?.role],
    enabled: enabled && Boolean(profile),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!profile) return []
      const supabase = createClient()
      if (isAdminRole(profile.role)) {
        const { data } = await supabase
          .from("projects")
          .select("id, name, stage")
          .in("status", SIDEBAR_STATUSES)
          .order("name")
        return (
          (data ?? []) as { id: string; name: string; stage: string | null }[]
        ).map((p) => ({
          ...p,
          stage: asStage(p.stage),
          href: projectHref(p),
        }))
      }
      const { data } = await supabase
        .from("project_assignments")
        .select("projects!inner(id, name, status, stage)")
        .eq("user_id", profile.id)
        .in("projects.status", SIDEBAR_STATUSES)
      type Row = {
        projects: { id: string; name: string; stage: string | null }
      }
      return ((data ?? []) as unknown as Row[])
        .map((row) => row.projects)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({
          id: p.id,
          name: p.name,
          stage: asStage(p.stage),
          // Members open their projects like stakeholders do (membership
          // decides access).
          href: projectHref(p),
        }))
    },
  })
}

/** A project's stage at the row's end: the glyph, its name on hover. */
function SidebarStage({ stage }: { stage: ProjectStage }) {
  const t = useT("projects")
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        className="ml-auto flex shrink-0 items-center group-data-[collapsible=icon]:hidden"
      >
        {/* The menu button sizes every icon (the tint is important). */}
        <ProjectStageIcon stage={stage} className="size-3.5!" />
      </TooltipTrigger>
      <TooltipContent side="right">{t(STAGE_LABEL_KEYS[stage])}</TooltipContent>
    </Tooltip>
  )
}

/** A 30px icon button in the sidebar's bottom row, named on hover. */
function BottomIcon({
  label,
  active,
  dot,
  render,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  dot?: boolean
  render?: React.ReactElement
  onClick?: () => void
  children: React.ReactNode
}) {
  // Its own tooltip: the menu button's shows only when collapsed, and
  // these are icons only either way.
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <SidebarMenuButton
            aria-label={label}
            isActive={active}
            render={render}
            onClick={onClick}
            // Square, the icon centred.
            className="not-data-active:blend-ink relative size-[30px]! shrink-0 justify-center p-0!"
          />
        }
      >
        {children}
        {dot && (
          <span
            aria-hidden
            className="bg-primary absolute top-1 right-1 size-1.5 rounded-full"
          />
        )}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

const NAV_SLIDE: Variants = {
  enter: (dir: number) => ({ x: 16 * dir, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: -16 * dir, opacity: 0 }),
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const desktop = useMacChrome()
  const pathname = usePathname()
  const { profile } = useUserProfile()
  const { loading, active, badges } = useWorkspaceNav()
  // A project's own menu only while the Project workspace is shown (right
  // after switching to Kantor it gives way before the route changes).
  const projectPath =
    active?.id === "project" ? matchProjectPath(pathname) : null
  const { state: sidebarState } = useSidebar()
  // Which menu the sidebar shows; changing it slides the menus.
  const navKey = projectPath
    ? `project:${projectPath.ref}`
    : `ws:${active?.id ?? ""}`
  const navDirection = projectPath ? 1 : -1
  const t = useT("nav")
  const tPrefs = useT("prefs")
  // A dot on Yang baru while there's something the viewer hasn't seen.
  const { count: whatsNewUnseen } = useWhatsNewUnseen()

  // Only the Project workspace lists them: don't fetch them elsewhere.
  const { data: projects = [] } = useSidebarProjects(
    profile ? { id: profile.id, role: profile.role } : null,
    active?.id === "project",
  )

  // The top block, for whoever can open each page.
  const topItems = React.useMemo(() => {
    if (!profile) return []
    const level = accessLevel(profile as WorkspaceProfile)
    return globalItems().filter((item) => canOpenPage(item.href, level))
  }, [profile])

  // The best-matching row across the top block and the workspace's list is
  // the active page (so /calendar/santuy lights Kalender, /leave Cuti).
  const activeHref = React.useMemo(() => {
    let best: { href: string; length: number } | null = null
    for (const item of [...topItems, ...(active?.items ?? [])]) {
      const length = itemMatch(pathname, item)
      if (length && (!best || length > best.length))
        best = { href: item.href, length }
    }
    return best?.href
  }, [active, topItems, pathname])

  const toNav = React.useCallback(
    (item: WorkspaceItem) => {
      const children = (item.children ?? []).filter(
        (c) => !c.can || c.can(profile as WorkspaceProfile),
      )
      const activeChild =
        item.href === activeHref
          ? resolveActiveChild(pathname, children)
          : undefined
      return {
        title: t(item.name),
        url: item.href,
        icon: <item.icon />,
        isActive: item.href === activeHref,
        badge: badges[item.href],
        items: children.map((c) => ({
          title: t(c.name),
          url: c.href,
          isActive: c.href === activeChild,
          badge: badges[c.href],
        })),
      }
    },
    [activeHref, badges, pathname, profile, t],
  )
  const navItems = React.useMemo(
    () => active?.items.map(toNav),
    [active, toNav],
  )
  const topNav = React.useMemo(() => topItems.map(toNav), [topItems, toNav])
  // Cari first, Notifikasi after Beranda.
  const topSlots = React.useMemo(
    () => ({
      0: <GlobalSearch />,
      1: <Notifications variant="row" />,
    }),
    [],
  )

  return (
    <Sidebar
      collapsible="icon"
      // Same tinted chrome as the top bar; the page floats beside it.
      className="on-chrome overflow-hidden"
      // Dark in light mode too when Settings → Tampilan says so (globals.css).
      data-chrome-dark=""
      {...props}
    >
      <SidebarRail />
      {/* The brand, search (⌘K), the pages that are always there (Beranda,
          Notifikasi, Kalender, Tugas saya), then the workspaces as tabs. The
          sidebar toggle and ‹ › lead the tab row above the page
          (site-header.tsx). Collapsed: icons only, no tabs. */}
      <SidebarHeader
        // px-3: the same 12px edge as the menu rows below.
        // pt-2: the 40px brand row level with the tab row beside it.
        className={cn("gap-1 px-2 pb-1", desktop ? "pt-0" : "pt-2")}
      >
        {/* The brand, Mixpanel-style: a 24px mark, the studio's name and,
            under it, what you are here (your job title). */}
        <PrefetchLink
          href={siteConfig.baseLinks.dashboard}
          // mb-1: 8px to Cari; sections sit 4px apart (rows 2px). The mark
          // centres on the icon column below (24px from the edge).
          className="mb-1 flex h-10 min-w-0 items-center gap-2.5 pl-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-0"
          aria-label={siteConfig.name}
        >
          <AppIcon size={96} variant="mark" className="size-6 shrink-0" />
          <span className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-foreground truncate text-sm font-semibold">
              {siteConfig.name}
            </span>
            {profile?.job_title && (
              <span className="text-muted-foreground truncate text-xs">
                {profile.job_title}
              </span>
            )}
          </span>
        </PrefetchLink>
        {/* The group's own padding off: the header already sets the edge. */}
        <div className="-mx-2 [&>[data-sidebar=group]]:py-0">
          <NavMain items={topNav} slots={topSlots} />
        </div>
        <WorkspaceTabs className="group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      {/* First row starts level with the top of the page sheet. */}
      <SidebarContent>
        {loading ? (
          <div className="[&>[data-sidebar=group]:first-child]:pt-0">
            <SidebarMenu>
              {Array.from({ length: 5 }).map((_, i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        ) : (
          // Entering a project slides its menu in from the right (and the
          // workspace menu out to the left); going back reverses it.
          <AnimatePresence
            initial={false}
            mode="popLayout"
            custom={navDirection}
          >
            <m.div
              key={navKey}
              custom={navDirection}
              variants={NAV_SLIDE}
              initial="enter"
              animate="center"
              exit="exit"
              transition={TRANSITION}
              className="flex min-w-0 flex-col [&>[data-sidebar=group]:first-child]:pt-0"
            >
              {projectPath ? (
                <NavProject />
              ) : active ? (
                <NavMain items={navItems ?? []} />
              ) : null}
              {!projectPath &&
                active?.id === "project" &&
                projects.length > 0 && (
                  // pt-0: 4px from the list above, like every section.
                  <SidebarGroup className="pt-0">
                    <SidebarGroupLabel>{t("activeProjects")}</SidebarGroupLabel>
                    <SidebarMenu>
                      {projects.map((project) => (
                        <SidebarMenuItem key={project.id}>
                          <SidebarMenuButton
                            isActive={matchesRoute(pathname, project.href)}
                            render={<PrefetchLink href={project.href} />}
                          >
                            <ProjectAvatar
                              id={project.id}
                              name={project.name}
                              className="size-4"
                            />
                            <span className="truncate">{project.name}</span>
                            {project.stage && (
                              <SidebarStage stage={project.stage} />
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroup>
                )}
            </m.div>
          </AnimatePresence>
        )}
      </SidebarContent>
      {/* Cards above the footer: app update, what's new, the Mac app. */}
      <SidebarNotices />
      {/* The bottom, one row (Mixpanel-style): the account, then Yang baru
          (a dot while there's something unseen) and Settings as icons.
          Collapsed: stacked on the icon column. */}
      <SidebarGroup className="pt-0 pb-2">
        <div className="flex items-center gap-0.5 group-data-[collapsible=icon]:flex-col">
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:flex-none">
            <AccountMenu
              row
              side={sidebarState === "collapsed" ? "right" : "top"}
            />
          </div>
          <BottomIcon
            label={t("whatsNew")}
            active={matchesRoute(pathname, siteConfig.baseLinks.whatsNew)}
            dot={whatsNewUnseen > 0}
            render={<PrefetchLink href={siteConfig.baseLinks.whatsNew} />}
          >
            <Sparkles />
          </BottomIcon>
          <BottomIcon
            label={tPrefs("title")}
            onClick={() => {
              // Settings opens over the current page (?settings=…).
              const url = new URL(window.location.href)
              url.searchParams.set("settings", "general")
              replaceUrl(`${url.pathname}${url.search}`)
            }}
          >
            <Settings />
          </BottomIcon>
        </div>
      </SidebarGroup>
    </Sidebar>
  )
}

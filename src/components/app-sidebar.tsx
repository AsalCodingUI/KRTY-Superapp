"use client"

import { projectHref } from "@/shared/lib/url-params"
import { AppearancePopover } from "@/components/appearance-popover"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { AnimatePresence, m, type Variants } from "motion/react"
import { TRANSITION } from "@/shared/lib/motion"
import * as React from "react"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/app/siteConfig"
import { AppIcon } from "@/components/app-icon"
import { useMacChrome } from "@/components/desktop-shell"
import { WorkspaceSwitch } from "@/components/app-topbar"

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
  SidebarFooter,
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
  matchesRoute,
  resolveActiveChild,
  type WorkspaceProfile,
} from "@/shared/config/workspaces"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useTabSwitched } from "@/shared/hooks/useTabSwitched"
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
  // after switching to Pribadi it gives way before the route changes).
  const projectPath =
    active?.id === "project" ? matchProjectPath(pathname) : null
  const { state: sidebarState } = useSidebar()
  // Only after the first collapse / expand, not on page load.
  const sidebarToggled = useTabSwitched(sidebarState)
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

  // Longest matching href is the active page (so /calendar/personal does
  // not also light up /calendar).
  const activeHref = React.useMemo(
    () =>
      active?.items
        .filter((item) => matchesRoute(pathname, item.href))
        .sort((a, b) => b.href.length - a.href.length)[0]?.href,
    [active, pathname],
  )

  const navItems = React.useMemo(
    () =>
      active?.items.map((item) => {
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
          items: children.map((c) => ({
            title: t(c.name),
            url: c.href,
            isActive: c.href === activeChild,
            badge: badges[c.href],
          })),
        }
      }),
    [active, activeHref, badges, pathname, profile, t],
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
      {/* In the Mac app the brand and the workspace switch live here (the
          top bar holds the traffic lights instead). */}
      {desktop && (
        <SidebarHeader className="gap-3 px-2.5 pt-1 pb-3">
          <PrefetchLink
            href={siteConfig.baseLinks.dashboard}
            // The mark in line with the menu's icons below (same size, same
            // left edge).
            className="flex items-center gap-2 px-3"
            aria-label={siteConfig.name}
          >
            <AppIcon size={96} variant="mark" className="size-4" />
            <span className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
              {siteConfig.name}
            </span>
          </PrefetchLink>
          <div className="group-data-[collapsible=icon]:hidden">
            <WorkspaceSwitch fill />
          </div>
        </SidebarHeader>
      )}
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
                  <SidebarGroup>
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
      {/* Always at the bottom, above the theme switch: what's new (a dot
          while there's something unseen) and, in the Mac app, its settings. */}
      <SidebarGroup className="py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={matchesRoute(pathname, siteConfig.baseLinks.whatsNew)}
              tooltip={t("whatsNew")}
              render={<PrefetchLink href={siteConfig.baseLinks.whatsNew} />}
            >
              <Sparkles />
              <span className="truncate">{t("whatsNew")}</span>
              {whatsNewUnseen > 0 && (
                <span
                  aria-hidden
                  className="bg-primary ml-auto size-1.5 shrink-0 rounded-full group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-1 group-data-[collapsible=icon]:right-1"
                />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={tPrefs("title")}
              onClick={() => {
                // Settings opens over the current page (?settings=…).
                const url = new URL(window.location.href)
                url.searchParams.set("settings", "general")
                replaceUrl(`${url.pathname}${url.search}`)
              }}
            >
              <Settings />
              <span className="truncate">{tPrefs("title")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      {/* Theme, language and chrome color live here; there is no settings page. */}
      <SidebarFooter>
        {/* Stacks vertically when the sidebar is collapsed to icons. Re-keyed
            on the sidebar state so the new arrangement fades and settles in
            alongside the width animation instead of snapping. */}
        <div
          key={sidebarState}
          className={cn(
            "flex origin-bottom-left flex-nowrap items-center gap-2 group-data-[collapsible=icon]:flex-col",
            sidebarToggled && "animate-footer-in motion-reduce:animate-none",
          )}
        >
          <ThemeSwitcher className="group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:self-center" />
          <LanguageSwitcher className="group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:self-center" />
          <AppearancePopover className="group-data-[collapsible=icon]:self-center" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

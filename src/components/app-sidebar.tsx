"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/app/siteConfig"
import { useMacChrome } from "@/components/desktop-shell"
import { AppIcon } from "@/components/app-icon"
import { AccountMenu, WorkspaceTabs } from "@/components/app-topbar"
import { GlobalSearch } from "@/widgets/global-search/ui/GlobalSearch"
import { Notifications } from "@/widgets/notifications/ui/Notifications"

import { NavMain } from "@/components/nav-main"
import { NewMenu } from "@/components/new-menu"
import { useProjectTree } from "@/components/nav-project"
import { PrefetchLink } from "@/components/prefetch-link"
import { SidebarNotices } from "@/components/sidebar-notices"
import { useWorkspaceNav } from "@/components/workspace-nav"
import { useWhatsNewUnseen } from "@/page-slices/whats-new/model/unseen"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Collapse } from "@/components/ui/collapse"
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
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
} from "@/components/ui/sidebar"
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
import { ChevronDown, Settings, Sparkles } from "@/components/icons"
import { usePathname } from "next/navigation"
import { replaceUrl } from "@/shared/lib/url-params"

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

const CLOSED_KEY = "sidebar_closed_sections"

/** Which lists (Project aktif) are folded; remembered per device. */
function useClosedSections() {
  const [closed, setState] = React.useState<string[]>([])
  React.useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(CLOSED_KEY) ?? "[]")
      if (Array.isArray(saved)) setState(saved)
    } catch {
      // Storage blocked or a bad value: everything stays open.
    }
  }, [])
  const toggle = (id: string) =>
    setState((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
      try {
        window.localStorage.setItem(CLOSED_KEY, JSON.stringify(next))
      } catch {
        // Storage blocked: the choice lasts for this visit only.
      }
      return next
    })
  return [closed, toggle] as const
}

/**
 * A titled list that folds, Obvious-style ("⌃ Recent"): a muted label with
 * the chevron before it; the label is the toggle. Always open while the
 * sidebar is collapsed to icons.
 */
function NavSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    // mt-1: 16px from the list above (the content's 12px gap + 4), the
    // same 16px as between every block of the sidebar.
    <div className="mt-1 flex flex-col">
      <SidebarGroupLabel
        render={<button type="button" />}
        aria-expanded={open}
        onClick={onToggle}
        // The chevron on the icon column, the label where row labels start.
        // mb-0.5: 2px to the first item, the rows' step.
        className="text-muted-foreground hover:text-foreground mx-3 mb-0.5 w-fit cursor-pointer gap-2 pl-3 font-normal transition-colors"
      >
        <ChevronDown
          className={cn("size-3! transition-transform", open && "rotate-180")}
        />
        {label}
      </SidebarGroupLabel>
      <Collapse open={open}>{children}</Collapse>
    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const desktop = useMacChrome()
  const pathname = usePathname()
  const { profile } = useUserProfile()
  const { loading, active, badges } = useWorkspaceNav()
  const { state: sidebarState } = useSidebar()
  const [closed, toggleSection] = useClosedSections()
  const t = useT("nav")
  const tPrefs = useT("prefs")
  // A dot on Yang baru while there's something the viewer hasn't seen.
  const { count: whatsNewUnseen } = useWhatsNewUnseen()

  // Active projects, each opening in place to its pages.
  const projectTree = useProjectTree()

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
    // Inside a project its row wins (not Semua project's /projects).
    for (const project of projectTree)
      if (
        matchesRoute(pathname, project.url) &&
        (!best || project.url.length > best.length)
      )
        best = { href: project.url, length: project.url.length }
    return best?.href
  }, [active, topItems, projectTree, pathname])

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
    () => active?.items.map(toNav) ?? [],
    [active, toNav],
  )
  const topNav = React.useMemo(() => topItems.map(toNav), [topItems, toNav])
  // Cari first.
  const topSlots = React.useMemo(() => ({ 0: <GlobalSearch /> }), [])

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
      {/* The workspace row (the studio's mark and name, the sidebar
          toggle), + Baru with the bell, Cari (⌘K), the pages that are
          always there (Beranda, Kalender, Tugas saya), then the workspaces
          as tabs. Collapsed: icons only, no tabs. */}
      <SidebarHeader
        // px-3: the same 12px edge as the menu rows below.
        // pt-3: the workspace row (32px) centres on the tab row beside it.
        className={cn("gap-1 px-3 pb-4", desktop ? "pt-1" : "pt-3")}
      >
        {/* Obvious-style: a 20px avatar and the name (14px medium, starting
            at 46px like the labels below), the toggle at the
            end; mb-2: 12px to + Baru. Collapsed: the toggle alone. (The
            Mac app's toggle sits by its traffic lights instead.) */}
        <div className="mb-2 flex h-8 min-w-0 items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <PrefetchLink
            href={siteConfig.baseLinks.dashboard}
            // pl-1.5: the avatar centres on the icon column below.
            className="flex min-w-0 flex-1 items-center gap-2 pl-1.5 group-data-[collapsible=icon]:hidden"
          >
            <AppIcon
              variant="badge"
              size={96}
              className="size-5 shrink-0 rounded-[5px]"
            />
            <span className="text-foreground truncate text-sm font-medium">
              Kretya&apos;s Workspace
            </span>
          </PrefetchLink>
          {!desktop && (
            <SidebarTrigger className="text-muted-foreground hover:bg-chrome-hover shrink-0" />
          )}
        </div>
        {/* + Baru, the bell (icon only) beside it. Collapsed: stacked. */}
        <NewMenu
          // mb-2: 12px to Cari.
          className="mb-2"
          // The bell in an outlined circle, like Obvious's search button.
          aside={
            <Notifications
              variant="icon"
              className="border-chrome-border size-8 shrink-0 rounded-full border-[0.5px]"
            />
          }
        />
        {/* The group's own padding off: the header already sets the edge. */}
        <div className="-mx-3 [&>[data-sidebar=group]]:py-0">
          <NavMain items={topNav} slots={topSlots} />
        </div>
        <WorkspaceTabs className="mt-3 group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      {/* The open workspace's pages; in Project, then the active projects,
          each opening in place to its pages (no separate project menu). */}
      <SidebarContent className="gap-3">
        {loading ? (
          <SidebarGroup className="pt-0">
            <SidebarMenu>
              {Array.from({ length: 5 }).map((_, i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          <>
            <div className="[&>[data-sidebar=group]]:py-0">
              <NavMain items={navItems} />
            </div>
            {active?.id === "project" && projectTree.length > 0 && (
              <NavSection
                label={t("activeProjects")}
                open={
                  sidebarState === "collapsed" || !closed.includes("projects")
                }
                onToggle={() => toggleSection("projects")}
              >
                <div className="[&>[data-sidebar=group]]:py-0">
                  <NavMain items={projectTree} />
                </div>
              </NavSection>
            )}
          </>
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

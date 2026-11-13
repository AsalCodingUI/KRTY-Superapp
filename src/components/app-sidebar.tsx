"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/app/siteConfig"
import { useMacChrome } from "@/components/desktop-shell"
import { AppIcon } from "@/components/app-icon"
import { AppearancePopover } from "@/components/appearance-popover"
import { AccountMenu, WorkspaceTabs } from "@/components/app-topbar"
import { GlobalSearch } from "@/widgets/global-search/ui/GlobalSearch"
import { Notifications } from "@/widgets/notifications/ui/Notifications"

import { NavMain } from "@/components/nav-main"
import { NewMenu } from "@/components/new-menu"
import { useProjectTree } from "@/components/nav-project"
import { useLeadTree } from "@/page-slices/leads/ui/lead-tree"
import { WikiNewButton } from "@/page-slices/wiki/ui/WikiNewButton"
import { useWikiTree } from "@/page-slices/wiki/ui/wiki-tree"
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
  SidebarCompact,
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

/** A 32px icon button in the sidebar's bottom row, named on hover. */
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
            className="not-data-active:blend-ink relative size-8! shrink-0 justify-center p-0!"
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

/**
 * Folded sections, for this visit only: every load starts with them open
 * (the projects are what you came for), and a fold lasts until reload.
 */
function useClosedSections() {
  const [closed, setState] = React.useState<string[]>([])
  const toggle = (id: string) =>
    setState((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
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
        // mb-0.5: 2px to the first item, the rows' step. Full width, so
        // the whole row folds it, not just the words.
        className="blend-ink text-muted-foreground hover:text-foreground mx-3 mb-0.5 cursor-pointer justify-start gap-2 pl-3 text-left font-normal transition-colors"
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
  const pathname = usePathname()
  const { profile } = useUserProfile()
  const { loading, active, badges } = useWorkspaceNav()
  const { isMobile } = useSidebar()
  const [closed, toggleSection] = useClosedSections()
  const t = useT("nav")
  const tPrefs = useT("prefs")
  // A dot on Yang baru while there's something the viewer hasn't seen.
  const { count: whatsNewUnseen } = useWhatsNewUnseen()

  // Active projects, each opening in place to its pages.
  const projectTree = useProjectTree()
  // Leads' sites (its panel), loaded only while Leads is open.
  const leadsOpen = active?.id === "leads"
  const leadTree = useLeadTree(leadsOpen)
  // The wiki's pages (its panel), loaded only while the wiki is open.
  const wikiOpen = active?.id === "wiki"
  const wikiTree = useWikiTree(wikiOpen)
  // Leads, the wiki and Password are panels of their own: no + Baru,
  // search or the always-there pages (the wiki has its own + Halaman baru).
  const ownPanel = leadsOpen || wikiOpen || active?.id === "vault"

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
    // A Leads site's row too (not Kelola situs' /leads), and a wiki page's.
    for (const site of [...leadTree, ...wikiTree])
      if (
        matchesRoute(pathname, site.url) &&
        (!best || site.url.length > best.length)
      )
        best = { href: site.url, length: site.url.length }
    return best?.href
  }, [active, topItems, projectTree, leadTree, wikiTree, pathname])

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

  const newMenu = (
    <NewMenu
      // The bell in an outlined circle, like Obvious's search button.
      // Collapsed (the rail), no line: plain icons like the rows under them.
      aside={
        <Notifications
          variant="icon"
          className="border-border size-8 shrink-0 rounded-full border group-data-[collapsible=icon]:border-transparent"
        />
      }
    />
  )
  // Cari, then the pages that are always there (Beranda, Kalender, Tugas
  // saya). The group's own padding off: the column sets the edge.
  const topBlock = (
    <div className="[&>[data-sidebar=group]]:py-0">
      <NavMain items={topNav} slots={topSlots} />
    </div>
  )
  // The open workspace's pages; in Project, then the active projects,
  // each opening in place to its pages (no separate project menu).
  const workspaceList = loading ? (
    <SidebarGroup className="pt-0">
      <SidebarMenu>
        {Array.from({ length: 5 }).map((_, i) => (
          <SidebarMenuItem key={i}>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  ) : leadsOpen ? (
    // Leads: its sites straight away (no fold), then Kelola situs.
    <>
      <div className="[&>[data-sidebar=group]]:py-0">
        <NavMain items={leadTree} />
      </div>
      <div className="[&>[data-sidebar=group]]:py-0">
        <NavMain items={navItems} />
      </div>
    </>
  ) : wikiOpen ? (
    // Wiki: all pages, then the top-level pages (their subpages under them).
    <>
      <div className="[&>[data-sidebar=group]]:py-0">
        <NavMain items={navItems} />
      </div>
      {wikiTree.length > 0 && (
        <div className="[&>[data-sidebar=group]]:py-0">
          <NavMain items={wikiTree} />
        </div>
      )}
    </>
  ) : (
    <>
      <div className="[&>[data-sidebar=group]]:py-0">
        <NavMain items={navItems} />
      </div>
      {active?.id === "project" && projectTree.length > 0 && (
        <NavSection
          label={t("activeProjects")}
          open={!closed.includes("projects")}
          onToggle={() => toggleSection("projects")}
        >
          <div className="[&>[data-sidebar=group]]:py-0">
            <NavMain items={projectTree} />
          </div>
        </NavSection>
      )}
    </>
  )
  // The account, then the theme, Yang baru (a dot while there's something
  // unseen) and Settings as icons: one row (Mixpanel-style), stacked on
  // the rail.
  const footer = (
    <SidebarGroup className="pt-0 pb-2">
      <div className="flex items-center gap-0.5 group-data-[collapsible=icon]:flex-col">
        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:flex-none">
          <AccountMenu row side="top" />
        </div>
        {/* Theme and the chrome's color: on the rail from md up. */}
        {isMobile && <AppearancePopover className="size-8" />}
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
  )

  // The panel's title row: the open workspace (the rail picks it; the
  // toggle is on the rail, or by the Mac app's traffic lights). On phones
  // the studio's mark and name, there's no rail there. mb-2: 12px to +
  // Baru.
  const titleRow = (
    <div className="mb-2 flex h-8 min-w-0 items-center gap-2.5">
      {isMobile ? (
        <PrefetchLink
          href={siteConfig.baseLinks.dashboard}
          // pl-1.5: the avatar centres on the icon column below.
          className="flex min-w-0 flex-1 items-center gap-2 pl-1.5"
        >
          <AppIcon
            variant="badge"
            size={96}
            className="rounded-tile size-5 shrink-0"
          />
          <span className="text-foreground truncate text-sm font-medium">
            Kretya&apos;s Workspace
          </span>
        </PrefetchLink>
      ) : (
        // pl-2.5: where the rows' icons start.
        <span className="text-foreground min-w-0 flex-1 truncate pl-2.5 text-sm font-medium">
          {active ? t(active.name) : null}
        </span>
      )}
    </div>
  )
  // The panel (and the phone sheet): the title row, + Baru, the top
  // pages, the open workspace's pages, the cards, the footer.
  const panel = (
    <>
      <SidebarHeader
        // px-3: the same 12px edge as the menu rows below. In the sheet,
        // pt-3: 12px from its top edge.
        className={cn(
          // A panel of its own (its title alone): its rows start right
          // under it; the wiki's + Halaman baru gets the usual room.
          "gap-1 px-3",
          ownPanel && !wikiOpen ? "pb-1" : "pb-4",
          isMobile ? "pt-1.5" : "pt-3",
        )}
      >
        {titleRow}
        {/* Leads, the wiki and Password are their own: no + Baru,
            search or top pages (the wiki: its + Halaman baru). */}
        {!ownPanel && (
          <>
            <div className="mb-2">{newMenu}</div>
            <div className="-mx-3">{topBlock}</div>
          </>
        )}
        {wikiOpen && <WikiNewButton />}
        {/* Phones: Kantor | Project as tabs (the rail is md up). */}
        {isMobile && <WorkspaceTabs className="mt-3" />}
      </SidebarHeader>
      {/* The ends fade while there's more to scroll (scroll-fade). */}
      <SidebarContent className="scroll-fade gap-3">
        {workspaceList}
      </SidebarContent>
      {/* Cards above the footer: app update, what's new, the Mac app. */}
      <SidebarNotices />
      {footer}
    </>
  )

  if (isMobile)
    return (
      <Sidebar
        collapsible="icon"
        className="on-chrome overflow-hidden"
        data-chrome-dark=""
        {...props}
      >
        {panel}
      </Sidebar>
    )

  // From md up the panel sits inside the page sheet (Obvious-style), the
  // page beside it; the rail (AppRail) stays on the chrome. Collapsing
  // folds the panel away.
  return (
    <Sidebar inline className="on-chrome" {...props}>
      <SidebarRail />
      {panel}
    </Sidebar>
  )
}

/**
 * The slim column on the chrome, md up (Obvious-style): the studio's mark,
 * the workspaces (Kantor, Project), the theme at the bottom. Everything
 * else is in the panel inside the sheet.
 */
export function AppRail() {
  const desktop = useMacChrome()
  return (
    <SidebarCompact
      data-chrome-dark=""
      className={cn(
        "on-chrome hidden w-(--sidebar-width-icon) shrink-0 flex-col pb-1.5 md:flex",
        // pt-1: the toggle's 36px button centres on the tab row beside it
        // (44px: 4 + 18 = 22). In the Mac app, the top strip is above it.
        "pt-1",
      )}
    >
      {/* Where the mark was: the toggle, its 40px row centred on the tab
          row beside it (44px). The Mac app has its toggle by the traffic
          lights instead. */}
      {!desktop && (
        <div className="flex justify-center">
          <SidebarTrigger className="text-foreground/55 hover:bg-chrome-hover size-9 rounded-[8px] [&_svg]:size-4" />
        </div>
      )}
      {/* 12px under the toggle, the sidebar's block gap: the mark, then
          the workspaces, one column. */}
      <div className={desktop ? undefined : "mt-3"}>
        <WorkspaceRail />
      </div>
      <div className="flex-1" />
      {/* Theme and the chrome's color (light / dark / system, tint); its
          bottom on the sheet's. */}
      <div className="flex justify-center">
        <AppearancePopover className="blend-ink size-9 rounded-[8px]" />
      </div>
    </SidebarCompact>
  )
}

/**
 * The workspaces, alone on the rail: picking one shows its pages in the panel (opening the panel when it's
 * hidden); the one shown is filled. A dot when one has something new.
 */
function WorkspaceRail() {
  const { loading, visible, active, select, hasBadge } = useWorkspaceNav()
  const { open, setOpen } = useSidebar()
  const t = useT("nav")
  return (
    // ChatGPT's rail (measured): 36px buttons, 8px either side on the
    // 52px rail, 44px apart; 16px icons.
    <SidebarGroup className="py-0 group-data-[collapsible=icon]:px-2">
      <SidebarMenu className="gap-2">
        {!loading &&
          visible.length > 1 &&
          visible.map((ws) => {
            const shown = open && ws.id === active?.id
            return (
              <SidebarMenuItem key={ws.id}>
                <SidebarMenuButton
                  tooltip={t(ws.name)}
                  isActive={shown}
                  aria-pressed={shown}
                  // Square (a fixed 8px corner: the theme's radius can be a
                  // pill). As ChatGPT's rail: the rest the secondary ink of
                  // the bar's toggle (55%), the shown one a faint ink fill
                  // (6%) and its solid icon (activeIcon). 16px icons.
                  className="not-data-active:text-foreground/55 data-active:bg-foreground/6 data-active:text-foreground relative rounded-[8px] group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-2.5! [&_svg]:size-4"
                  // The one shown folds the panel away; another shows its
                  // pages (opening the panel when it's folded).
                  onClick={() => {
                    if (shown) return setOpen(false)
                    select(ws.id)
                    if (!open) setOpen(true)
                  }}
                >
                  {shown && ws.activeIcon ? <ws.activeIcon /> : <ws.icon />}
                  <span>{t(ws.name)}</span>
                  {!shown && hasBadge(ws) && (
                    <span
                      aria-hidden
                      className="bg-primary absolute top-1 right-1 size-1.5 rounded-full"
                    />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

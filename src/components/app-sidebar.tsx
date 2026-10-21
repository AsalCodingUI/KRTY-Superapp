"use client"

import * as React from "react"

import { siteConfig } from "@/app/siteConfig"
import { NavMain } from "@/components/nav-main"
import { BrandLogo } from "@/components/brand-logo"
import { NavProject } from "@/components/nav-project"
import { NavUser } from "@/components/nav-user"
import { ProjectAvatar } from "@/components/project-avatar"
import { useNavBadges } from "@/components/use-nav-badges"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar"
import { createClient } from "@/shared/api/supabase/client"
import { matchProjectPath } from "@/shared/config/project-sections"
import {
  matchesRoute,
  resolveActiveChild,
  resolveWorkspace,
  workspaces,
  type WorkspaceId,
  type WorkspaceItem,
  type WorkspaceProfile,
} from "@/shared/config/workspaces"
import { usePagePermissions } from "@/shared/hooks/usePagePermissions"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { isAdminRole } from "@/shared/lib/roles"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"

const ADMIN_CONTACT_LINK = "https://wa.me/6289525418707"

type PermissionMap = Record<string, boolean> | null

/** Same rule as middleware: the longest granted/denied slug prefix decides. */
function canOpen(href: string, permissions: PermissionMap) {
  if (href === "/notifications") return true
  if (!permissions) return false
  const slug = Object.keys(permissions)
    .filter((s) => matchesRoute(href, s))
    .sort((a, b) => b.length - a.length)[0]
  return slug ? permissions[slug] === true : false
}

type SidebarProject = { id: string; name: string; href: string }

/**
 * Active projects for the Project workspace: every active project for
 * stakeholders, the user's own assignments for everyone else.
 */
function useSidebarProjects(profile: { id: string; role: string } | null) {
  return useQuery<SidebarProject[]>({
    queryKey: ["sidebar-projects", profile?.id, profile?.role],
    enabled: Boolean(profile),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!profile) return []
      const supabase = createClient()
      if (isAdminRole(profile.role)) {
        const { data } = await supabase
          .from("projects")
          .select("id, name")
          .eq("status", "Active")
          .order("name")
        return ((data ?? []) as { id: string; name: string }[]).map((p) => ({
          ...p,
          href: `${siteConfig.baseLinks.projects}/${p.id}`,
        }))
      }
      const { data } = await supabase
        .from("project_assignments")
        .select("projects!inner(id, name, status)")
        .eq("user_id", profile.id)
        .eq("projects.status", "Active")
      type Row = { projects: { id: string; name: string } }
      return ((data ?? []) as unknown as Row[])
        .map((row) => row.projects)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({
          id: p.id,
          name: p.name,
          href: `${siteConfig.baseLinks.performance}/employee/${profile.id}/project/${p.id}`,
        }))
    },
  })
}

/** Deterministic tint per project so each one keeps its colour. */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const projectPath = matchProjectPath(pathname)
  const { profile, userEmail, loading: profileLoading } = useUserProfile()
  const { permissions, loading: permLoading } = usePagePermissions()
  const loading = profileLoading || permLoading

  const visible = React.useMemo(() => {
    if (!profile) return []
    const p = profile as WorkspaceProfile
    return workspaces
      .filter((ws) => !ws.can || ws.can(p))
      .map((ws) => ({
        ...ws,
        items: ws
          .items(p)
          .filter(
            (item: WorkspaceItem) =>
              (!item.can || item.can(p)) &&
              canOpen(item.href, permissions as PermissionMap),
          ),
      }))
      .filter((ws) => ws.items.length > 0)
  }, [profile, permissions])

  const routeWorkspace = resolveWorkspace(pathname, visible)
  // The rail can preview another workspace without navigating away.
  const [selected, setSelected] = React.useState<WorkspaceId | null>(null)
  React.useEffect(() => setSelected(null), [routeWorkspace])
  const activeId = selected ?? routeWorkspace
  const active = visible.find((ws) => ws.id === activeId) ?? visible[0]

  const { data: projects = [] } = useSidebarProjects(
    profile ? { id: profile.id, role: profile.role } : null,
  )

  const badges = useNavBadges(
    profile ? { id: profile.id, role: profile.role } : null,
  )
  /** Workspaces with something waiting get a dot on their rail icon. */
  const hasBadge = (ws: (typeof visible)[number]) =>
    ws.items.some(
      (item) =>
        (badges[item.href] ?? 0) > 0 ||
        (item.children ?? []).some((c) => (badges[c.href] ?? 0) > 0),
    )

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    // Full reload so no client state survives the sign-out.
    window.location.href = "/login"
  }

  // Longest matching href is the active page (so /projects/calculator does
  // not also light up /projects).
  const activeHref = active?.items
    .filter((item) => matchesRoute(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="overflow-hidden"
      {...props}
    >
      <SidebarRail />
      {/* Row wrapper: the mobile sheet stacks its children vertically. */}
      <div className="flex h-full w-full flex-row">
        {/* Rail: workspaces */}
        <Sidebar
          collapsible="none"
          className="border-sidebar-border w-[calc(var(--sidebar-width-icon)+1px)]! border-r bg-transparent group-data-[state=collapsed]:border-r-0"
        >
          <SidebarHeader className="h-12 items-center justify-center">
            <Link
              href={siteConfig.baseLinks.dashboard}
              prefetch={false}
              className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-md"
              aria-label={siteConfig.name}
            >
              <BrandLogo className="size-5" />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="items-center gap-1">
                  {loading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <SidebarMenuItem key={i}>
                          <div className="bg-sidebar-accent size-8 rounded-md" />
                        </SidebarMenuItem>
                      ))
                    : visible.map((ws) => (
                        <SidebarMenuItem key={ws.id}>
                          <SidebarMenuButton
                            tooltip={{ children: ws.name, hidden: false }}
                            isActive={ws.id === active?.id}
                            onClick={() => setSelected(ws.id)}
                            className="relative size-8! justify-center p-0!"
                          >
                            <ws.icon />
                            {ws.id !== active?.id && hasBadge(ws) && (
                              <span
                                aria-hidden
                                className="bg-primary absolute top-1 right-1 size-1.5 rounded-full"
                              />
                            )}
                            <span className="sr-only">{ws.name}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="items-center">
            <NavUser
              user={{
                name: profile?.full_name ?? "Loading…",
                email: profile?.email || userEmail || "",
              }}
              onSignOut={handleSignOut}
              contactHref={ADMIN_CONTACT_LINK}
            />
          </SidebarFooter>
        </Sidebar>

        {/* Sub sidebar: pages of the active workspace */}
        <Sidebar
          collapsible="none"
          className="w-auto min-w-0 flex-1 bg-transparent"
        >
          <SidebarHeader className="h-12 justify-center px-3.5">
            <span className="truncate text-sm font-medium">
              {active?.name ?? siteConfig.name}
            </span>
          </SidebarHeader>
          <SidebarContent>
            {loading ? (
              <SidebarMenu className="p-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : projectPath ? (
              <NavProject />
            ) : active ? (
              <NavMain
                items={active.items.map((item) => {
                  const children = (item.children ?? []).filter(
                    (c) => !c.can || c.can(profile as WorkspaceProfile),
                  )
                  const activeChild =
                    item.href === activeHref
                      ? resolveActiveChild(pathname, children)
                      : undefined
                  return {
                    title: item.name,
                    url: item.href,
                    icon: <item.icon />,
                    isActive: item.href === activeHref,
                    items: children.map((c) => ({
                      title: c.name,
                      url: c.href,
                      isActive: c.href === activeChild,
                      badge: badges[c.href],
                    })),
                  }
                })}
              />
            ) : null}

            {!projectPath &&
              active?.id === "project" &&
              projects.length > 0 && (
                <SidebarGroup>
                  <SidebarGroupLabel>Active projects</SidebarGroupLabel>
                  <SidebarMenu>
                    {projects.map((project) => (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton
                          isActive={matchesRoute(pathname, project.href)}
                          render={<Link href={project.href} prefetch={false} />}
                        >
                          <ProjectAvatar
                            id={project.id}
                            name={project.name}
                            className="size-4 rounded-[4px]"
                          />
                          <span className="truncate">{project.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              )}
          </SidebarContent>
        </Sidebar>
      </div>
    </Sidebar>
  )
}

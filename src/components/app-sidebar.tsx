"use client"

import { ThemeSwitcher } from "@/components/theme-switcher"
import * as React from "react"

import { siteConfig } from "@/app/siteConfig"
import { NavMain } from "@/components/nav-main"
import { NavProject } from "@/components/nav-project"
import { PrefetchLink } from "@/components/prefetch-link"
import { ProjectAvatar } from "@/components/project-avatar"
import { useWorkspaceNav } from "@/components/workspace-nav"
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
} from "@/components/ui/sidebar"
import { createClient } from "@/shared/api/supabase/client"
import { matchProjectPath } from "@/shared/config/project-sections"
import {
  matchesRoute,
  resolveActiveChild,
  type WorkspaceProfile,
} from "@/shared/config/workspaces"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { isAdminRole } from "@/shared/lib/roles"
import { useQuery } from "@tanstack/react-query"
import { usePathname } from "next/navigation"

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const projectPath = matchProjectPath(pathname)
  const { profile } = useUserProfile()
  const { loading, active, badges } = useWorkspaceNav()

  const { data: projects = [] } = useSidebarProjects(
    profile ? { id: profile.id, role: profile.role } : null,
  )

  // Longest matching href is the active page (so /projects/calculator does
  // not also light up /projects).
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
      }),
    [active, activeHref, badges, pathname, profile],
  )

  return (
    <Sidebar
      collapsible="icon"
      // Rounded top-left so the page reads as a sheet under the dark top bar.
      className="overflow-hidden md:rounded-tl-2xl"
      {...props}
    >
      <SidebarRail />
      <SidebarContent className="pt-0.5">
        {loading ? (
          <SidebarMenu>
            {Array.from({ length: 5 }).map((_, i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuSkeleton showIcon />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        ) : projectPath ? (
          <NavProject />
        ) : active ? (
          <NavMain items={navItems ?? []} />
        ) : null}

        {!projectPath && active?.id === "project" && projects.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Active projects</SidebarGroupLabel>
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
      {/* Theme lives here now; there is no settings page. */}
      <SidebarFooter>
        {/* Stacks vertically when the sidebar is collapsed to icons. */}
        <ThemeSwitcher className="group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:self-center" />
      </SidebarFooter>
    </Sidebar>
  )
}

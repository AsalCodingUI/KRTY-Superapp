"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar"
import { siteConfig } from "@/app/siteConfig"
import { navigationConfig } from "@/shared/config/navigation"
import { usePagePermissions } from "@/shared/hooks/usePagePermissions"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { hasRoleAccess } from "@/shared/lib/roles"
import { Notifications } from "@/widgets/notifications/ui/Notifications"
import { ChevronsUpDown } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DropdownUserProfile } from "./DropdownUserProfile"

function initialsOf(name?: string | null) {
  if (!name) return "KR"
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function AppSidebar() {
  const pathname = usePathname()
  const { profile, loading: profileLoading } = useUserProfile()
  const { hasPermission, loading: permLoading } = usePagePermissions()
  const loading = profileLoading || permLoading

  const isActive = (href: string) =>
    href === siteConfig.baseLinks.settings.general
      ? pathname.startsWith("/settings")
      : pathname === href || pathname.startsWith(href)

  const mainItems =
    !loading && profile
      ? navigationConfig.main.filter((item) => hasPermission(item.href, false) === true)
      : []

  const footerItems =
    !loading && profile
      ? navigationConfig.footer.filter(
          (item) =>
            hasRoleAccess(item.roles, profile.role, { allowUnknown: true }) &&
            hasPermission(item.href, false) === true,
        )
      : []

  return (
    <Sidebar variant="inset" collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-1">
          <div className="flex h-8 min-w-0 flex-1 items-center gap-2 pl-1.5 pr-2">
            <span
              aria-hidden="true"
              className="bg-foreground text-background flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold"
            >
              K
            </span>
            <span className="text-body text-foreground font-wght-emphasis min-w-0 truncate">
              {siteConfig.name}
            </span>
          </div>
          <Notifications variant="icon" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Primary">
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <SidebarMenuItem key={i}>
                      <SidebarMenuSkeleton showIcon />
                    </SidebarMenuItem>
                  ))
                : mainItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        isActive={isActive(item.href)}
                        render={<Link href={item.href} prefetch={false} />}
                      >
                        <item.icon aria-hidden="true" />
                        <span>{item.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
            </SidebarMenu>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                isActive={isActive(item.href)}
                render={<Link href={item.href} prefetch={false} />}
              >
                <item.icon aria-hidden="true" />
                <span>{item.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarMenu aria-label="User">
          <SidebarMenuItem>
            <DropdownUserProfile>
              <SidebarMenuButton aria-label="Open user menu">
                <span
                  aria-hidden="true"
                  className="bg-foreground/5 text-muted-foreground -mx-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] dark:bg-white/10"
                >
                  {initialsOf(profile?.full_name)}
                </span>
                <span className="text-body text-foreground truncate">
                  {profile?.full_name ?? "Loading…"}
                </span>
                <ChevronsUpDown className="text-muted-foreground ml-auto" aria-hidden="true" />
              </SidebarMenuButton>
            </DropdownUserProfile>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

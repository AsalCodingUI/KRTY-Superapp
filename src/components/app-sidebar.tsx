"use client"

import * as React from "react"

import { siteConfig } from "@/app/siteConfig"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import { createClient } from "@/shared/api/supabase/client"
import { navigationConfig } from "@/shared/config/navigation"
import { usePagePermissions } from "@/shared/hooks/usePagePermissions"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { hasRoleAccess } from "@/shared/lib/roles"
import Link from "next/link"
import { usePathname } from "next/navigation"

const ADMIN_CONTACT_LINK = "https://wa.me/6289525418707"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { profile, userEmail, loading: profileLoading } = useUserProfile()
  const { hasPermission, loading: permLoading } = usePagePermissions()
  const loading = profileLoading || permLoading

  const isActive = (href: string) =>
    href === siteConfig.baseLinks.settings.general
      ? pathname.startsWith("/settings")
      : pathname === href || pathname.startsWith(`${href}/`)

  const navMain =
    !loading && profile
      ? navigationConfig.main
          .filter((item) => hasPermission(item.href, false) === true)
          .map((item) => ({
            title: item.name,
            url: item.href,
            icon: <item.icon />,
            isActive: isActive(item.href),
          }))
      : []

  const navSecondary =
    !loading && profile
      ? navigationConfig.footer
          .filter(
            (item) =>
              hasRoleAccess(item.roles, profile.role, { allowUnknown: true }) &&
              hasPermission(item.href, false) === true,
          )
          .map((item) => ({
            title: item.name,
            url: item.href,
            icon: <item.icon />,
            isActive: isActive(item.href),
          }))
      : []

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    // Full reload so no client state survives the sign-out.
    window.location.href = "/login"
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={siteConfig.baseLinks.dashboard} prefetch={false} />}
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-semibold">
                K
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{siteConfig.name}</span>
                <span className="truncate text-xs capitalize">
                  {profile?.role ?? "Workspace"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {loading ? (
          <SidebarMenu className="p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuSkeleton showIcon />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        ) : (
          <NavMain label="Workspace" items={navMain} />
        )}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
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
  )
}

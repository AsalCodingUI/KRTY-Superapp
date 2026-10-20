"use client"

import * as React from "react"

import { siteConfig } from "@/app/siteConfig"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import { createClient } from "@/shared/api/supabase/client"
import { navigationConfig } from "@/shared/config/navigation"
import { usePagePermissions } from "@/shared/hooks/usePagePermissions"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { hasRoleAccess } from "@/shared/lib/roles"
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
        <NavUser
          user={{
            name: profile?.full_name ?? "Loading…",
            email: profile?.email || userEmail || "",
          }}
          onSignOut={handleSignOut}
          contactHref={ADMIN_CONTACT_LINK}
        />
      </SidebarHeader>
      <SidebarContent>
        {loading ? (
          <SidebarMenu className="p-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuSkeleton showIcon />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        ) : (
          <NavMain items={navMain} />
        )}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}

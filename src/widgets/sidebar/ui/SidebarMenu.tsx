"use client"

import { navigationConfig } from "@/shared/config/navigation"
import { usePagePermissions } from "@/shared/hooks/usePagePermissions"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import {
  canAccessProjectCalculator,
  canAccessSLAGenerator,
  hasRoleAccess,
} from "@/shared/lib/roles"
import { cx, focusRing } from "@/shared/lib/utils"
import { Skeleton } from "@/shared/ui"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function SidebarMenu() {
  const pathname = usePathname()
  const { profile, loading: profileLoading } = useUserProfile()
  const { hasPermission, loading: permLoading } = usePagePermissions(
    profile?.role,
  )

  const loading = profileLoading || permLoading

  const isActive = (itemHref: string) => {
    return pathname === itemHref || pathname.startsWith(itemHref)
  }

  const navItems = navigationConfig.main.filter((item) => {
    if (loading || !profile) return false

    // Fallback to existing role-based logic
    const slug = item.href
    let roleFallback = hasRoleAccess(item.roles, profile.role)

    if (item.name === "Project Calculator") {
      roleFallback = canAccessProjectCalculator(profile)
    }
    if (item.name === "SLA Generator") {
      roleFallback = canAccessSLAGenerator(profile)
    }
    if (item.name === "Message") {
      roleFallback =
        hasRoleAccess(item.roles, profile.role) ||
        profile.job_title === "Project Manager"
    }

    return hasPermission(slug, roleFallback) ?? roleFallback
  })

  // Skeleton loading
  if (loading) {
    return (
      <div className="flex flex-col gap-1 p-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-1 flex-col gap-1 p-2"
    >
      <ul role="list" className="space-y-1">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              prefetch
              className={cx(
                "text-label-sm flex items-center gap-2 rounded-md px-2 py-1 transition-colors duration-200",
                isActive(item.href)
                  ? "bg-surface-neutral-secondary text-content"
                  : "text-content-subtle hover:bg-surface-neutral-secondary/50 hover:text-content",
                focusRing,
              )}
            >
              <item.icon
                className={cx(
                  "size-4 shrink-0",
                  isActive(item.href) ? "text-content" : "text-content-subtle",
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

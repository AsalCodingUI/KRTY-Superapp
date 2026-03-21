"use client"

import { siteConfig } from "@/app/siteConfig"
import { navigationConfig } from "@/shared/config/navigation"
import { usePagePermissions } from "@/shared/hooks/usePagePermissions"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import {
  canAccessProjectCalculator,
  canAccessSLAGenerator,
  hasRoleAccess,
} from "@/shared/lib/roles"
import { cx } from "@/shared/lib/utils"
import {
  RiBarChartBoxLine,
  RiCalendarCheckLine,
  RiCalendarLine,
  RiHome2Line,
  RiSettings5Line,
} from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ComponentType, useMemo } from "react"

type MobileAppTab = {
  label: string
  href: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}

const APP_TABS: MobileAppTab[] = [
  {
    label: "Home",
    href: siteConfig.baseLinks.dashboard,
    icon: RiHome2Line,
  },
  {
    label: "Leave",
    href: siteConfig.baseLinks.leave,
    icon: RiCalendarCheckLine,
  },
  {
    label: "Performance",
    href: siteConfig.baseLinks.performance,
    icon: RiBarChartBoxLine,
  },
  {
    label: "Calendar",
    href: siteConfig.baseLinks.calendar,
    icon: RiCalendarLine,
  },
  {
    label: "Settings",
    href: siteConfig.baseLinks.settings.general,
    icon: RiSettings5Line,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { profile, loading } = useUserProfile()
  const { hasPermission, loading: permissionLoading } = usePagePermissions()

  const navItems = useMemo(
    () =>
      navigationConfig.main.filter((item) => {
        if (loading || permissionLoading || !profile) return false
        if (item.name === "Project Calculator") {
          return (
            canAccessProjectCalculator(profile) &&
            hasPermission(item.href, false) === true
          )
        }
        if (item.name === "SLA Generator") {
          return (
            canAccessSLAGenerator(profile) &&
            hasPermission(item.href, false) === true
          )
        }
        return (
          hasRoleAccess(item.roles, profile.role) &&
          hasPermission(item.href, false) === true
        )
      }),
    [loading, permissionLoading, profile, hasPermission],
  )

  const allowedHrefSet = new Set([
    ...navItems.map((item) => item.href),
    siteConfig.baseLinks.settings.general,
  ])
  const appTabs = APP_TABS.filter((tab) => allowedHrefSet.has(tab.href))

  const isActive = (itemHref: string) => {
    return pathname === itemHref || pathname.startsWith(itemHref)
  }

  if (loading || permissionLoading || !profile || appTabs.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="border-neutral-primary bg-surface-neutral-primary fixed right-0 bottom-0 left-0 z-40 border-t xl:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 px-2 pt-1.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {appTabs.map((tab) => {
          const active = isActive(tab.href)

          return (
            <Link
              key={tab.label}
              href={tab.href}
              prefetch
              className={cx(
                "flex min-h-14 items-center justify-center rounded-md px-1 py-1.5 transition-colors",
                active
                  ? "text-foreground-primary"
                  : "text-foreground-tertiary hover:text-foreground-secondary",
              )}
            >
              <tab.icon className="size-6 shrink-0" aria-hidden="true" />
              <span className="sr-only">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

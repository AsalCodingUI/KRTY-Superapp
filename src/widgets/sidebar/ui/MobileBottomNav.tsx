"use client"

import { siteConfig } from "@/app/siteConfig"
import { useNotifications } from "@/shared/hooks/useNotifications"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { cx } from "@/shared/lib/utils"
import {
  RiBarChartBoxLine,
  RiCalendarCheckLine,
  RiCalendarLine,
  RiHome2Line,
  RiNotification3Line,
  RiSettings5Line,
} from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { startTransition, type ComponentType, useMemo } from "react"

type MobileAppTab = {
  label: string
  href: string
  icon: ComponentType<{
    className?: string
    "aria-hidden"?: boolean | "true" | "false"
  }>
  isNotifications?: boolean
}

const EMPLOYEE_TABS: MobileAppTab[] = [
  {
    label: "Home",
    href: siteConfig.baseLinks.dashboard,
    icon: RiHome2Line,
  },
  {
    label: "Cuti",
    href: siteConfig.baseLinks.leave,
    icon: RiCalendarCheckLine,
  },
  {
    label: "Notif",
    href: "/notifications",
    icon: RiNotification3Line,
    isNotifications: true,
  },
  {
    label: "Kalender",
    href: siteConfig.baseLinks.calendar,
    icon: RiCalendarLine,
  },
]

const STAKEHOLDER_TABS: MobileAppTab[] = [
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
    label: "Notif",
    href: "/notifications",
    icon: RiNotification3Line,
    isNotifications: true,
  },
  {
    label: "Settings",
    href: siteConfig.baseLinks.settings.general,
    icon: RiSettings5Line,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, loading } = useUserProfile()
  const { unreadCount } = useNotifications()

  const appTabs = useMemo(() => {
    if (loading || !profile) return []
    return profile.role === "stakeholder" ? STAKEHOLDER_TABS : EMPLOYEE_TABS
  }, [loading, profile])

  const isActive = (href: string) => {
    if (href === siteConfig.baseLinks.settings.general) {
      return pathname.startsWith("/settings")
    }
    return pathname === href || pathname.startsWith(href)
  }

  if (loading || !profile || appTabs.length === 0) return null

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="border-neutral-primary bg-surface fixed right-0 bottom-0 left-0 z-[55] border-t xl:hidden"
    >
      <div
        className="mx-auto grid max-w-lg px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
        style={{
          gridTemplateColumns: `repeat(${appTabs.length}, minmax(0, 1fr))`,
        }}
      >
        {appTabs.map((tab) => {
          const active = isActive(tab.href)

          return (
            <Link
              key={tab.label}
              href={tab.href}
              prefetch
              onClick={(event) => {
                if (active) return
                event.preventDefault()
                startTransition(() => {
                  router.push(tab.href)
                })
              }}
              className={cx(
                "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1 text-center transition-colors",
                active
                  ? "text-foreground-primary"
                  : "text-foreground-tertiary hover:text-foreground-secondary",
              )}
            >
              <span className="relative">
                <tab.icon className="size-6 shrink-0" aria-hidden="true" />
                {tab.isNotifications && unreadCount > 0 && (
                  <span className="bg-foreground-danger-dark absolute -top-0.5 -right-1 size-2 rounded-full" />
                )}
              </span>
              <span className="mt-0.5 text-[10px] leading-tight">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

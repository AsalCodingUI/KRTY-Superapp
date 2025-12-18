"use client"

import { siteConfig } from "@/app/siteConfig"
import { useUserProfile } from "@/hooks/useUserProfile"
import { cx, focusRing } from "@/lib/utils"
import {
  RiBarChartBoxLine, // Import Icon Baru
  RiCalculatorLine,
  RiCalendarCheckLine,
  RiFundsBoxLine,
  RiGroupLine,
  RiHome2Line,
  RiSettings5Line,
  RiUserAddLine,
  RiUserSmileLine
} from "@remixicon/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import MobileSidebar from "./MobileSidebar"
import { Notifications } from "./Notifications"
import { WorkspacesDropdownDesktop } from "./SidebarWorkspacesDropdown"
import { UserProfileDesktop, UserProfileMobile } from "./UserProfile"

// 1. DEFINISI MENU UTAMA
const allNavigation = [
  {
    name: "Dashboard",
    href: siteConfig.baseLinks.dashboard,
    icon: RiHome2Line,
    roles: ["stakeholder", "employee"]
  },
  {
    name: "Attendance",
    href: siteConfig.baseLinks.attendance,
    icon: RiCalendarCheckLine,
    roles: ["stakeholder", "employee"]
  },
  {
    name: "Leave & Permission",
    href: siteConfig.baseLinks.leave,
    icon: RiUserSmileLine,
    roles: ["stakeholder", "employee"]
  },
  {
    name: "Performance", // MENU BARU
    href: siteConfig.baseLinks.performance,
    icon: RiBarChartBoxLine,
    roles: ["stakeholder", "employee"]
  },
  {
    name: "Project Calculator",
    href: siteConfig.baseLinks.calculator,
    icon: RiCalculatorLine,
    roles: ["stakeholder", "employee"]
  },
  {
    name: "Payroll",
    href: siteConfig.baseLinks.payroll,
    icon: RiFundsBoxLine,
    roles: ["stakeholder"]
  },
  {
    name: "Teams",
    href: siteConfig.baseLinks.teams,
    icon: RiGroupLine,
    roles: ["stakeholder"]
  },
  {
    name: "Settings",
    href: siteConfig.baseLinks.settings.general,
    icon: RiSettings5Line,
    roles: ["stakeholder", "employee"]
  },
] as const

// 2. DEFINISI SHORTCUTS
const shortcuts = [
  {
    name: "Change Team Permission",
    href: siteConfig.baseLinks.settings.permission,
    icon: RiUserAddLine,
    roles: ["stakeholder"]
  },
  {
    name: "Manage Teams",
    href: siteConfig.baseLinks.teams,
    icon: RiGroupLine,
    roles: ["stakeholder"]
  },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const { profile, loading } = useUserProfile()

  const isActive = (itemHref: string) => {
    if (itemHref === siteConfig.baseLinks.settings.general) {
      return pathname.startsWith("/settings")
    }
    return pathname === itemHref || pathname.startsWith(itemHref)
  }

  const navItems = allNavigation.filter((item) => {
    if (loading || !profile) return false
    const hasRoleAccess = (item.roles as readonly string[]).includes(profile.role)
    if (item.name === "Project Calculator") {
      return profile.role === "stakeholder" || profile.job_title === "Project Manager"
    }
    return hasRoleAccess
  })

  const shortcutItems = shortcuts.filter((item) => {
    if (loading || !profile) return false
    return (item.roles as readonly string[]).includes(profile.role)
  })

  return (
    <>
      {/* --- 1. DESKTOP SIDEBAR --- */}
      <nav className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <aside className="flex grow flex-col gap-y-6 overflow-y-auto bg-background p-4">
          <WorkspacesDropdownDesktop />

          <nav aria-label="core navigation links" className="flex flex-1 flex-col space-y-10">
            <ul role="list" className="space-y-0.5">
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-9 bg-muted rounded-md dark:bg-surface" />
                  ))}
                </div>
              ) : (
                navItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cx(
                        isActive(item.href)
                          ? "bg-muted text-content font-semibold dark:bg-muted"
                          : "text-content-subtle hover:text-content hover:bg-muted",
                        "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition",
                        focusRing,
                      )}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                ))
              )}
              {!loading && (
                <li>
                  <Notifications />
                </li>
              )}
            </ul>

            {!loading && shortcutItems.length > 0 && (
              <div className="mt-8">
                <span className="text-xs font-medium leading-6 text-content-subtle">
                  Shortcuts
                </span>
                <ul role="list" className="mt-2 space-y-0.5">
                  {shortcutItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cx(
                          isActive(item.href)
                            ? "bg-muted text-content font-semibold dark:bg-muted"
                            : "text-content-subtle hover:text-content hover:bg-muted",
                          "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition",
                          focusRing,
                        )}
                      >
                        <item.icon className="size-4 shrink-0 text-content-placeholder" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>

          <div className="mt-auto">
            <UserProfileDesktop />
          </div>
        </aside>
      </nav>

      {/* --- 2. MOBILE TOP BAR --- */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:gap-x-6 sm:px-6 lg:hidden">
        <div className="flex items-center gap-2 font-medium text-content dark:text-content">
          <span className="flex aspect-square size-8 items-center justify-center rounded bg-primary p-2 text-xs font-medium text-white dark:bg-primary">
            KS
          </span>
          <span>Kretya Studio</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <UserProfileMobile />
          <MobileSidebar />
        </div>
      </div>
    </>
  )
}
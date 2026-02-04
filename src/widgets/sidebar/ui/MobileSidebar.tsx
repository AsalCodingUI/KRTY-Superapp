"use client"

import { siteConfig } from "@/app/siteConfig"
import { Button } from "@/shared/ui"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { cx, focusRing } from "@/shared/lib/utils"
import {
  RiBarChartBoxLine, // Import Icon
  RiCalculatorLine,
  RiCalendarCheckLine,
  RiFundsBoxLine,
  RiGroupLine,
  RiHome2Line,
  RiMenuLine,
  RiSettings5Line,
  RiUserAddLine,
  RiUserSmileLine,
} from "@remixicon/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Notifications } from "@/widgets/notifications/ui/Notifications"

// 1. DEFINISI MENU
const allNavigation = [
  {
    name: "Dashboard",
    href: siteConfig.baseLinks.dashboard,
    icon: RiHome2Line,
    roles: ["stakeholder", "employee"],
  },
  {
    name: "Attendance",
    href: siteConfig.baseLinks.attendance,
    icon: RiCalendarCheckLine,
    roles: ["stakeholder", "employee"],
  },
  {
    name: "Leave & Permission",
    href: siteConfig.baseLinks.leave,
    icon: RiUserSmileLine,
    roles: ["stakeholder", "employee"],
  },
  {
    name: "Performance", // MENU BARU
    href: siteConfig.baseLinks.performance,
    icon: RiBarChartBoxLine,
    roles: ["stakeholder", "employee"],
  },
  {
    name: "Project Calculator",
    href: siteConfig.baseLinks.calculator,
    icon: RiCalculatorLine,
    roles: ["stakeholder", "employee"],
  },
  {
    name: "Payroll",
    href: siteConfig.baseLinks.payroll,
    icon: RiFundsBoxLine,
    roles: ["stakeholder"],
  },
  {
    name: "Teams",
    href: siteConfig.baseLinks.teams,
    icon: RiGroupLine,
    roles: ["stakeholder"],
  },
  {
    name: "Settings",
    href: siteConfig.baseLinks.settings.general,
    icon: RiSettings5Line,
    roles: ["stakeholder", "employee"],
  },
] as const

// 2. DEFINISI SHORTCUTS
const shortcuts = [
  {
    name: "Change Team Permission",
    href: siteConfig.baseLinks.settings.permission,
    icon: RiUserAddLine,
    roles: ["stakeholder"],
  },
  {
    name: "Manage Teams",
    href: siteConfig.baseLinks.teams,
    icon: RiGroupLine,
    roles: ["stakeholder"],
  },
] as const

export default function MobileSidebar() {
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
    const hasRoleAccess = (item.roles as readonly string[]).includes(
      profile.role,
    )
    if (item.name === "Project Calculator") {
      return (
        profile.role === "stakeholder" ||
        profile.job_title === "Project Manager"
      )
    }
    return hasRoleAccess
  })

  const shortcutItems = shortcuts.filter((item) => {
    if (loading || !profile) return false
    return (item.roles as readonly string[]).includes(profile.role)
  })

  return (
    <>
      <Drawer>
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            aria-label="open sidebar"
            className="group hover:bg-muted data-[state=open]:bg-muted dark:hover:bg-muted flex items-center rounded-md p-2 text-sm font-medium"
          >
            <RiMenuLine
              className="size-6 shrink-0 sm:size-5"
              aria-hidden="true"
            />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="sm:max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Kretya Studio</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <nav
              aria-label="core mobile navigation links"
              className="flex flex-1 flex-col space-y-10"
            >
              <ul role="list" className="space-y-1.5">
                {loading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-muted dark:bg-surface h-10 rounded-md"
                      />
                    ))}
                  </div>
                ) : (
                  navItems.map((item) => (
                    <li key={item.name}>
                      <DrawerClose asChild>
                        <Link
                          href={item.href}
                          className={cx(
                            isActive(item.href)
                              ? "bg-muted text-content dark:bg-muted font-semibold"
                              : "text-content-subtle hover:text-content hover:bg-muted",
                            "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 text-base font-medium transition sm:text-sm",
                            focusRing,
                          )}
                        >
                          <item.icon
                            className="size-5 shrink-0"
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </DrawerClose>
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
                <div>
                  <span className="text-content-subtle text-sm leading-6 font-medium sm:text-xs">
                    Shortcuts
                  </span>
                  <ul
                    aria-label="shortcuts"
                    role="list"
                    className="mt-2 space-y-0.5"
                  >
                    {shortcutItems.map((item) => (
                      <li key={item.name}>
                        <DrawerClose asChild>
                          <Link
                            href={item.href}
                            className={cx(
                              isActive(item.href)
                                ? "bg-muted text-content dark:bg-muted font-semibold"
                                : "text-content-subtle hover:text-content hover:bg-muted",
                              "flex items-center gap-x-2.5 rounded-md px-2 py-1.5 font-medium transition sm:text-sm",
                              focusRing,
                            )}
                          >
                            <item.icon
                              className="size-4 shrink-0"
                              aria-hidden="true"
                            />
                            {item.name}
                          </Link>
                        </DrawerClose>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </nav>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

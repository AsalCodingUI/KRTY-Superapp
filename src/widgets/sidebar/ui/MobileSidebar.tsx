"use client"

import { siteConfig } from "@/app/siteConfig"
import { navigationConfig } from "@/shared/config/navigation"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { cx, focusRing } from "@/shared/lib/utils"
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui"
import { Notifications } from "@/widgets/notifications/ui/Notifications"
import { RiMenuLine } from "@remixicon/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function MobileSidebar() {
  const pathname = usePathname()
  const { profile, loading } = useUserProfile()

  const isActive = (itemHref: string) => {
    if (itemHref === siteConfig.baseLinks.settings.general) {
      return pathname.startsWith("/settings")
    }
    return pathname === itemHref || pathname.startsWith(itemHref)
  }

  const navItems = navigationConfig.main.filter((item) => {
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

  const shortcutItems = navigationConfig.shortcuts.filter((item) => {
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
            className="group hover:bg-muted data-[state=open]:bg-muted dark:hover:bg-muted text-label-md flex items-center rounded-md p-2"
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
                            "text-label-lg sm:text-label-md flex items-center gap-x-2.5 rounded-md px-2 py-1.5 transition",
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
                  <span className="text-content-subtle text-label-md sm:text-label-xs">
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
                              "sm:text-label-md flex items-center gap-x-2.5 rounded-md px-2 py-1.5 transition",
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

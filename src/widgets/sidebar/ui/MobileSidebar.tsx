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
import { RiMenuLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { type ReactNode, useEffect, useMemo } from "react"

interface MobileSidebarProps {
  children?: ReactNode
}

const MOBILE_BOTTOM_NAV_HREFS = new Set([
  siteConfig.baseLinks.dashboard,
  siteConfig.baseLinks.leave,
  siteConfig.baseLinks.performance,
  siteConfig.baseLinks.calendar,
  siteConfig.baseLinks.settings.general,
])

export default function MobileSidebar({ children }: MobileSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, loading } = useUserProfile()
  const { hasPermission, loading: permissionLoading } = usePagePermissions()

  const isActive = (itemHref: string) => {
    if (itemHref === siteConfig.baseLinks.settings.general) {
      return pathname.startsWith("/settings")
    }
    return pathname === itemHref || pathname.startsWith(itemHref)
  }

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
        if (item.name === "Message") {
          return (
            (hasRoleAccess(item.roles, profile.role) ||
              profile.job_title === "Project Manager") &&
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

  const drawerNavItems = useMemo(
    () => navItems.filter((item) => !MOBILE_BOTTOM_NAV_HREFS.has(item.href)),
    [navItems],
  )

  const shortcutItems = useMemo(
    () =>
      navigationConfig.shortcuts.filter((item) => {
        if (loading || permissionLoading || !profile) return false
        return (
          hasRoleAccess(item.roles, profile.role) &&
          hasPermission(item.href, false) === true
        )
      }),
    [loading, permissionLoading, profile, hasPermission],
  )

  useEffect(() => {
    if (loading || !profile) return
    const allItems = [...drawerNavItems, ...shortcutItems]
    for (const item of allItems) {
      if (item.href.startsWith("/")) {
        router.prefetch(item.href)
      }
    }
  }, [loading, profile, drawerNavItems, shortcutItems, router])

  return (
    <>
      <Drawer>
        <DrawerTrigger asChild>
          {children ?? (
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
          )}
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
                {loading || permissionLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-muted dark:bg-surface h-10 rounded-md"
                      />
                    ))}
                  </div>
                ) : (
                  drawerNavItems.map((item) => (
                    <li key={item.name}>
                      <DrawerClose asChild>
                        <Link
                          href={item.href}
                          prefetch
                          onMouseEnter={() => {
                            if (item.href.startsWith("/")) {
                              router.prefetch(item.href)
                            }
                          }}
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
                {!loading &&
                  !permissionLoading &&
                  drawerNavItems.length === 0 &&
                  shortcutItems.length === 0 && (
                    <li className="text-body-sm text-foreground-tertiary px-2 py-2">
                      All main navigation is available from the bottom bar.
                    </li>
                  )}
              </ul>

              {!loading && !permissionLoading && shortcutItems.length > 0 && (
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
                            prefetch
                            onMouseEnter={() => {
                              if (item.href.startsWith("/")) {
                                router.prefetch(item.href)
                              }
                            }}
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

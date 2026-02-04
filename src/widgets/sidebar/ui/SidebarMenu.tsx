"use client"

import { navigationConfig } from "@/shared/config/navigation"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { cx, focusRing } from "@/shared/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function SidebarMenu() {
  const pathname = usePathname()
  const { profile, loading } = useUserProfile()

  const isActive = (itemHref: string) => {
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

  // Skeleton loading
  if (loading) {
    return (
      <div className="flex flex-col gap-1 p-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-muted h-8 w-full animate-pulse rounded-md"
          />
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
                  "size-4 shrink-0", // 16px icons typically for 13px text, or size-5 (20px)? Figma check: Icon frame 16px? Step 770 says "size-[16px]". So size-4 is correct.
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

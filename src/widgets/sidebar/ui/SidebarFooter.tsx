"use client"

import { siteConfig } from "@/app/siteConfig"
import { navigationConfig } from "@/shared/config/navigation"
import { cx, focusRing } from "@/shared/lib/utils"
// removed unused icons import
import Link from "next/link"
import { usePathname } from "next/navigation"

export function SidebarFooter() {
  const pathname = usePathname()

  const isActive = (itemHref: string) => {
    if (itemHref === siteConfig.baseLinks.settings.general) {
      return pathname.startsWith("/settings")
    }
    return pathname === itemHref
  }

  const footerItems = navigationConfig.footer

  return (
    <div className="flex flex-col gap-1 p-2">
      <ul role="list" className="space-y-1">
        {footerItems.map((item) => (
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
    </div>
  )
}

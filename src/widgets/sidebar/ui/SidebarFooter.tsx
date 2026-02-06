"use client"

import { siteConfig } from "@/app/siteConfig"
import { createClient } from "@/shared/api/supabase/client"
import { navigationConfig } from "@/shared/config/navigation"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { hasRoleAccess } from "@/shared/lib/roles"
import { cx, focusRing } from "@/shared/lib/utils"
import { RiLogoutBoxLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function SidebarFooter() {
  const pathname = usePathname()
  const { profile } = useUserProfile()
  const supabase = createClient()

  const isActive = (itemHref: string) => {
    if (itemHref === siteConfig.baseLinks.settings.general) {
      return pathname.startsWith("/settings")
    }
    return pathname === itemHref
  }

  const footerItems = profile
    ? navigationConfig.footer.filter((item) =>
        hasRoleAccess(item.roles, profile.role, { allowUnknown: true }),
      )
    : navigationConfig.footer

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

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

      <button
        type="button"
        onClick={handleSignOut}
        className={cx(
          "text-label-sm flex items-center gap-2 rounded-md px-2 py-1 transition-colors duration-200 text-content-subtle hover:bg-surface-neutral-secondary/50 hover:text-content",
          focusRing,
        )}
      >
        <RiLogoutBoxLine
          className="size-4 shrink-0 text-content-subtle"
          aria-hidden="true"
        />
        Logout
      </button>
    </div>
  )
}

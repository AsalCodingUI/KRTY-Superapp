"use client"

import { siteConfig } from "@/app/siteConfig"
import { MobileBottomNav } from "./MobileBottomNav"
import MobileSidebar from "./MobileSidebar"
import { AppSidebar } from "./AppSidebar"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { RiMenuLine } from "@/shared/ui/lucide-icons"
import { UserProfileMobile } from "./UserProfile"

export function Sidebar() {
  const { profile } = useUserProfile()
  const showMobileMenu = profile?.role === "stakeholder"

  return (
    <>
      <AppSidebar />

      <div className="bg-canvas fixed top-0 right-0 left-0 z-40 flex h-[calc(env(safe-area-inset-top)+3.25rem)] items-end justify-between border-b px-4 pb-2 md:hidden">
        <span className="text-label-md text-foreground font-semibold">
          {siteConfig.name}
        </span>
        <div className="flex items-center gap-1">
          <UserProfileMobile />
          {showMobileMenu && (
            <MobileSidebar>
              <button
                type="button"
                aria-label="Open menu"
                className="text-muted-foreground hover:bg-muted flex size-8 items-center justify-center rounded-full transition-colors"
              >
                <RiMenuLine className="size-5" aria-hidden="true" />
              </button>
            </MobileSidebar>
          )}
        </div>
      </div>

      <MobileBottomNav />
    </>
  )
}

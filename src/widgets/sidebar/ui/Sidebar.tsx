"use client"

import { siteConfig } from "@/app/siteConfig"
import { MobileBottomNav } from "./MobileBottomNav"
import MobileSidebar from "./MobileSidebar"
import { SidebarFooter } from "./SidebarFooter"
import { SidebarHeader } from "./SidebarHeader"
import { SidebarMenu } from "./SidebarMenu"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { RiMenuLine } from "@/shared/ui/lucide-icons"
import { UserProfileMobile } from "./UserProfile"

export function Sidebar() {
  const { profile } = useUserProfile()
  const showMobileMenu = profile?.role === "stakeholder"

  return (
    <>
      <nav className="border-border bg-background hidden border-r xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:w-64 xl:flex-col">
        <aside className="flex grow flex-col overflow-y-auto">
          <div>
            <SidebarHeader />
          </div>
          <div className="flex-1">
            <SidebarMenu />
          </div>
          <div className="mt-auto" />
          <SidebarFooter />
        </aside>
      </nav>

      <div className="border-neutral-primary bg-surface fixed top-0 right-0 left-0 z-40 flex h-[calc(env(safe-area-inset-top)+3.25rem)] items-end justify-between border-b px-4 pb-2 xl:hidden">
        <span className="text-label-md text-foreground-primary font-semibold">
          {siteConfig.name}
        </span>
        <div className="flex items-center gap-1">
          <UserProfileMobile />
          {showMobileMenu && (
            <MobileSidebar>
              <button
                type="button"
                aria-label="Open menu"
                className="text-foreground-secondary hover:bg-surface-neutral-secondary flex size-8 items-center justify-center rounded-full transition-colors"
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

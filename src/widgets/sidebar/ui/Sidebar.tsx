"use client"

import { MobileBottomNav } from "./MobileBottomNav"
import MobileSidebar from "./MobileSidebar"
import { SidebarFooter } from "./SidebarFooter"
import { SidebarHeader } from "./SidebarHeader"
import { SidebarMenu } from "./SidebarMenu"
import { Notifications } from "@/widgets/notifications/ui/Notifications"
import { RiMenuLine } from "@/shared/ui/lucide-icons"
import { UserProfileMobile } from "./UserProfile"

export function Sidebar() {
  return (
    <>
      {/* --- 1. DESKTOP SIDEBAR --- */}
      <nav className="border-border bg-background hidden border-r xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:w-64 xl:flex-col">
        <aside className="flex grow flex-col overflow-y-auto">
          {/* Node 3188-52441: Header / Profile Container */}
          <div>
            <SidebarHeader />
          </div>

          {/* Node 3188-52447: Menu Items */}
          <div className="flex-1">
            <SidebarMenu />
          </div>

          {/* Spacer to push Footer to bottom */}
          <div className="mt-auto" />

          {/* Node 3188-52460: Footer Items (Help, Settings) */}
          <SidebarFooter />
        </aside>
      </nav>

      {/* --- 2. MOBILE FLOATING CONTROLS --- */}
      <div className="fixed top-[calc(env(safe-area-inset-top)+0.5rem)] right-3 z-40 xl:hidden">
        <div className="bg-surface-neutral-primary border-neutral-primary flex items-center gap-1 rounded-full border p-1.5 shadow-sm">
          <Notifications variant="icon" />
          <UserProfileMobile />
          <MobileSidebar>
            <button
              type="button"
              aria-label="Open more menu"
              className="hover:bg-surface-neutral-secondary text-foreground-secondary flex size-8 items-center justify-center rounded-full transition-colors"
            >
              <RiMenuLine className="size-5" aria-hidden="true" />
            </button>
          </MobileSidebar>
        </div>
      </div>

      <MobileBottomNav />
    </>
  )
}

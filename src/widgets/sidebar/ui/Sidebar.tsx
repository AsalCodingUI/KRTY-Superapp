"use client"

import { MobileBottomNav } from "./MobileBottomNav"
import MobileSidebar from "./MobileSidebar"
import { SidebarFooter } from "./SidebarFooter"
import { SidebarHeader } from "./SidebarHeader"
import { SidebarMenu } from "./SidebarMenu"
import { SidebarThemeToggle } from "./SidebarThemeToggle"
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

          {/* Node 3188-52458: Theme Switcher */}
          <SidebarThemeToggle />

          {/* Node 3188-52460: Footer Items (Help, Settings) */}
          <SidebarFooter />
        </aside>
      </nav>

      {/* --- 2. MOBILE FLOATING CONTROLS --- */}
      <div className="fixed top-[calc(env(safe-area-inset-top)+0.5rem)] right-3 z-40 xl:hidden">
        <div className="bg-surface-neutral-primary border-neutral-primary flex items-center rounded-full border pr-2 pl-1 py-2 shadow-sm">
          <UserProfileMobile />
          <MobileSidebar />
        </div>
      </div>

      <MobileBottomNav />
    </>
  )
}

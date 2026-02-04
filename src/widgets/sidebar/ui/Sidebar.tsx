"use client"

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
      <nav className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col border-r border-border bg-background">
        <aside className="flex grow flex-col overflow-y-auto pb-4">
          {/* Node 3188-52441: Header / Profile Container */}
          <div>
            <SidebarHeader />
          </div>

          {/* Node 3188-52447: Menu Items */}
          <div className="mt-2 flex-1">
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

      {/* --- 2. MOBILE TOP BAR --- */}
      <div className="border-border bg-background sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b px-4 sm:gap-x-6 sm:px-6 lg:hidden">
        <div className="text-content dark:text-content flex items-center gap-2 font-medium">
          <span className="bg-primary dark:bg-primary flex aspect-square size-8 items-center justify-center rounded p-2 text-xs font-medium text-white">
            KS
          </span>
          <span>Kretya Studio</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <UserProfileMobile />
          <MobileSidebar />
        </div>
      </div>
    </>
  )
}

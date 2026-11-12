"use client"

import { afterSignOut } from "@/shared/lib/after-sign-out"
import { siteConfig } from "@/app/siteConfig"
import { AppIcon } from "@/components/app-icon"
import { NavUser } from "@/components/nav-user"
import { useWorkspaceNav } from "@/components/workspace-nav"
import { SegmentedControl } from "@/components/segmented-control"
import type { WorkspaceId } from "@/shared/config/workspaces"
import { useMacChrome } from "@/components/desktop-shell"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { TabHistoryButtons } from "@/widgets/app-tabs/ui/AppTabs"
import { cn } from "@/lib/utils"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { Notifications } from "@/widgets/notifications/ui/Notifications"
import { PrefetchLink } from "@/components/prefetch-link"
import { SiteHeader } from "@/components/site-header"
import { Suspense } from "react"

const ADMIN_CONTACT_LINK = "https://wa.me/6289525418707"

/**
 * The chrome above the page, phones only: brand, notifications and
 * account (search and the workspaces live in the tab bar there). From md
 * up all of it is in the sidebar (app-sidebar.tsx); the Mac app keeps a
 * 52pt strip for the traffic lights and the sidebar toggle.
 */
/** The signed-in account's menu (avatar + name). */
export function AccountMenu({
  row = false,
  side = "bottom",
}: {
  /** The sidebar's bottom row instead of the phone top bar. */
  row?: boolean
  side?: "bottom" | "top" | "right"
}) {
  const { profile, userEmail } = useUserProfile()
  const tc = useT("common")
  const handleSignOut = async () => {
    await createClient().auth.signOut()
    await afterSignOut()
    // Full reload so no client state survives the sign-out.
    window.location.href = "/login"
  }
  return (
    <NavUser
      showName
      row={row}
      side={side}
      user={{
        name: profile?.full_name ?? tc("loading"),
        email: profile?.email || userEmail || "",
        avatar: profile?.avatar_url || undefined,
      }}
      onSignOut={handleSignOut}
      contactHref={ADMIN_CONTACT_LINK}
    />
  )
}

export function AppTopbar() {
  const desktop = useMacChrome()
  const { state } = useSidebar()
  const open = state === "expanded"

  const account = (
    <div className="flex flex-1 items-center justify-end gap-1">
      <Notifications variant="icon" />
      <AccountMenu />
    </div>
  )

  // In the Mac app: the traffic lights and, beside them, the sidebar
  // toggle; the rest is in the sidebar.
  if (desktop)
    return (
      <header
        data-slot="app-topbar"
        className={cn(
          // cursor-default + select-none: dragging the window by it shows the
          // arrow, not a text cursor (and selects nothing).
          "on-chrome text-foreground relative z-40 flex h-(--app-topbar-height) shrink-0 cursor-default items-center pr-1.5 select-none",
        )}
        data-chrome-dark=""
      >
        {/* ChatGPT-style: past the traffic lights ← → and the toggle, over
            the rail and the panel; the tabs start where the page sheet
            does (the panel folded, right after ‹ ›). One row, centred in
            the 52pt bar like the lights. */}
        <div
          className={cn(
            "flex shrink-0 items-center gap-1.5 pl-[5.5rem] transition-[width] duration-200 ease-out group-data-[resizing=true]/sidebar-wrapper:transition-none motion-reduce:transition-none",
            open
              ? "w-[calc(var(--sidebar-width-icon)+var(--sidebar-width))]"
              : // Folded: the tabs follow 6px on, as the buttons do.
                "pr-1.5",
          )}
        >
          {/* ChatGPT's order: ← → then the sidebar toggle. */}
          <TabHistoryButtons />
          <SidebarTrigger className="text-foreground/55" />
        </div>
        <div className="flex min-w-0 flex-1 items-center">
          <Suspense>
            <SiteHeader history={false} />
          </Suspense>
        </div>
      </header>
    )

  return (
    // No fill of its own: the chrome behind it shows through, so the page
    // sheet's shadow isn't cut off along the bar's bottom edge.
    <header
      data-slot="app-topbar"
      className={cn(
        "on-chrome text-foreground relative z-40 flex h-(--app-topbar-height) shrink-0 items-center gap-4 px-4 md:hidden",
      )}
      data-chrome-dark=""
    >
      <div className="flex flex-1 items-center gap-6 whitespace-nowrap">
        <PrefetchLink
          href={siteConfig.baseLinks.dashboard}
          className="flex shrink-0 items-center gap-2"
          aria-label={siteConfig.name}
        >
          <AppIcon size={192} variant="mark" className="size-[22px]" />
          <span className="text-sm font-medium">{siteConfig.name}</span>
        </PrefetchLink>
      </div>

      {account}
    </header>
  )
}

/**
 * Kantor | Project at the sidebar's top: a full-width segmented pill
 * (tray + white thumb), so it reads as a switch of the list below and not
 * as one more nav row. A dot on the other workspace when it has something
 * new.
 */
export function WorkspaceTabs({ className }: { className?: string }) {
  const { loading, visible, active, select, hasBadge } = useWorkspaceNav()
  const t = useT("nav")
  if (loading)
    return (
      <div className={cn("bg-chrome-field rounded-control h-8", className)} />
    )
  if (visible.length < 2 || !active) return null
  return (
    <SegmentedControl<WorkspaceId>
      // The tray on the chrome: its field fill, light and dark; the tab
      // not chosen reads like an inactive sidebar row (--chrome-label).
      className={cn(
        "bg-chrome-field dark:bg-chrome-field [--muted-foreground:var(--chrome-label)]",
        className,
      )}
      value={active.id}
      onChange={select}
      items={visible.map((ws) => ({
        value: ws.id,
        icon: ws.icon,
        label: (
          <span className="relative">
            {t(ws.name)}
            {ws.id !== active.id && hasBadge(ws) && (
              <span
                aria-hidden
                className="bg-primary absolute -top-0.5 -right-2 size-1.5 rounded-full"
              />
            )}
          </span>
        ),
      }))}
    />
  )
}

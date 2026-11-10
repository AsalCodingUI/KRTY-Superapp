"use client"

import { siteConfig } from "@/app/siteConfig"
import { AppIcon } from "@/components/app-icon"
import { NavUser } from "@/components/nav-user"
import { useWorkspaceNav } from "@/components/workspace-nav"
import { useMacChrome } from "@/components/desktop-shell"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
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
          "on-chrome text-foreground relative z-40 flex h-(--app-topbar-height) shrink-0 items-center pr-1.5",
        )}
        data-chrome-dark=""
      >
        <div
          className={cn(
            "flex shrink-0 items-center pl-[5.25rem] transition-[width] duration-200 ease-out motion-reduce:transition-none",
            state === "collapsed"
              ? "w-[7.75rem]"
              : "w-[max(var(--sidebar-width),7.75rem)]",
          )}
        >
          <SidebarTrigger className="text-muted-foreground" />
        </div>
        {/* The tabs over the page, their bottom on the sheet's top. */}
        <div className="flex min-w-0 flex-1 self-end">
          <Suspense>
            <SiteHeader />
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
 * Kantor / Project as tabs at the sidebar's top: icon + label, the active
 * one on the sidebar's active fill, a dot on the other when it has
 * something new. Not a segmented control.
 */
export function WorkspaceTabs({ className }: { className?: string }) {
  const { loading, visible, active, select, hasBadge } = useWorkspaceNav()
  const t = useT("nav")
  if (loading) return <div className="bg-chrome-field h-8 w-40 rounded-full" />
  if (visible.length < 2 || !active) return null
  return (
    <div
      role="tablist"
      className={cn("flex min-w-0 items-center gap-0.5", className)}
    >
      {visible.map((ws) => {
        const on = ws.id === active.id
        const Icon = ws.icon
        return (
          <button
            key={ws.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => select(ws.id)}
            className={cn(
              // Same icon and text as the nav rows below (16px icon, 14px
              // text). Optical (docs/ui/optical.md): the icon side 2px
              // tighter than the text side (10 / 12px, so the icon centres on
              // the sidebar's icon column). gap-2, not the rows' 2.5, so both
              // tabs and the bell fit 15.5rem in English ("Personal").
              "rounded-control flex h-8 min-w-0 shrink-0 items-center gap-2 pr-3 pl-2.5 text-sm font-medium transition-colors",
              on
                ? "bg-sidebar-active text-foreground"
                : "text-chrome-label hover:text-foreground hover:bg-chrome-hover",
            )}
          >
            <span className="relative flex shrink-0">
              <Icon
                className={cn("size-4", !on && "text-muted-foreground")}
              />
              {!on && hasBadge(ws) && (
                <span
                  aria-hidden
                  className="bg-primary ring-chrome absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2"
                />
              )}
            </span>
            <span className="truncate">{t(ws.name)}</span>
          </button>
        )
      })}
    </div>
  )
}

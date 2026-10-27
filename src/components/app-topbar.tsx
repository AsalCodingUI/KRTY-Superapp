"use client"

import { siteConfig } from "@/app/siteConfig"
import { AppIcon } from "@/components/app-icon"
import { NavUser } from "@/components/nav-user"
import { SegmentedControl } from "@/components/segmented-control"
import { useWorkspaceNav } from "@/components/workspace-nav"
import { useDesktopShell } from "@/components/desktop-shell"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { Notifications } from "@/widgets/notifications/ui/Notifications"
import { GlobalSearch } from "@/widgets/global-search/ui/GlobalSearch"
import { PrefetchLink } from "@/components/prefetch-link"

const ADMIN_CONTACT_LINK = "https://wa.me/6289525418707"

/**
 * App chrome above the sidebar and page: brand, workspace switch, search (⌘K),
 * notifications and account. Sits on the tinted chrome with the sidebar.
 */
export function AppTopbar() {
  const { profile, userEmail } = useUserProfile()
  const tc = useT("common")
  const desktop = useDesktopShell()
  const { state } = useSidebar()

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    // Full reload so no client state survives the sign-out.
    window.location.href = "/login"
  }

  const account = (
    <div className="flex flex-1 items-center justify-end gap-1">
      <Notifications variant="icon" />
      <NavUser
        showName
        side="bottom"
        user={{
          name: profile?.full_name ?? tc("loading"),
          email: profile?.email || userEmail || "",
        }}
        onSignOut={handleSignOut}
        contactHref={ADMIN_CONTACT_LINK}
      />
    </div>
  )

  // In the Mac app: the traffic lights and the sidebar toggle over the
  // sidebar's column, the search from where the page starts.
  if (desktop)
    return (
      <header
        data-slot="app-topbar"
        className="on-chrome text-foreground relative z-40 flex h-(--app-topbar-height) shrink-0 items-center pr-4"
      >
        <div
          className={cn(
            "flex shrink-0 items-center pl-[5.25rem] transition-[width] duration-200 ease-linear",
            state === "collapsed"
              ? "w-[7.75rem]"
              : "w-[max(var(--sidebar-width),7.75rem)]",
          )}
        >
          <SidebarTrigger className="text-muted-foreground" />
        </div>
        <GlobalSearch className="hidden max-w-[440px] flex-1 md:flex" />
        {account}
      </header>
    )

  return (
    // No fill of its own: the chrome behind it shows through, so the page
    // sheet's shadow isn't cut off along the bar's bottom edge.
    <header
      data-slot="app-topbar"
      className="on-chrome text-foreground relative z-40 flex h-(--app-topbar-height) shrink-0 items-center gap-4 px-4 md:grid md:grid-cols-[1fr_minmax(0,35rem)_1fr]"
    >
      {/* From md up a grid: equal sides keep the search centred, but they
          never go below their content, so on narrower windows the search
          shrinks instead of sliding over the workspace switch. No wrapping,
          or the brand name would count as two short lines. */}
      <div className="flex flex-1 items-center gap-6 whitespace-nowrap">
        <PrefetchLink
          href={siteConfig.baseLinks.dashboard}
          className="flex shrink-0 items-center gap-2"
          aria-label={siteConfig.name}
        >
          <AppIcon size={192} variant="mark" className="size-[22px]" />
          <span className="hidden text-sm font-medium sm:inline">
            {siteConfig.name}
          </span>
        </PrefetchLink>
        <WorkspaceSwitch />
      </div>

      <GlobalSearch className="hidden max-w-[560px] md:flex" />

      {account}
    </header>
  )
}

/** Pribadi / Project, with a dot on the one that has something new. */
export function WorkspaceSwitch({
  className,
  fill = false,
}: {
  className?: string
  /** Stretch to the full width, each tab an equal share. */
  fill?: boolean
}) {
  const { loading, visible, active, select, hasBadge } = useWorkspaceNav()
  const t = useT("nav")
  return (
    <>
      {loading ? (
        <div className="bg-muted h-7 w-40 rounded-md" />
      ) : (
        visible.length > 1 &&
        active && (
          <SegmentedControl
            fitContent={!fill}
            className={cn(
              "fill-ink bg-transparent dark:bg-transparent",
              className,
            )}
            indicatorClassName="shadow-(--elev-2)"
            value={active.id}
            onChange={select}
            items={visible.map((ws) => ({
              value: ws.id,
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
      )}
    </>
  )
}

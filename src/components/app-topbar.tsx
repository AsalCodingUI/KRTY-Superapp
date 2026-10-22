"use client"

import { siteConfig } from "@/app/siteConfig"
import { BrandLogo } from "@/components/brand-logo"
import { NavUser } from "@/components/nav-user"
import { SegmentedControl } from "@/components/segmented-control"
import { useWorkspaceNav } from "@/components/workspace-nav"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { Notifications } from "@/widgets/notifications/ui/Notifications"
import { GlobalSearch } from "@/widgets/global-search/ui/GlobalSearch"
import { PrefetchLink } from "@/components/prefetch-link"

const ADMIN_CONTACT_LINK = "https://wa.me/6289525418707"

/**
 * App chrome above the sidebar and page: brand, workspace switch, search (⌘K),
 * notifications and account. Always dark, in both themes.
 */
export function AppTopbar() {
  const { profile, userEmail } = useUserProfile()
  const { loading, visible, active, select, hasBadge } = useWorkspaceNav()

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    // Full reload so no client state survives the sign-out.
    window.location.href = "/login"
  }

  return (
    <header className="dark bg-chrome text-foreground relative z-40 flex h-(--app-topbar-height) shrink-0 items-center gap-4 px-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <PrefetchLink
          href={siteConfig.baseLinks.dashboard}
          className="flex shrink-0 items-center gap-2"
          aria-label={siteConfig.name}
        >
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
            <BrandLogo className="size-[18px]" />
          </span>
          <span className="hidden text-sm font-medium sm:inline">
            {siteConfig.name}
          </span>
        </PrefetchLink>
        {loading ? (
          <div className="bg-muted h-7 w-40 rounded-md" />
        ) : (
          visible.length > 1 &&
          active && (
            <SegmentedControl
              fitContent
              value={active.id}
              onChange={select}
              items={visible.map((ws) => ({
                value: ws.id,
                label: (
                  <span className="relative">
                    {ws.name}
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
      </div>

      <GlobalSearch className="hidden max-w-[560px] md:flex" />

      <div className="flex flex-1 items-center justify-end gap-1">
        <Notifications variant="icon" />
        <NavUser
          showName
          side="bottom"
          user={{
            name: profile?.full_name ?? "Loading…",
            email: profile?.email || userEmail || "",
          }}
          onSignOut={handleSignOut}
          contactHref={ADMIN_CONTACT_LINK}
        />
      </div>
    </header>
  )
}

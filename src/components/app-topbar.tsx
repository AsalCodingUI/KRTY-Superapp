"use client"

import { siteConfig } from "@/app/siteConfig"
import { AppIcon } from "@/components/app-icon"
import { NavUser } from "@/components/nav-user"
import { SegmentedControl } from "@/components/segmented-control"
import { useWorkspaceNav } from "@/components/workspace-nav"
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
  const { loading, visible, active, select, hasBadge } = useWorkspaceNav()
  const t = useT("nav")
  const tc = useT("common")

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    // Full reload so no client state survives the sign-out.
    window.location.href = "/login"
  }

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
        {loading ? (
          <div className="bg-muted h-7 w-40 rounded-md" />
        ) : (
          visible.length > 1 &&
          active && (
            <SegmentedControl
              fitContent
              className="fill-ink bg-transparent dark:bg-transparent"
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
      </div>

      <GlobalSearch className="hidden max-w-[560px] md:flex" />

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
    </header>
  )
}

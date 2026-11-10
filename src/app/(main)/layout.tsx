import { WorkspaceTransition } from "@/components/page-transition"
import { AppSidebar } from "@/components/app-sidebar"
import { AppTopbar } from "@/components/app-topbar"
import { WorkspaceNavProvider } from "@/components/workspace-nav"
import { SiteHeader } from "@/components/site-header"
import { PageSheet, pageSheetContentClassName } from "@/components/page-sheet"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { AppBannerStack } from "@/widgets/app-banner/ui/AppBanner"
import { AnnouncementBanner } from "@/widgets/app-banner/ui/AnnouncementBanner"
import { ImpersonationBanner } from "@/widgets/impersonation/ui/ImpersonationBanner"
import { DesktopShellProvider } from "@/components/desktop-shell"
import { ContextMenuAppScope } from "@/shared/context-menu"
import { UndoShortcuts } from "@/shared/undo"
import { SettingsHost } from "@/widgets/settings/ui/SettingsHost"
import {
  DESKTOP_SHELL_COOKIE,
  parseDesktopShell,
} from "@/shared/lib/desktop-shell"
import { getSessionContext } from "@/shared/lib/session-context-server"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { cookies } from "next/headers"
import { cn } from "@/lib/utils"
import { MobileNav } from "@/components/mobile-nav"
import { Suspense } from "react"

/**
 * Inside KRTY for Mac: the window's toolbar is 52pt (macOS's unified
 * toolbar, where it centres the traffic lights), so the top bar matches;
 * the right-hand sheets and panels sit 8px inside the page, as on the web; the chrome (sidebar and top bar) is see-through over the
 * window's native blur, its wash leaning a little to the theme color (near
 * white when neutral). The page stays solid.
 */
// As on the web: 8px inside the page on every side, the radius nested in
// the page's (10px, squircle-scaled) minus that gap.
const CORNER = "right:14px;bottom:14px;--nest-r:calc(10px * var(--corner-k,1))"
const DESKTOP_CSS =
  ":root:root{--app-topbar-height:52px;--app-tabs-height:0px}" +
  `@media (min-width:768px){[data-slot="sheet-content"][data-side="right"]{${CORNER}}}` +
  `@media (min-width:1024px){[data-slot="side-panel"]{${CORNER}}}` +
  "html,body{background:transparent}" +
  // A light wash of the chrome over the window's blur: mostly see-through.
  '[data-slot="sidebar-wrapper"]{background-color:color-mix(in oklab,color-mix(in oklab,#fff 55%,var(--chrome)) 30%,transparent)}' +
  '.dark [data-slot="sidebar-wrapper"]{background-color:color-mix(in oklab,var(--chrome) 25%,transparent)}' +
  '[data-slot="sidebar-inner"]{background:transparent}'

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [cookieStore, session] = await Promise.all([
    cookies(),
    getSessionContext(),
  ])
  const shell = parseDesktopShell(cookieStore.get(DESKTOP_SHELL_COOKIE)?.value)
  // The Mac app's own chrome (see DESKTOP_CSS); Windows keeps the web's.
  const desktop = shell === "mac"
  // The viewer, resolved here: the sidebar, badges and pages that key off
  // ["session-context"] start at once instead of after a browser fetch.
  const queryClient = new QueryClient()
  queryClient.setQueryData(["session-context"], session)
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DesktopShellProvider value={shell}>
        {/* The right-click menu gets the viewer's access, ⌘K and AI. */}
        <ContextMenuAppScope />
        {/* ⌘Z / ⌘⇧Z across the app (shared/undo). */}
        <UndoShortcuts />
        <Suspense>
          <SettingsHost />
        </Suspense>
        {desktop && (
          // A new href whenever the rules change: React keeps a hoisted
          // style by its href.
          <style
            href={`krty-desktop-${DESKTOP_CSS.length}`}
            precedence="default"
          >
            {DESKTOP_CSS}
          </style>
        )}
        <SidebarProvider className="bg-chrome h-svh min-h-0 flex-col overflow-hidden">
          <WorkspaceNavProvider>
            <AppTopbar />
            {/* Sidebar and page stay siblings: the inset styles key off the sidebar.
            Top bar and sidebar share the tinted chrome; the page floats on it
            as one rounded sheet (Arc style). */}
            <div
              className={cn(
                "flex min-h-0 w-full flex-1",
                // 6px from the window's edge (Fibery-close); in the Mac app
                // a 10px radius runs parallel to the 16pt window corner.
                "md:pr-1.5 md:pb-1.5",
              )}
            >
              <AppSidebar />
              {/* The page sheet (components/page-sheet.tsx), shared with the
              client portal. */}
              {/* min-h-0: the sheet scrolls inside the column instead of
                  growing it past the window. */}
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {/* The tabs, on the chrome above the sheet (the Mac app
                    has them in its top strip). */}
                {!desktop && (
                  <Suspense>
                    <SiteHeader />
                  </Suspense>
                )}
                {/* Banners (view-as, announcements): on the chrome between
                    the tabs and the page, as wide as the page. */}
                <AppBannerStack>
                  <ImpersonationBanner />
                  <AnnouncementBanner />
                </AppBannerStack>
                <PageSheet mac={desktop} className="max-md:pt-2 md:pt-6">
                  <div
                    className={cn(
                      pageSheetContentClassName,
                      "pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-6",
                    )}
                  >
                    <WorkspaceTransition>
                      <Suspense fallback={<PageFallback />}>
                        {children}
                      </Suspense>
                    </WorkspaceTransition>
                  </div>
                </PageSheet>
              </div>
            </div>
          </WorkspaceNavProvider>
          {/* Phones: the essentials, from a tab bar at the bottom. */}
          <MobileNav />
        </SidebarProvider>
      </DesktopShellProvider>
    </HydrationBoundary>
  )
}

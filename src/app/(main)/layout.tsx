import { WorkspaceTransition } from "@/components/page-transition"
import { AppSidebar } from "@/components/app-sidebar"
import { AppTopbar } from "@/components/app-topbar"
import { WorkspaceNavProvider } from "@/components/workspace-nav"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
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
  ":root{--app-topbar-height:52px}" +
  `@media (min-width:768px){[data-slot="sheet-content"][data-side="right"]{${CORNER}}}` +
  `@media (min-width:1024px){[data-slot="side-panel"]{${CORNER}}}` +
  "html,body{background:transparent}" +
  // A light wash of the chrome over the window's blur: mostly see-through.
  '[data-slot="sidebar-wrapper"]{background-color:color-mix(in oklab,color-mix(in oklab,#fff 55%,var(--chrome)) 30%,transparent)}' +
  '.dark [data-slot="sidebar-wrapper"]{background-color:color-mix(in oklab,var(--chrome) 25%,transparent)}' +
  '[data-slot="sidebar-inner"]{background:transparent}'

/** The page sheet's corner in the Mac app: the window's 16pt corner less
 *  the 6px inset (a native size, so not a radius role). */
const MAC_SHEET_RADIUS = "md:rounded-[10px]"

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
            {/* Banners (view-as, announcements) sit in the tinted chrome. */}
            <AppBannerStack>
              <ImpersonationBanner />
              <AnnouncementBanner />
            </AppBannerStack>
            {/* Sidebar and page stay siblings: the inset styles key off the sidebar.
            Top bar and sidebar share the tinted chrome; the page floats on it
            as one rounded sheet (Arc style). */}
            <div
              className={cn(
                "flex min-h-0 w-full flex-1",
                // In the Mac app the sheet hugs the window's rounded corner
                // (16pt): 6px in, so a 10px radius runs parallel to it.
                desktop ? "md:pr-1.5 md:pb-1.5" : "md:pr-3 md:pb-3",
              )}
            >
              <AppSidebar />
              {/* The sheet's shadow is its own layer so it can blend darken into
              the chrome (deepening the tint) while the page itself stays as
              it is. No stacking context on the wrapper, or the blend would
              have nothing to mix with. */}
              <div className="relative flex min-w-0 flex-1">
                <div
                  aria-hidden
                  className={cn(
                    "blend-shadow pointer-events-none absolute inset-0 z-20 hidden shadow-(--elev-3) md:block",
                    desktop ? MAC_SHEET_RADIUS : "md:rounded-dialog",
                  )}
                />
                {/* The scrollbar's room is always kept, on both sides (scroll-pane),
                so a page that gets shorter doesn't shift sideways and the left and
                right spacing match; the gutter gives back that room (--sbw). */}
                <SidebarInset
                  className={cn(
                    "dark:bg-surface scroll-pane overscroll-contain [--bleed:0.75rem] [--page-gutter:max(var(--bleed),calc(1.25rem-var(--sbw,0px)))] md:z-20 md:[--page-gutter:calc(2.5rem-var(--sbw,0px))] xl:[--page-gutter:calc(4rem-var(--sbw,0px))]",
                    desktop ? MAC_SHEET_RADIUS : "md:rounded-dialog",
                    // Phones (Shopify style): the page is a sheet on the
                    // chrome, its top corners rounded.
                    "max-md:rounded-t-dialog max-md:pt-2",
                  )}
                >
                  <SiteHeader />
                  <div className="gutter-x flex flex-1 flex-col gap-4 overflow-x-clip pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-6">
                    <WorkspaceTransition>
                      <Suspense fallback={<PageFallback />}>
                        {children}
                      </Suspense>
                    </WorkspaceTransition>
                  </div>
                </SidebarInset>
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

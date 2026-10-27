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
import { DESKTOP_SHELL_COOKIE } from "@/shared/lib/desktop-shell"
import { cookies } from "next/headers"
import { cn } from "@/lib/utils"
import { Suspense } from "react"

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
  const desktop = (await cookies()).get(DESKTOP_SHELL_COOKIE)?.value === "mac"
  return (
    <DesktopShellProvider value={desktop}>
      {/* The Mac app's window toolbar is 52pt (macOS's unified toolbar,
          where it centres the traffic lights); the top bar matches it. */}
      {desktop && (
        <style href="krty-desktop-shell" precedence="default">
          {
            // The right-hand sheets sit in the same window corner. The
            // chrome (sidebar and top bar) is see-through over the window's
            // native blur, light leaning white; the page stays solid.
            ':root{--app-topbar-height:52px}@media (min-width:768px){[data-slot="sheet-content"][data-side="right"]{right:6px;bottom:6px;--nest-r:10px}}' +
              "html,body{background:transparent}" +
              '[data-slot="sidebar-wrapper"]{background-color:rgb(255 255 255/0.5)}' +
              '.dark [data-slot="sidebar-wrapper"]{background-color:rgb(24 24 27/0.45)}' +
              '[data-slot="sidebar-inner"]{background:transparent}'
          }
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
                  desktop ? "md:rounded-[10px]" : "md:rounded-3xl",
                )}
              />
              {/* The scrollbar's room is always kept (scrollbar-gutter), so a
                page that gets shorter (a filter, a tab) doesn't widen by
                the scrollbar and shift everything sideways. */}
              <SidebarInset
                className={cn(
                  "dark:bg-surface overflow-y-auto overscroll-contain [--bleed:0.75rem] [--page-gutter:1.25rem] [scrollbar-gutter:stable] md:z-20 md:[--page-gutter:2.5rem] xl:[--page-gutter:4rem]",
                  desktop ? "md:rounded-[10px]" : "md:rounded-3xl",
                )}
              >
                <SiteHeader />
                <div className="gutter-x flex flex-1 flex-col gap-4 overflow-x-clip pb-6">
                  <WorkspaceTransition>
                    <Suspense fallback={<PageFallback />}>{children}</Suspense>
                  </WorkspaceTransition>
                </div>
              </SidebarInset>
            </div>
          </div>
        </WorkspaceNavProvider>
      </SidebarProvider>
    </DesktopShellProvider>
  )
}

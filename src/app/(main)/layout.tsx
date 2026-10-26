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
import { Suspense } from "react"

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
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
        <div className="flex min-h-0 w-full flex-1 md:pr-3 md:pb-3">
          <AppSidebar />
          {/* The sheet's shadow is its own layer so it can blend darken into
              the chrome (deepening the tint) while the page itself stays as
              it is. No stacking context on the wrapper, or the blend would
              have nothing to mix with. */}
          <div className="relative flex min-w-0 flex-1">
            <div
              aria-hidden
              className="blend-shadow pointer-events-none absolute inset-0 z-20 hidden shadow-(--elev-3) md:block md:rounded-3xl"
            />
            {/* The scrollbar's room is always kept (scrollbar-gutter), so a
                page that gets shorter (a filter, a tab) doesn't widen by
                the scrollbar and shift everything sideways. */}
            <SidebarInset className="dark:bg-surface overflow-y-auto overscroll-contain [--bleed:0.75rem] [--page-gutter:1.25rem] [scrollbar-gutter:stable] md:z-20 md:rounded-3xl md:[--page-gutter:2.5rem] xl:[--page-gutter:4rem]">
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
  )
}

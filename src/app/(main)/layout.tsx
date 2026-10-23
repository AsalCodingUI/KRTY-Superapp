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
        <div className="flex min-h-0 w-full flex-1 md:pr-2 md:pb-2">
          <AppSidebar />
          <SidebarInset className="dark:bg-surface overflow-y-auto overscroll-contain shadow-(--shadow-sheet) [--bleed:0.75rem] [--page-gutter:1.25rem] md:z-20 md:rounded-2xl md:[--page-gutter:2.5rem] xl:[--page-gutter:4rem]">
            <SiteHeader />
            <div className="gutter-x flex flex-1 flex-col gap-4 pb-6">
              <Suspense fallback={<PageFallback />}>{children}</Suspense>
            </div>
          </SidebarInset>
        </div>
      </WorkspaceNavProvider>
    </SidebarProvider>
  )
}

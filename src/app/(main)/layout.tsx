import { AppSidebar } from "@/components/app-sidebar"
import { AppTopbar } from "@/components/app-topbar"
import { WorkspaceNavProvider } from "@/components/workspace-nav"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { AppBannerStack } from "@/widgets/app-banner/ui/AppBanner"
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
        {/* Banners (view-as, later announcements) sit in the dark chrome. */}
        <AppBannerStack>
          <ImpersonationBanner />
        </AppBannerStack>
        {/* Sidebar and page stay siblings: the inset styles key off the sidebar.
            The row is one rounded sheet under the top bar; the page is a
            second rounded sheet inside it, next to the sidebar. */}
        <div className="bg-sidebar flex min-h-0 w-full flex-1 md:overflow-hidden md:rounded-t-2xl">
          <AppSidebar />
          <SidebarInset className="dark:bg-surface overflow-y-auto overscroll-contain [--bleed:0.75rem] [--page-gutter:1.25rem] md:rounded-t-2xl md:[--page-gutter:2.5rem] xl:[--page-gutter:4rem]">
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

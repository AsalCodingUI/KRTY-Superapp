import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { SettingsDialog } from "@/page-slices/settings"
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
    <SidebarProvider className="flex-col">
      {/* Full-width banners above everything (view-as, later announcements). */}
      <AppBannerStack>
        <ImpersonationBanner />
      </AppBannerStack>
      {/* Sidebar and page stay siblings: the inset styles key off the sidebar. */}
      <div className="flex w-full flex-1">
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Suspense fallback={<PageFallback />}>{children}</Suspense>
          </div>
          {/* Settings opens as a modal over any page (?settings=<section>). */}
          <Suspense fallback={null}>
            <SettingsDialog />
          </Suspense>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { SettingsDialog } from "@/page-slices/settings"
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ImpersonationBanner />
          <Suspense fallback={<PageFallback />}>{children}</Suspense>
        </div>
        {/* Settings opens as a modal over any page (?settings=<section>). */}
        <Suspense fallback={null}>
          <SettingsDialog />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}

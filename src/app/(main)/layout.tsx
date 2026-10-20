import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { ImpersonationBanner } from "@/widgets/impersonation/ui/ImpersonationBanner"
import { SidebarShell } from "@/widgets/sidebar/ui/SidebarShell"
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
      {/* Desktop: inset sidebar over the canvas. Mobile: top bar + bottom nav. */}
      <SidebarShell />
      <SidebarInset className="pt-[calc(env(safe-area-inset-top)+3.25rem+1rem)] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pt-4 md:pb-4">
        <ImpersonationBanner />
        <Suspense fallback={<PageFallback />}>{children}</Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}

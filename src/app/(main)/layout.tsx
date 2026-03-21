import { Spinner } from "@/shared/ui"
import { ImpersonationBanner } from "@/widgets/impersonation/ui/ImpersonationBanner"
import { SidebarShell } from "@/widgets/sidebar/ui/SidebarShell"
import { Suspense } from "react"

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size="md" />
    </div>
  )
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {/* Sidebar - blends with body background */}
      <SidebarShell />

      {/* Main content with "Floating Page" effect */}
      <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] xl:pb-0 xl:pl-64">
        {/* Floating panel wrapper with margin, rounded corners, and distinct background */}
        <div className="bg-background min-h-screen">
          <div className="bg-surface min-h-screen pt-[calc(env(safe-area-inset-top)+3.25rem)] xl:min-h-[calc(100vh-1rem)] xl:pt-0">
            {/* Content container with max-width for readability */}
            <ImpersonationBanner />
            <Suspense fallback={<PageFallback />}>
              <div className="mx-auto">{children}</div>
            </Suspense>
          </div>
        </div>
      </main>
    </>
  )
}

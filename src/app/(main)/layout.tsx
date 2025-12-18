import { Sidebar } from "@/components/navigation/Sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {/* Sidebar - blends with body background */}
      <Sidebar />

      {/* Main content with "Floating Page" effect */}
      <main className="lg:pl-64">
        {/* Floating panel wrapper with margin, rounded corners, and distinct background */}
        <div className="min-h-screen lg:p-2 bg-background">
          <div className="min-h-[calc(100vh-1rem)] rounded-xs lg:rounded-xl border-0 lg:border lg:border-border bg-surface ">
            {/* Content container with max-width for readability */}
            <div className="mx-auto max-w-screen-xl">
              <div className="p-4 sm:px-6 sm:pb-10 sm:pt-10 lg:px-10 lg:pt-7">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
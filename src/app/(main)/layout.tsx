import { Sidebar } from "@/widgets/sidebar/ui/Sidebar"

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
        <div className="bg-background min-h-screen">
          <div className="bg-surface min-h-[calc(100vh-1rem)]">
            {/* Content container with max-width for readability */}
            <div className="mx-auto">
              {children}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

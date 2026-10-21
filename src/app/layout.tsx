import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import QueryProvider from "@/components/providers/query-provider"
import type { Metadata, Viewport } from "next"
import { ThemeProvider } from "next-themes"
import { Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { siteConfig } from "./siteConfig"
import { cn } from "@/lib/utils";

// Sidebar dihapus dari sini!

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://app.kretya.studio",
  ),
  title: siteConfig.name,
  description: siteConfig.description,
  authors: [{ name: "Kretya Studio" }],
  creator: "Kretya Studio",
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(geistMono.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body
        className="selection:bg-primary/20 selection:text-primary min-h-dvh overflow-x-hidden overflow-y-scroll scroll-auto antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider>
              {/* Sidebar dan main wrapper dipindah ke layout (main) */}
              {children}
              <Toaster position="bottom-right" closeButton />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

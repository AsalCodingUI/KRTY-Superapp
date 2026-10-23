import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import QueryProvider from "@/components/providers/query-provider"
import { MotionProvider } from "@/components/providers/motion-provider"
import type { Metadata, Viewport } from "next"
import { ThemeProvider } from "next-themes"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { siteConfig } from "./siteConfig"
import { cn } from "@/lib/utils"
import { I18nProvider } from "@/shared/i18n/client"
import { getLocale } from "@/shared/i18n/server"
import { TINT_SCRIPT } from "@/shared/lib/chrome-tint"
import { ThemeColorSync } from "@/components/theme-color-sync"

// Sidebar dihapus dari sini!

const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
})

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  return (
    <html
      lang={locale}
      className={cn(geistSans.variable, geistMono.variable, "font-sans")}
      suppressHydrationWarning
    >
      <head>
        {/* The viewer's chrome color, before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: TINT_SCRIPT }} />
      </head>
      <body
        className="selection:bg-primary/20 selection:text-primary min-h-dvh overflow-x-hidden overflow-y-auto scroll-auto antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>
            <QueryProvider>
              <I18nProvider locale={locale}>
                <TooltipProvider>
                  {/* Sidebar dan main wrapper dipindah ke layout (main) */}
                  {children}
                  <Toaster position="bottom-right" closeButton />
                  {/* Safari / mobile toolbar takes the chrome color. */}
                  <ThemeColorSync />
                </TooltipProvider>
              </I18nProvider>
            </QueryProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

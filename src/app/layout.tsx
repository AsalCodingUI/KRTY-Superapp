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
import { getClientMessages, getLocale } from "@/shared/i18n/server"
import { TINT_SCRIPT } from "@/shared/lib/chrome-tint"
import { ThemeColorSync } from "@/components/theme-color-sync"
import { ScrollbarAutoHide } from "@/components/scrollbar-auto-hide"

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
  // App icon (Icons/ in the repo root): the tab gets the transparent mark
  // for the browser's theme (src/app/favicon.ico, the light one, for old
  // browsers); the dock / home screen gets the dark tile.
  icons: {
    icon: [
      {
        url: "/icons/mark-light-32.png",
        type: "image/png",
        sizes: "32x32",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icons/mark-dark-32.png",
        type: "image/png",
        sizes: "32x32",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icons/mark-light-192.png",
        type: "image/png",
        sizes: "192x192",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icons/mark-dark-192.png",
        type: "image/png",
        sizes: "192x192",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [{ url: "/icons/icon-dark-180.png", sizes: "180x180" }],
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
              <I18nProvider
                locale={locale}
                messages={getClientMessages(locale)}
              >
                <TooltipProvider>
                  {/* Sidebar dan main wrapper dipindah ke layout (main) */}
                  {children}
                  <Toaster position="bottom-right" closeButton />
                  {/* Safari / mobile toolbar takes the chrome color. */}
                  <ThemeColorSync />
                  <ScrollbarAutoHide />
                </TooltipProvider>
              </I18nProvider>
            </QueryProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

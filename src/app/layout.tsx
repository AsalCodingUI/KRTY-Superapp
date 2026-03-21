import { ToastProvider } from "@/shared/ui"
import QueryProvider from "@/shared/ui/providers/QueryProvider"
import type { Metadata, Viewport } from "next"
import { ThemeProvider } from "next-themes"
import { Inter } from "next/font/google"
import "./globals.css"
import { siteConfig } from "./siteConfig"

// Sidebar dihapus dari sini!

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} text-content selection:bg-primary/20 selection:text-primary min-h-dvh overflow-x-hidden overflow-y-scroll scroll-auto antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider forcedTheme="light" attribute="class">
          <QueryProvider>
            {/* Sidebar dan main wrapper dipindah ke layout (main) */}
            {children}
            <ToastProvider />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

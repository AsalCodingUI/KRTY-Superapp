"use client"

import { AppIcon } from "@/components/app-icon"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

/** The same white pill as the sign-in page's Google button. */
const PILL = cn(
  "flex h-11 w-full items-center justify-center gap-2.5 rounded-full text-sm font-medium",
  "text-foreground bg-background shadow-[0_4px_8px_-2px_rgb(0_0_0/0.03),0_2px_4px_-1px_rgb(0_0_0/0.03),0_0_0_1px_rgb(0_0_0/0.07)] hover:bg-[color-mix(in_oklch,var(--foreground)_2%,var(--background))]",
  "dark:bg-white/[0.06] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)] dark:hover:bg-white/10",
  "outline-none focus-visible:ring-[3px] focus-visible:ring-(--focus-ring)",
)

/**
 * Back to the desktop app, dressed like the sign-in page: the app icon,
 * one heading, one pill. It opens the app by itself; the pill is there for
 * when the browser's "Open KRTY?" prompt was dismissed.
 */
export function ConnectView({ link }: { link: string | null }) {
  // A beat after the page shows, so the browser's "Open KRTY?" prompt
  // doesn't land on a blank tab.
  useEffect(() => {
    if (!link) return
    const id = setTimeout(() => (window.location.href = link), 900)
    return () => clearTimeout(id)
  }, [link])

  return (
    <main className="text-foreground grid min-h-dvh grid-rows-[1fr_auto_1fr_1.5rem] justify-items-center bg-white px-4 dark:bg-black">
      <div className="enter-rise row-start-2 flex w-full max-w-[360px] flex-col items-center pt-4 pb-16">
        <div className="relative size-[88px]">
          <span
            aria-hidden
            className="absolute inset-0 rounded-[28px] shadow-[32px_0_100px_0_rgba(160,104,251,0.15),-32px_0_100px_0_rgba(106,253,216,0.15),0_-32px_100px_0_rgba(133,187,249,0.15),0_32px_100px_0_rgba(251,107,130,0.15)]"
          />
          <AppIcon size={1024} className="squircle-mask relative size-full" />
        </div>

        <h1 className="font-heading text-heading mt-11 text-center text-[30px] leading-[1.1] font-medium tracking-[-0.03em] text-balance">
          {link ? "Kembali ke app KRTY" : "Gagal masuk ke app"}
        </h1>
        <p className="text-muted-foreground mt-3 text-center text-sm text-balance">
          {link
            ? "Kamu sudah masuk. App KRTY terbuka sendiri; kalau belum, tekan tombol di bawah."
            : "Coba lagi dari app KRTY. Kalau masih gagal, hubungi admin."}
        </p>

        {link && (
          <a href={link} className={cn(PILL, "mt-8")}>
            <AppIcon size={96} variant="mark" className="size-4" />
            Buka KRTY
          </a>
        )}
        <p className="text-tertiary-foreground mt-4 text-center text-[13px]">
          Tab ini boleh ditutup.
        </p>
      </div>
    </main>
  )
}

"use client"

import { AppIcon } from "@/components/app-icon"
import {
  MinimalCard,
  MinimalScreen,
  screenLogoClass,
  screenTextClass,
  screenTitleClass,
} from "@/components/minimal-screen"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

/**
 * Back to the desktop app, on the minimal screens' card: the app icon, one
 * heading, one button. It opens the app by itself; the pill is there for
 * when the browser's "Open Kretya Flow?" prompt was dismissed.
 */
export function ConnectView({ link }: { link: string | null }) {
  // A beat after the page shows, so the browser's "Open Kretya Flow?" prompt
  // doesn't land on a blank tab.
  useEffect(() => {
    if (!link) return
    const id = setTimeout(() => (window.location.href = link), 900)
    return () => clearTimeout(id)
  }, [link])

  return (
    <MinimalScreen>
      <MinimalCard className="enter-rise">
        <AppIcon size={192} className={screenLogoClass} />
        <div className="flex flex-col items-center gap-3">
          <h1 className={screenTitleClass}>
            {link ? "Kembali ke Kretya Flow" : "Gagal masuk ke app"}
          </h1>
          <p className={screenTextClass}>
            {link
              ? "Kamu sudah masuk. Kretya Flow terbuka sendiri; kalau belum, tekan tombol di bawah."
              : "Coba lagi dari Kretya Flow. Kalau masih gagal, hubungi admin."}
          </p>
        </div>
        {link && (
          <Button
            size="lg"
            className="px-6"
            nativeButton={false}
            render={<a href={link} />}
          >
            Buka Kretya Flow
          </Button>
        )}
        <p className="text-tertiary-foreground text-meta">
          Tab ini boleh ditutup.
        </p>
      </MinimalCard>
    </MinimalScreen>
  )
}

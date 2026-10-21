"use client"

import { StatusPage } from "@/components/status-page"
import { Button } from "@/components/ui/button"
import { RiRefreshLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { useEffect } from "react"

/** Error boundary content for app routes. */
export function ErrorView({
  error,
  reset,
  fullScreen = false,
}: {
  error: Error & { digest?: string }
  reset: () => void
  fullScreen?: boolean
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <StatusPage
      className={fullScreen ? "min-h-svh" : undefined}
      code=":("
      title="Ada yang tidak beres"
      description="Halaman ini gagal dimuat. Coba lagi sebentar; kalau masih terjadi, kirim kode di bawah ke admin."
      detail={error.digest ? `Kode: ${error.digest}` : null}
      actions={
        <>
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
            Ke Dashboard
          </Button>
          <Button onClick={reset}>
            <RiRefreshLine data-icon="inline-start" />
            Coba lagi
          </Button>
        </>
      }
    />
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RiHome2Line, RiRefreshLine } from "@/shared/ui/lucide-icons"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error:", error)
  }, [error])

  return (
    <div className="bg-card min-h-[calc(100vh-1rem)] px-4 py-8">
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
        <Card className="w-full gap-0 p-8 text-center">
          <div className="space-y-5">
            <div className="bg-destructive/10 mx-auto flex size-14 items-center justify-center rounded-full border border-destructive/30">
              <span className="text-heading-md text-destructive">⚠️</span>
            </div>

            <h2 className="text-heading-lg text-foreground">
              Terjadi Kesalahan
            </h2>

            <p className="text-body-sm text-muted-foreground">
              Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi
              atau kembali ke dashboard.
            </p>

            {error.digest && (
              <p className="text-body-xs text-muted-foreground/70 tabular-nums">
                Error ID: {error.digest}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={reset}>
                <RiRefreshLine className="mr-2 size-4" />
                Coba Lagi
              </Button>
              <Button size="sm" onClick={() => (window.location.href = "/dashboard")}>
                <RiHome2Line className="mr-2 size-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

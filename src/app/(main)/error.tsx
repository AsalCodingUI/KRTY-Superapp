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
    <div className="min-h-[calc(100vh-1rem)] px-4 py-8">
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
        <Card className="w-full gap-0 p-8 text-center">
          <div className="space-y-5">
            <div className="bg-destructive/10 border-destructive/30 mx-auto flex size-14 items-center justify-center rounded-full border">
              <span className="text-destructive text-lg font-semibold">⚠️</span>
            </div>

            <h2 className="text-foreground text-xl font-semibold">
              Terjadi Kesalahan
            </h2>

            <p className="text-muted-foreground text-sm">
              Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi
              atau kembali ke dashboard.
            </p>

            {error.digest && (
              <p className="text-muted-foreground/70 text-xs tabular-nums">
                Error ID: {error.digest}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Button variant="outline" onClick={reset}>
                <RiRefreshLine className="mr-2 size-4" />
                Coba Lagi
              </Button>
              <Button onClick={() => (window.location.href = "/dashboard")}>
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

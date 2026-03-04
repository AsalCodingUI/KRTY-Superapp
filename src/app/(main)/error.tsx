"use client"

import { Button, Card } from "@/shared/ui"
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
    <div className="bg-surface min-h-[calc(100vh-1rem)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-xl items-center justify-center">
        <Card className="w-full p-8 text-center">
          <div className="space-y-5">
            <div className="bg-surface-danger-light mx-auto flex size-14 items-center justify-center rounded-full border border-border-danger-light">
              <span className="text-heading-md text-foreground-danger">⚠️</span>
            </div>

            <h2 className="text-heading-lg text-foreground-primary">
              Terjadi Kesalahan
            </h2>

            <p className="text-body-sm text-foreground-secondary">
              Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi
              atau kembali ke dashboard.
            </p>

            {error.digest && (
              <p className="text-body-xs text-foreground-tertiary tabular-nums">
                Error ID: {error.digest}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Button variant="secondary" onClick={reset}>
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

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
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-danger-light">
            <span className="text-display-xxs">⚠️</span>
          </div>

          <h2 className="text-heading-md text-foreground-primary dark:text-foreground-primary">
            Terjadi Kesalahan
          </h2>

          <p className="text-body-sm text-foreground-secondary dark:text-foreground-tertiary">
            Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi
            atau kembali ke halaman utama.
          </p>

          {error.digest && (
            <p className="text-body-xs text-foreground-tertiary dark:text-foreground-secondary tabular-nums">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex justify-center gap-3 pt-2">
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
  )
}

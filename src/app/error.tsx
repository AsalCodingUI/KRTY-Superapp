"use client"

import { Button, Card } from "@/shared/ui"
import { RiErrorWarningLine, RiHome2Line, RiRefreshLine } from "@/shared/ui/lucide-icons"
import { useEffect } from "react"

/**
 * Global Error Boundary
 * Catches errors that occur outside of the (main) layout
 * This is the last line of defense for unhandled errors
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Global Application Error:", error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="bg-surface min-h-screen px-4 py-8">
          <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
            <Card className="w-full p-8 text-center">
              <div className="space-y-5">
                <div className="bg-surface-danger-light mx-auto flex size-14 items-center justify-center rounded-full border border-border-danger-light">
                  <RiErrorWarningLine className="size-6 text-foreground-danger" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-heading-lg text-foreground-primary">
                    Something went wrong
                  </h1>
                  <p className="text-body-sm text-foreground-secondary">
                    We encountered an unexpected error. Please try again or return to dashboard.
                  </p>
                </div>

                {error.digest && (
                  <p className="text-body-xs text-foreground-tertiary tabular-nums">
                    Error ID: {error.digest}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <Button
                    variant="secondary"
                    onClick={() => (window.location.href = "/dashboard")}
                  >
                    <RiHome2Line className="mr-2 size-4" />
                    Dashboard
                  </Button>
                  <Button onClick={reset}>
                    <RiRefreshLine className="mr-2 size-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </body>
    </html>
  )
}

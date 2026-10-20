"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  RiErrorWarningLine,
  RiHome2Line,
  RiRefreshLine,
} from "@/shared/ui/lucide-icons"
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
        <div className="min-h-screen px-4 py-8">
          <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
            <Card className="w-full gap-0 p-8 text-center">
              <div className="space-y-5">
                <div className="bg-destructive/10 border-destructive/30 mx-auto flex size-14 items-center justify-center rounded-full border">
                  <RiErrorWarningLine className="text-destructive size-6" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-foreground text-xl font-semibold">
                    Something went wrong
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    We encountered an unexpected error. Please try again or
                    return to dashboard.
                  </p>
                </div>

                {error.digest && (
                  <p className="text-muted-foreground/70 text-xs tabular-nums">
                    Error ID: {error.digest}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <Button
                    variant="outline"
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

"use client"

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
    <html>
      <body>
        <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center gap-y-6 px-4 text-center">
          {/* Error Icon */}
          <div className="relative flex items-center justify-center">
            <div className="bg-danger/10 absolute size-24 rounded-full blur-xl" />
            <div className="bg-surface ring-border-border-neutral-disable relative flex size-20 items-center justify-center rounded-full ring-1">
              <svg
                className="text-danger size-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <div className="max-w-md space-y-2">
            <h1 className="text-content text-display-xxs">
              Something went wrong
            </h1>
            <p className="text-content-muted">
              We encountered an unexpected error. Please try again or return to
              dashboard.
            </p>
          </div>

          {/* Error ID for debugging */}
          {error.digest && (
            <div className="bg-muted text-foreground-default-disable text-body-xs rounded-md px-3 py-1 tabular-nums select-all">
              Error ID: {error.digest}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="button-secondary"
            >
              <svg
                className="mr-2 size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
              Dashboard
            </button>
            <button onClick={reset} className="button-primary">
              <svg
                className="mr-2 size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

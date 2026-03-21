"use client"

import { useEffect } from "react"

/**
 * Root-level error boundary.
 * Catches errors in the root layout itself.
 * Must include its own <html> and <body> tags.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Root Layout Error:", error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          backgroundColor: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            padding: 32,
            textAlign: "center",
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e5e5",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 24,
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#6b7280",
              margin: "0 0 20px",
              lineHeight: 1.5,
            }}
          >
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                margin: "0 0 16px",
                fontFamily: "monospace",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #e5e5e5",
                background: "#fff",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Dashboard
            </button>
            <button
              onClick={reset}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#18181b",
                color: "#fff",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

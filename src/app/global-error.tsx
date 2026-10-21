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

  // The root layout itself failed, so no CSS: plain inline styles that
  // match the app's dark theme.
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#141414",
          color: "#ededed",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420, padding: 24 }}>
          <div
            style={{
              fontSize: 112,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: "rgba(237,237,237,0.18)",
            }}
          >
            :(
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: "8px 0 8px" }}>
            Aplikasi gagal dimuat
          </h1>
          <p style={{ fontSize: 14, color: "#a1a1a1", margin: 0, lineHeight: 1.6 }}>
            Coba muat ulang. Kalau masih terjadi, kirim kode di bawah ke admin.
          </p>
          {error.digest && (
            <code
              style={{
                display: "inline-block",
                marginTop: 16,
                padding: "4px 8px",
                borderRadius: 6,
                background: "#262626",
                color: "#a1a1a1",
                fontSize: 12,
              }}
            >
              Kode: {error.digest}
            </code>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 32 }}>
            <a
              href="/dashboard"
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #333",
                color: "#ededed",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Ke Dashboard
            </a>
            <button
              onClick={reset}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: 0,
                background: "#4a90d9",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Coba lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

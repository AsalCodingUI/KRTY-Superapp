"use client"

import { interpolate, LOCALE_COOKIE, toLocale } from "@/shared/i18n/config"
import { shell } from "@/shared/i18n/messages/shell"
import { useEffect, useState } from "react"

/** No I18nProvider here (the root layout failed): read the cookie directly. */
function readLocale() {
  if (typeof document === "undefined") return toLocale(null)
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`),
  )
  return toLocale(match?.[1])
}

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
  const [locale] = useState(readLocale)
  const t = shell[locale]
  useEffect(() => {
    console.error("Root Layout Error:", error)
  }, [error])

  // The root layout itself failed, so no CSS: plain inline styles that
  // echo the minimal screens (a frosted card on a pink glow, dark theme).
  return (
    <html lang={locale}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          boxSizing: "border-box",
          background:
            "radial-gradient(ellipse 70% 32% at 50% 50%, rgba(240,90,149,0.55), rgba(92,22,64,0.35) 55%, transparent 80%), #0b0709",
          color: "#ededed",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 512,
            boxSizing: "border-box",
            padding: "56px 40px",
            borderRadius: 24,
            background: "rgba(28,28,28,0.8)",
            backdropFilter: "blur(40px) saturate(1.5)",
            WebkitBackdropFilter: "blur(40px) saturate(1.5)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.06), 0 12px 32px rgba(0,0,0,0.35)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            width={48}
            height={48}
            style={{ borderRadius: 15, display: "block", margin: "0 auto" }}
          />
          <div style={{ marginTop: 24, fontSize: 14, color: "#7a7a7a" }}>
            :(
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              margin: "12px 0",
            }}
          >
            {t.globalErrorTitle}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "#a1a1a1",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {t.globalErrorDescription}
          </p>
          {error.digest && (
            <code
              style={{
                display: "inline-block",
                marginTop: 12,
                padding: "4px 8px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.06)",
                color: "#a1a1a1",
                fontSize: 12,
              }}
            >
              {interpolate(t.errorCode, { code: error.digest })}
            </code>
          )}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <a
              href="/dashboard"
              style={{
                padding: "0 18px",
                height: 40,
                lineHeight: "40px",
                borderRadius: 9999,
                background: "rgba(255,255,255,0.08)",
                color: "#ededed",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              {t.goToDashboard}
            </a>
            <button
              onClick={reset}
              style={{
                padding: "0 18px",
                height: 40,
                borderRadius: 9999,
                border: 0,
                background: "#1f8bff",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {t.tryAgain}
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

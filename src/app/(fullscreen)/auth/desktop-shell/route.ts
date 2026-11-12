import { DESKTOP_SHELL_COOKIE } from "@/shared/lib/desktop-shell"
import { NextResponse } from "next/server"

/**
 * Kretya Flow (Mac or Windows) opens its windows through here: it marks the browser as the
 * app (a cookie the layout reads, so the very first page is already laid
 * out for the app's window) and goes on to the page.
 */
export function GET(request: Request) {
  const url = new URL(request.url)
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || url.origin
  // Same-site paths only (as in /auth/callback).
  const rawNext = url.searchParams.get("next") ?? "/dashboard"
  const next =
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.includes("\\")
      ? rawNext
      : "/dashboard"
  const response = NextResponse.redirect(`${origin}${next}`)
  // The Windows app keeps its own title bar (and the web layout).
  const shell = /Windows/.test(request.headers.get("user-agent") ?? "")
    ? "windows"
    : "mac"
  response.cookies.set(DESKTOP_SHELL_COOKIE, shell, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  return response
}

import { IMPERSONATION_COOKIE_NAME } from "@/shared/lib/impersonation"
import { NextResponse } from "next/server"

/**
 * Leaves "view as" by plain navigation: clears the cookie and lands on the
 * team page. A link, not a fetch, so "Kembali ke akun saya" works even
 * when the page's scripts don't (and in Kretya Flow's WebKit). Clearing
 * one's own view-as needs no rights check.
 */
export function GET() {
  // A relative Location: behind the proxy the request's own URL is the
  // container's address, not the site's.
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/teams", "Cache-Control": "no-store" },
  })
  response.cookies.set(IMPERSONATION_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  })
  return response
}

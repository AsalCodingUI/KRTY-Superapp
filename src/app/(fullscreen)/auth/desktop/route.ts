import { createClient } from "@/shared/api/supabase/server"
import { NextResponse } from "next/server"

/**
 * The desktop app's side of the sign-in (see /desktop/connect): it opens
 * this with the one-time token from the krty:// link, and gets its own
 * session cookies back.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || url.origin
  const token = url.searchParams.get("token")
  // Same-site paths only (as in /auth/callback).
  const rawNext = url.searchParams.get("next") ?? "/desktop"
  const next =
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.includes("\\")
      ? rawNext
      : "/desktop"
  if (token) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: token,
    })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/desktop?error=auth`)
}

import { createClient } from "@/shared/api/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"

  // Use NEXT_PUBLIC_APP_URL to avoid proxy/gateway issues where
  // requestUrl.origin may resolve to an internal address (e.g. localhost:8080)
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(
    `${origin}/login?error=Could not authenticate user`,
  )
}

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    // The `/auth/callback` route is required for the server-side auth flow implemented
    // by the SSR package. It exchanges an auth code for the user's session.
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const next = requestUrl.searchParams.get("next") ?? "/dashboard"

    if (code) {
        const supabase = createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${requestUrl.origin}${next}`)
        }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${requestUrl.origin}/login?error=Could not authenticate user`)
}

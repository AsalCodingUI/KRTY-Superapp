import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { NextResponse } from "next/server"

/**
 * Signs the desktop app in. Google sign-in can't run inside the app's
 * webview, so the app opens this page in the browser: once signed in here,
 * it makes a one-time sign-in token (a magic link that is never emailed)
 * and hands it back to the app over the krty:// link. The app trades it
 * for its own session at /auth/desktop; the browser's session is untouched.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // The middleware sends signed-out visitors to /login first.
  if (!user?.email) return new NextResponse("Unauthorized", { status: 401 })

  const { data, error } = await createAdminClient().auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
  })
  const token = data?.properties?.hashed_token
  if (error || !token)
    return new NextResponse("Could not sign the app in", { status: 500 })

  const link = `krty://auth?token=${encodeURIComponent(token)}`
  // A page rather than a bare redirect: browsers ask before opening an app,
  // and the button is there if the prompt was dismissed.
  return new NextResponse(
    `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kembali ke KRTY</title>
<style>:root{color-scheme:dark}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111;color:#eee;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{text-align:center;padding:24px}p{color:#999;margin:8px 0 24px}a{display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-weight:500}</style></head>
<body><main><h1 style="font-size:20px;font-weight:500;margin:0">Kembali ke app KRTY</h1><p>Kamu sudah masuk. Buka app KRTY untuk melanjutkan.</p><a href="${link}">Buka KRTY</a></main>
<script>location.href=${JSON.stringify(link)}</script></body></html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  )
}

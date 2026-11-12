import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { redirect } from "next/navigation"
import { ConnectView } from "./ConnectView"

export const dynamic = "force-dynamic"
export const metadata = { title: "Kembali ke Kretya Flow" }

/**
 * Signs the desktop app in. Google sign-in can't run inside the app's
 * webview, so the app opens this page in the browser: once signed in here,
 * it makes a one-time sign-in token (a magic link that is never emailed)
 * and hands it back to the app over the krty:// link. The app trades it
 * for its own session at /auth/desktop; the browser's session is untouched.
 */
/** The app's link scheme: krty, or krtydev for a local dev build
 *  (KRTY_SCHEME), so it doesn't hand the sign-in to the installed app. */
const SCHEMES = new Set(["krty", "krtydev"])

export default async function DesktopConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ scheme?: string }>
}) {
  const { scheme: asked } = await searchParams
  const scheme = asked && SCHEMES.has(asked) ? asked : "krty"
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email)
    redirect(
      `/login?next=${encodeURIComponent(
        scheme === "krty"
          ? "/desktop/connect"
          : `/desktop/connect?scheme=${scheme}`,
      )}`,
    )

  const { data } = await createAdminClient().auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
  })
  const token = data?.properties?.hashed_token
  return (
    <ConnectView
      link={
        token ? `${scheme}://auth?token=${encodeURIComponent(token)}` : null
      }
    />
  )
}

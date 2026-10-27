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
export default async function DesktopConnectPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) redirect("/login?next=/desktop/connect")

  const { data } = await createAdminClient().auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
  })
  const token = data?.properties?.hashed_token
  return (
    <ConnectView
      link={token ? `krty://auth?token=${encodeURIComponent(token)}` : null}
    />
  )
}

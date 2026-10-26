import { ContractsPage } from "@/page-slices/contracts/ui/ContractsPage"
import { createClient } from "@/shared/api/supabase/server"
import { getT } from "@/shared/i18n/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { canManageByRole } from "@/shared/lib/roles"

export const dynamic = "force-dynamic"

type ViewerProfile = { id: string; full_name: string | null; role: string }

/** The role decides the view on the server (no client flash or mismatch). */
export default async function ContractsRoute() {
  const supabase = await createClient()
  const t = await getT("leave")
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <div>{t("pleaseLogin")}</div>

  const effectiveUserId = await resolveEffectiveUserId(
    supabase,
    user.id,
    user.email,
  )
  const profile = await resolveProfileByUserIdOrEmail<ViewerProfile>(
    supabase,
    "id, full_name, role",
    effectiveUserId,
    effectiveUserId === user.id ? user.email : null,
  )
  if (!profile) return <div>{t("profileNotFound")}</div>

  return (
    <ContractsPage
      viewer={{
        id: profile.id,
        name: profile.full_name,
        isAdmin: canManageByRole(profile.role),
      }}
    />
  )
}

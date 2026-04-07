import { cookies } from "next/headers"
import { IMPERSONATION_COOKIE_NAME } from "@/shared/lib/impersonation"
import { dedupeProfilesByEmail } from "@/shared/lib/profile-dedupe"

export async function getImpersonationCookieUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value
  return value || null
}

export async function resolveEffectiveUserId(
  supabase: any,
  authUserId: string,
  authEmail?: string | null,
): Promise<string> {
  const { data: directProfile } = await supabase
    .from("profiles")
    .select("id, email, is_super_admin, created_at")
    .eq("id", authUserId)
    .maybeSingle()

  let authProfile = directProfile

  if (!authProfile && authEmail) {
    const { data: emailProfiles } = await supabase
      .from("profiles")
      .select("id, email, is_super_admin, created_at")
      .eq("email", authEmail)

    authProfile =
      dedupeProfilesByEmail(
        (emailProfiles || []) as Array<{
          id: string
          email: string | null
          is_super_admin: boolean | null
          created_at: string | null
        }>,
      )[0] || null
  }

  if (!authProfile?.is_super_admin) {
    return authProfile?.id || authUserId
  }

  const impersonatedUserId = await getImpersonationCookieUserId()

  if (!impersonatedUserId || impersonatedUserId === authProfile.id) {
    return authProfile.id
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", impersonatedUserId)
    .maybeSingle()

  if (!targetProfile?.id) {
    return authProfile.id
  }

  return impersonatedUserId
}

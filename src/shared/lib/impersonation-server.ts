import { cookies } from "next/headers"
import { IMPERSONATION_COOKIE_NAME } from "@/shared/lib/impersonation"

export async function getImpersonationCookieUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value
  return value || null
}

export async function resolveEffectiveUserId(
  supabase: any,
  authUserId: string,
): Promise<string> {
  const { data: authProfile } = await supabase
    .from("profiles")
    .select("id, is_super_admin")
    .eq("id", authUserId)
    .maybeSingle()

  if (!authProfile?.is_super_admin) {
    return authUserId
  }

  const impersonatedUserId = await getImpersonationCookieUserId()

  if (!impersonatedUserId || impersonatedUserId === authUserId) {
    return authUserId
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", impersonatedUserId)
    .maybeSingle()

  if (!targetProfile?.id) {
    return authUserId
  }

  return impersonatedUserId
}

import { headers } from "next/headers"
import { cache } from "react"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { decodeViewer, VIEWER_HEADER } from "@/shared/lib/viewer-context"

/**
 * What middleware worked out for this request (viewer-context.ts), if it
 * is about the signed-in user. Null outside pages (API routes skip it).
 */
export async function getMiddlewareViewer(authUserId: string) {
  const viewer = decodeViewer((await headers()).get(VIEWER_HEADER))
  return viewer?.authUserId === authUserId ? viewer : null
}

/**
 * resolveEffectiveUserId, from middleware's answer when there is one. Its
 * answer can be a few minutes old: viewing as someone is checked again
 * (still a super admin, the person still there), so revoking it takes
 * effect at once, as before.
 */
export const effectiveUserIdFast = cache(async function effectiveUserIdFast(
  supabase: any,
  authUserId: string,
  authEmail?: string | null,
): Promise<string> {
  const viewer = await getMiddlewareViewer(authUserId)
  if (viewer && viewer.effectiveUserId === viewer.canonicalUserId) {
    return viewer.effectiveUserId
  }
  if (viewer) {
    const [{ data: admin }, { data: target }] = await Promise.all([
      supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", viewer.canonicalUserId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id")
        .eq("id", viewer.effectiveUserId)
        .maybeSingle(),
    ])
    if (admin?.is_super_admin === true && target?.id) {
      return viewer.effectiveUserId
    }
  }
  return resolveEffectiveUserId(supabase, authUserId, authEmail)
})

import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import { cache } from "react"

type Db = Awaited<ReturnType<typeof createClient>>

export type AdminContext = { supabase: Db; userId: string }

/**
 * The effective (impersonation-aware) user when they may manage the office
 * (stakeholder), else null. Server-only. Deduped per request (React `cache`)
 * on top of the cached client, `auth.getUser()` and `resolveEffectiveUserId`,
 * so callers can run it in parallel with `getT(...)` freely.
 */
export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const id = await resolveEffectiveUserId(supabase, user.id, user.email)
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", id)
    .maybeSingle()
  return canManageByRole(data?.role) ? { supabase, userId: id } : null
})

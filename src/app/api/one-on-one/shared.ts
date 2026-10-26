import type { createAdminClient } from "@/shared/api/supabase/admin"
import type { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"

type Db = Awaited<ReturnType<typeof createClient>>
type AdminDb = ReturnType<typeof createAdminClient>

export type SlotViewer = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
}

/**
 * Who is asking: the signed-in person, or who a super admin is viewing as
 * (same rule as every other screen). Null when signed out.
 */
export async function slotViewer(supabase: Db): Promise<SlotViewer | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const id = await resolveEffectiveUserId(supabase, user.id, user.email)
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", id)
    .maybeSingle()
  return (data as SlotViewer | null) ?? null
}

/** "2026-Q4": the WIB quarter a slot starts in. */
export function slotQuarter(startAt: Date) {
  const local = new Date(startAt.getTime() + 7 * 60 * 60 * 1000)
  return `${local.getUTCFullYear()}-Q${Math.floor(local.getUTCMonth() / 3) + 1}`
}

/** Whether the organizer already has a (not cancelled) slot in that time. */
export async function overlapsOtherSlot(
  admin: AdminDb,
  organizerId: string,
  start: string,
  end: string,
  exceptId?: string,
) {
  let query = admin
    .from("one_on_one_slots")
    .select("id", { count: "exact", head: true })
    .eq("organizer_id", organizerId)
    .neq("status", "cancelled")
    .lt("start_at", end)
    .gt("end_at", start)
  if (exceptId) query = query.neq("id", exceptId)
  const { count } = await query
  return (count ?? 0) > 0
}

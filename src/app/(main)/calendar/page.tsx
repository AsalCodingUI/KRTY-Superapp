import CalendarClient from "@/app/(main)/calendar/CalendarClient"

import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"

export const dynamic = "force-dynamic"

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const effectiveUserId = await resolveEffectiveUserId(supabase, user.id)

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", effectiveUserId)
    .single()

  const role = profile?.role || "employee"

  return <CalendarClient role={role} userId={effectiveUserId} />
}

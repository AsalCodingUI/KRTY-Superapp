import CalendarClient, {
  type CalendarScope,
} from "@/app/(main)/calendar/CalendarClient"

import { createClient } from "@/shared/api/supabase/server"
import { accessLevel } from "@/shared/config/access"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"

/** Both calendars: /calendar (project) and /calendar/personal/<view>. */
export async function renderCalendar(scope: CalendarScope) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const effectiveUserId = await resolveEffectiveUserId(
    supabase,
    user.id,
    user.email,
  )

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, job_title")
    .eq("id", effectiveUserId)
    .single()

  return (
    <CalendarClient
      scope={scope}
      level={accessLevel(profile)}
      userId={effectiveUserId}
    />
  )
}

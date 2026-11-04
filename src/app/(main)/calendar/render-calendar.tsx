import CalendarClient, {
  type CalendarScope,
} from "@/app/(main)/calendar/CalendarClient"

import { createClient } from "@/shared/api/supabase/server"
import { accessLevel } from "@/shared/config/access"
import {
  effectiveUserIdFast,
  getMiddlewareViewer,
} from "@/shared/lib/viewer-context-server"

/** Both calendars: /calendar (project) and /calendar/personal/<view>. */
export async function renderCalendar(scope: CalendarScope) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Middleware already knows the level (it gates the page with it); the
  // profile is only read when it didn't pass it on.
  const [viewer, effectiveUserId] = await Promise.all([
    getMiddlewareViewer(user.id),
    effectiveUserIdFast(supabase, user.id, user.email),
  ])
  const level =
    viewer?.effectiveUserId === effectiveUserId
      ? viewer.level
      : accessLevel(
          (
            await supabase
              .from("profiles")
              .select("role, job_title")
              .eq("id", effectiveUserId)
              .single()
          ).data,
        )

  return <CalendarClient scope={scope} level={level} userId={effectiveUserId} />
}

import CalendarClient from "@/app/(main)/calendar/CalendarClient"

import { createClient } from "@/shared/api/supabase/server"
import { accessLevel } from "@/shared/config/access"
import {
  effectiveUserIdFast,
  getMiddlewareViewer,
} from "@/shared/lib/viewer-context-server"

/** The calendar: /calendar and /calendar/<view>. */
export async function renderCalendar() {
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

  return <CalendarClient level={level} userId={effectiveUserId} />
}

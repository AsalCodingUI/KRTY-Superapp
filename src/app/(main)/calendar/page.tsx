import CalendarClient from "@/app/(main)/calendar/CalendarClient"

import { createClient } from "@/shared/api/supabase/server"

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Determine roles
  // Logic from sidebar or similar:
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single()

  const role = profile?.role || "employee"

  return <CalendarClient role={role} userId={user?.id ?? null} />
}

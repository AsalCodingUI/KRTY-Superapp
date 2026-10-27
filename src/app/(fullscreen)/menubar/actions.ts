"use server"

import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { canManageByRole } from "@/shared/lib/roles"

/**
 * For the menu bar preview only: someone else's unread notifications, so
 * an admin can see the popover from that person's point of view. Admins
 * only (notifications are private by RLS, so this reads with the admin
 * client); read-only.
 */
export async function getPreviewNotifications(userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  if (!canManageByRole(me?.role)) return null

  const { data, count } = await createAdminClient()
    .from("notifications")
    .select("id, title, message, type, created_at, is_read", {
      count: "exact",
    })
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(6)
  return { list: data ?? [], unread: count ?? 0 }
}

/** The people an admin can preview the popover as. */
export async function getPreviewPeople() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["employee", "stakeholder"])
    .order("full_name")
  return (data ?? []) as {
    id: string
    full_name: string | null
    role: string | null
  }[]
}

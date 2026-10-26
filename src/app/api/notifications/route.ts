import { getT } from "@/shared/i18n/server"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const markReadSchema = z.object({
  id: z.string().uuid().optional(),
  markAll: z.boolean().optional(),
})

/**
 * Whose notifications: the signed-in person's, or, while a super admin
 * views the app as someone, that person's (the same rule as every other
 * "view as" read).
 */
async function getCanonicalProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, profile: null, viewingAs: false }
  }

  const profile = await resolveProfileByUserIdOrEmail<{
    id: string
    email: string | null
  }>(supabase, "id, email, created_at", user.id, user.email)
  if (!profile) return { user, profile: null, viewingAs: false }

  const effectiveId = await resolveEffectiveUserId(
    supabase,
    user.id,
    user.email,
  )
  return {
    user,
    profile:
      effectiveId === profile.id ? profile : { ...profile, id: effectiveId },
    // Viewing as someone is read-only: their rows aren't marked or removed.
    viewingAs: effectiveId !== profile.id,
  }
}

export async function GET() {
  const t = await getT("api")
  try {
    const { user, profile } = await getCanonicalProfile()
    if (!user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }
    if (!profile) {
      return NextResponse.json({ error: t("profileNotFound") }, { status: 404 })
    }

    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      // Polled every minute by the top bar: cap the payload to recent history.
      .limit(200)

    if (error) {
      throw error
    }

    // The badge counts every unread one, not only those in the list.
    const { count } = await adminSupabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("is_read", false)

    return NextResponse.json({
      notifications: data || [],
      unreadCount: count ?? null,
    })
  } catch (error) {
    console.error("Notifications GET error", error)
    return NextResponse.json(
      { error: t("notificationsFetchFailed") },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  const t = await getT("api")
  try {
    const { user, profile, viewingAs } = await getCanonicalProfile()
    if (!user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }
    if (!profile) {
      return NextResponse.json({ error: t("profileNotFound") }, { status: 404 })
    }

    if (viewingAs) return NextResponse.json({ success: true })

    const rawBody = await request.json().catch(() => null)
    const parsed = markReadSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: t("invalidPayload") }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    let query = adminSupabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id)

    if (parsed.data.markAll) {
      query = query.eq("is_read", false)
    } else if (parsed.data.id) {
      query = query.eq("id", parsed.data.id)
    } else {
      return NextResponse.json(
        { error: t("notificationIdRequired") },
        { status: 400 },
      )
    }

    const { error } = await query
    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications PATCH error", error)
    return NextResponse.json(
      { error: t("notificationsUpdateFailed") },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  const t = await getT("api")
  try {
    const { user, profile, viewingAs } = await getCanonicalProfile()
    if (!user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }
    if (!profile) {
      return NextResponse.json({ error: t("profileNotFound") }, { status: 404 })
    }

    if (viewingAs) return NextResponse.json({ success: true })

    const id = new URL(request.url).searchParams.get("id")
    if (!id) {
      return NextResponse.json(
        { error: t("notificationIdRequired") },
        { status: 400 },
      )
    }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", profile.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications DELETE error", error)
    return NextResponse.json(
      { error: t("notificationDeleteFailed") },
      { status: 500 },
    )
  }
}

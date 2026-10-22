import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const markReadSchema = z.object({
  id: z.string().uuid().optional(),
  markAll: z.boolean().optional(),
})

async function getCanonicalProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, profile: null }
  }

  const profile = await resolveProfileByUserIdOrEmail<{
    id: string
    email: string | null
  }>(supabase, "id, email, created_at", user.id, user.email)

  return { user, profile }
}

export async function GET() {
  try {
    const { user, profile } = await getCanonicalProfile()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
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

    return NextResponse.json({ notifications: data || [] })
  } catch (error) {
    console.error("Notifications GET error", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, profile } = await getCanonicalProfile()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const rawBody = await request.json().catch(() => null)
    const parsed = markReadSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
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
      return NextResponse.json({ error: "Notification id required" }, { status: 400 })
    }

    const { error } = await query
    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications PATCH error", error)
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, profile } = await getCanonicalProfile()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const id = new URL(request.url).searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Notification id required" }, { status: 400 })
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
      { error: "Failed to delete notification" },
      { status: 500 },
    )
  }
}

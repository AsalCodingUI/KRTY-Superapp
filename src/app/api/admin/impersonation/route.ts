import { createClient } from "@/shared/api/supabase/server"
import { IMPERSONATION_COOKIE_NAME } from "@/shared/lib/impersonation"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const actorProfile = await resolveProfileByUserIdOrEmail<{
      id: string
      email: string | null
      is_super_admin: boolean | null
    }>(supabase, "id, email, is_super_admin, created_at", user.id, user.email)

    if (!actorProfile?.is_super_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const targetUserId = typeof body?.userId === "string" ? body.userId : null

    const response = NextResponse.json({ success: true })

    // Clear impersonation mode
    if (!targetUserId || targetUserId === actorProfile.id) {
      response.cookies.set(IMPERSONATION_COOKIE_NAME, "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
      })
      return response
    }

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", targetUserId)
      .maybeSingle()

    if (!targetProfile?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    response.cookies.set(IMPERSONATION_COOKIE_NAME, targetUserId, {
      path: "/",
      maxAge: 60 * 60 * 8,
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Impersonation API error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

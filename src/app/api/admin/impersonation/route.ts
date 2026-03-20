import { createClient } from "@/shared/api/supabase/server"
import { IMPERSONATION_COOKIE_NAME } from "@/shared/lib/impersonation"
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

    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("id, is_super_admin")
      .eq("id", user.id)
      .maybeSingle()

    if (!actorProfile?.is_super_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const targetUserId = typeof body?.userId === "string" ? body.userId : null

    const response = NextResponse.json({ success: true })

    // Clear impersonation mode
    if (!targetUserId || targetUserId === user.id) {
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

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { canManageByRole } from "@/shared/lib/roles"
import { logError } from "@/shared/lib/utils/logger"
import { guardApiRoute } from "@/shared/lib/utils/security"

export async function GET(request: NextRequest) {
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await resolveProfileByUserIdOrEmail<{
      id: string
      email: string | null
      role: string | null
    }>(supabase, "id, email, role, created_at", user.id, user.email)

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const isAdmin = canManageByRole(profile?.role)
    const { searchParams } = new URL(request.url)
    const cycle = searchParams.get("cycle")
    const adminSupabase = createAdminClient()

    let query = adminSupabase
      .from("one_on_one_slots")
      .select(
        `
        *,
        organizer:profiles!organizer_id(id, full_name, email),
        booked_by_profile:profiles!booked_by(id, full_name, email)
      `,
      )
      .order("start_at", { ascending: true })

    if (cycle && /^\d{4}-All$/.test(cycle)) {
      query = query.like("cycle_name", `${cycle.slice(0, 4)}-%`)
    } else if (cycle) {
      query = query.eq("cycle_name", cycle)
    }

    if (!isAdmin) {
      query = query.or(`status.eq.open,booked_by.eq.${profile.id}`)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ slots: data ?? [] })
  } catch (error) {
    logError("Failed to fetch one-on-one slots:", error)
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await resolveProfileByUserIdOrEmail<{
      id: string
      email: string | null
      role: string | null
    }>(supabase, "id, email, role, created_at", user.id, user.email)

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (!canManageByRole(profile?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { mode, location, slots } = body as {
      cycle?: string
      mode: "online" | "offline"
      location?: string
      slots: Array<{
        date: string
        startTime: string
        endTime: string
        startAt?: string
        endAt?: string
      }>
    }

    if (!mode || !slots?.length) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
    }

    const payload = slots.map((slot) => {
      const startAt = slot.startAt
        ? new Date(slot.startAt)
        : new Date(`${slot.date}T${slot.startTime}`)
      const endAt = slot.endAt
        ? new Date(slot.endAt)
        : new Date(`${slot.date}T${slot.endTime}`)
      // The slot belongs to the quarter of its date, not the page filter.
      const local = new Date(startAt.getTime() + 7 * 60 * 60 * 1000)
      const quarter = `${local.getUTCFullYear()}-Q${Math.floor(local.getUTCMonth() / 3) + 1}`

      return {
        cycle_name: quarter,
        organizer_id: profile.id,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        mode,
        location: mode === "offline" ? (location ?? null) : null,
        status: "open",
      }
    })

    const invalid = payload.some(
      (slot) =>
        Number.isNaN(new Date(slot.start_at).getTime()) ||
        new Date(slot.end_at) <= new Date(slot.start_at) ||
        new Date(slot.start_at).getTime() < Date.now() - 60_000,
    )
    if (invalid) {
      return NextResponse.json({ error: "invalid_time" }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from("one_on_one_slots")
      .insert(payload)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logError("Failed to create one-on-one slots:", error)
    return NextResponse.json({ error: "create_failed" }, { status: 500 })
  }
}

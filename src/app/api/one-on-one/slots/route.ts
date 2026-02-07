import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/shared/api/supabase/server"
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single()

    const isAdmin = canManageByRole(profile?.role)
    const { searchParams } = new URL(request.url)
    const cycle = searchParams.get("cycle")

    let query = supabase
      .from("one_on_one_slots")
      .select(
        `
        *,
        organizer:profiles!organizer_id(id, full_name, email),
        booked_by_profile:profiles!booked_by(id, full_name, email)
      `,
      )
      .order("start_at", { ascending: true })

    if (cycle) {
      query = query.eq("cycle_name", cycle)
    }

    if (!isAdmin) {
      query = query.or(
        `status.eq.open,booked_by.eq.${user.id}`,
      )
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single()

    if (!canManageByRole(profile?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { cycle, mode, location, slots } = body as {
      cycle: string
      mode: "online" | "offline"
      location?: string
      slots: Array<{ date: string; startTime: string; endTime: string }>
    }

    if (!cycle || !mode || !slots?.length) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
    }

    const payload = slots.map((slot) => {
      const startAt = new Date(`${slot.date}T${slot.startTime}`)
      const endAt = new Date(`${slot.date}T${slot.endTime}`)

      return {
        cycle_name: cycle,
        organizer_id: user.id,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        mode,
        location: mode === "offline" ? location ?? null : null,
        status: "open",
      }
    })

    const { error } = await supabase
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

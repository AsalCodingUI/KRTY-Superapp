import { getT } from "@/shared/i18n/server"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { canManageByRole } from "@/shared/lib/roles"
import { logError } from "@/shared/lib/utils/logger"
import { guardApiRoute } from "@/shared/lib/utils/security"
import { overlapsOtherSlot, slotQuarter, slotViewer } from "../shared"

export async function GET(request: NextRequest) {
  const t = await getT("api")
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const supabase = await createClient()
    const profile = await slotViewer(supabase)
    if (!profile) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }

    const isAdmin = canManageByRole(profile.role)
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

    // ?user=<id>: one person's own sessions, for a stakeholder looking at
    // their KPI page (read-only). Nobody else may ask for someone else's.
    const forUser = searchParams.get("user")
    if (forUser) {
      if (!isAdmin) {
        return NextResponse.json({ error: t("forbidden") }, { status: 403 })
      }
      if (!/^[0-9a-f-]{36}$/i.test(forUser)) {
        return NextResponse.json({ error: "invalid_user" }, { status: 400 })
      }
      query = query.eq("booked_by", forUser)
    } else if (!isAdmin) {
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
  const t = await getT("api")
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const supabase = await createClient()
    const profile = await slotViewer(supabase)
    if (!profile) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }

    if (!canManageByRole(profile.role)) {
      return NextResponse.json({ error: t("forbidden") }, { status: 403 })
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
      return {
        // The slot belongs to the quarter of its date, not the page filter.
        cycle_name: slotQuarter(startAt),
        organizer_id: profile.id,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        mode,
        location:
          mode === "offline" ? location?.trim().slice(0, 120) || null : null,
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
    // One organizer can't hold two 1:1s at once.
    const clash =
      payload.some((a, i) =>
        payload.some(
          (b, j) => i !== j && a.start_at < b.end_at && b.start_at < a.end_at,
        ),
      ) ||
      (
        await Promise.all(
          payload.map((slot) =>
            overlapsOtherSlot(
              adminSupabase,
              profile.id,
              slot.start_at,
              slot.end_at,
            ),
          ),
        )
      ).some(Boolean)
    if (clash) {
      return NextResponse.json({ error: "slot_overlap" }, { status: 409 })
    }

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

import { getT } from "@/shared/i18n/server"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { calculateBusinessDays } from "@/shared/lib/date"
import {
  ANNUAL_LEAVE_MAX_DAYS,
  ANNUAL_LEAVE_MIN_NOTICE_DAYS,
  annualLeaveSummary,
} from "@/shared/lib/leave"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { NextRequest, NextResponse } from "next/server"
import { differenceInCalendarDays, startOfDay } from "date-fns"
import { z } from "zod"

const requestSchema = z.object({
  id: z.number().optional(),
  start_date: z.string(),
  end_date: z.string(),
  leave_type: z.string().min(1),
  reason: z.string().nullable().optional(),
  proof_url: z.string().nullable().optional(),
  // Ignored: employees can't set their own status. New and edited requests
  // are always "pending" until a stakeholder reviews them.
  status: z.string().optional(),
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

/**
 * Server-side annual-leave rules (the form checks the same, but the API is
 * the one that can't be bypassed). Returns an error message or null.
 */
async function checkAnnualLeave(
  t: Awaited<ReturnType<typeof getT<"api">>>,
  adminSupabase: ReturnType<typeof createAdminClient>,
  userId: string,
  startDate: string,
  endDate: string,
  excludeId?: number,
): Promise<string | null> {
  const start = startOfDay(new Date(startDate))
  const end = startOfDay(new Date(endDate))
  if (end < start) return t("leaveEndBeforeStart")
  const requested = calculateBusinessDays(start, end)
  if (requested <= 0) return t("leaveNoBusinessDays")
  if (
    differenceInCalendarDays(start, startOfDay(new Date())) <
    ANNUAL_LEAVE_MIN_NOTICE_DAYS
  )
    return t("leaveMinNotice", { days: ANNUAL_LEAVE_MIN_NOTICE_DAYS })
  if (requested > ANNUAL_LEAVE_MAX_DAYS)
    return t("leaveMaxDays", { days: ANNUAL_LEAVE_MAX_DAYS })

  const year = start.getFullYear()
  let approvedQuery = adminSupabase
    .from("leave_requests")
    .select("start_date,end_date")
    .eq("user_id", userId)
    .eq("status", "approved")
    .eq("leave_type", "Annual Leave")
    .lte("start_date", `${year}-12-31`)
    .gte("end_date", `${year}-01-01`)
  if (excludeId) approvedQuery = approvedQuery.neq("id", excludeId)

  const [{ data: approved, error }, { data: employment }] = await Promise.all([
    approvedQuery,
    adminSupabase
      .from("profiles")
      .select("join_date, employment_type")
      .eq("id", userId)
      .maybeSingle(),
  ])
  if (error) throw error

  const summary = annualLeaveSummary(approved ?? [], year, employment ?? {})
  if (!summary.eligible) {
    if (!summary.noteKey) return t("leaveNotEligible")
    const tLeave = await getT("leave")
    return tLeave(summary.noteKey, summary.noteVars)
  }
  if (requested > summary.remaining)
    return t("leaveQuotaExceeded", {
      remaining: summary.remaining,
      quota: summary.quota,
    })
  return null
}

export async function POST(request: NextRequest) {
  const t = await getT("api")
  try {
    const { user, profile } = await getCanonicalProfile()
    if (!user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }
    if (!profile) {
      return NextResponse.json({ error: t("profileNotFound") }, { status: 404 })
    }

    const rawBody = await request.json().catch(() => null)
    const parsed = requestSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: t("invalidRequest") }, { status: 400 })
    }

    const payload = {
      user_id: profile.id,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      leave_type: parsed.data.leave_type,
      reason: parsed.data.reason || null,
      proof_url: parsed.data.proof_url || null,
      status: "pending" as const,
    }

    const adminSupabase = createAdminClient()
    if (payload.leave_type === "Annual Leave") {
      const problem = await checkAnnualLeave(
        t,
        adminSupabase,
        profile.id,
        payload.start_date,
        payload.end_date,
      )
      if (problem) {
        return NextResponse.json({ error: problem }, { status: 422 })
      }
    }
    const { data, error } = await adminSupabase
      .from("leave_requests")
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Leave request create error", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : t("leaveSubmitFailed"),
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  const t = await getT("api")
  try {
    const { user, profile } = await getCanonicalProfile()
    if (!user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }
    if (!profile) {
      return NextResponse.json({ error: t("profileNotFound") }, { status: 404 })
    }

    const rawBody = await request.json().catch(() => null)
    const parsed = requestSchema.safeParse(rawBody)
    if (!parsed.success || !parsed.data.id) {
      return NextResponse.json({ error: t("invalidRequest") }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const { data: existing, error: existingError } = await adminSupabase
      .from("leave_requests")
      .select("id, user_id, status")
      .eq("id", parsed.data.id)
      .maybeSingle()

    if (existingError) throw existingError
    if (!existing || existing.user_id !== profile.id) {
      return NextResponse.json(
        { error: t("leaveRequestNotFound") },
        { status: 404 },
      )
    }
    if (existing.status === "approved") {
      return NextResponse.json(
        { error: t("leaveApprovedLocked") },
        { status: 409 },
      )
    }

    const payload = {
      user_id: profile.id,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      leave_type: parsed.data.leave_type,
      reason: parsed.data.reason || null,
      proof_url: parsed.data.proof_url || null,
      status: "pending" as const,
    }

    if (payload.leave_type === "Annual Leave") {
      const problem = await checkAnnualLeave(
        t,
        adminSupabase,
        profile.id,
        payload.start_date,
        payload.end_date,
        parsed.data.id,
      )
      if (problem) {
        return NextResponse.json({ error: problem }, { status: 422 })
      }
    }

    const { data, error } = await adminSupabase
      .from("leave_requests")
      // Resubmitting clears the previous reviewer note.
      .update({ ...payload, review_note: null })
      .eq("id", parsed.data.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Leave request update error", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : t("leaveUpdateFailed"),
      },
      { status: 500 },
    )
  }
}

const cancelSchema = z.object({ id: z.number() })

/**
 * DELETE /api/leave/requests — cancel your own request while it is still
 * pending (employees can't delete rows directly under RLS).
 */
export async function DELETE(request: NextRequest) {
  const t = await getT("api")
  try {
    const { user, profile } = await getCanonicalProfile()
    if (!user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }
    if (!profile) {
      return NextResponse.json({ error: t("profileNotFound") }, { status: 404 })
    }

    const parsed = cancelSchema.safeParse(
      await request.json().catch(() => null),
    )
    if (!parsed.success) {
      return NextResponse.json({ error: t("invalidRequest") }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const { data: existing, error: existingError } = await adminSupabase
      .from("leave_requests")
      .select("id, user_id, status")
      .eq("id", parsed.data.id)
      .maybeSingle()
    if (existingError) throw existingError
    if (!existing || existing.user_id !== profile.id) {
      return NextResponse.json(
        { error: t("leaveRequestNotFound") },
        { status: 404 },
      )
    }
    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: t("leaveOnlyPendingCancel") },
        { status: 409 },
      )
    }

    const { error } = await adminSupabase
      .from("leave_requests")
      .delete()
      .eq("id", parsed.data.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Leave request cancel error", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : t("leaveCancelFailed"),
      },
      { status: 500 },
    )
  }
}

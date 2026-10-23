import { createClient } from "@/shared/api/supabase/server"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { Database } from "@/shared/types/database.types"
import { getT } from "@/shared/i18n/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

type AuthT = Awaited<ReturnType<typeof getT<"auth">>>

const createTeamMemberSchema = (t: AuthT) =>
  z.object({
    full_name: z.string().trim().min(2, t("apiFullNameRequired")),
    email: z.string().trim().email(t("apiInvalidEmail")),
    role: z.enum(["stakeholder", "employee"]),
    job_title: z.enum([
      "Admin",
      "Project Manager",
      "Designer",
      "Web Developer",
    ]),
    hourly_rate: z.union([z.number(), z.null()]).optional(),
    team_id: z.string().uuid().nullable().optional(),
  })

function getNextKrtId(krtIds: Array<string | null>) {
  const nextNumber =
    krtIds.reduce((max, current) => {
      const numericPart = Number.parseInt(
        (current || "").replace(/[^0-9]/g, ""),
        10,
      )

      if (Number.isNaN(numericPart)) return max
      return Math.max(max, numericPart)
    }, 0) + 1

  return `KRT_${nextNumber}`
}

export async function POST(request: NextRequest) {
  const t = await getT("auth")
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: t("apiUnauthorized") }, { status: 401 })
    }

    const actorProfile = await resolveProfileByUserIdOrEmail<{
      id: string
      email: string | null
      is_super_admin: boolean | null
    }>(supabase, "id, email, is_super_admin, created_at", user.id, user.email)

    if (!actorProfile?.is_super_admin) {
      return NextResponse.json({ error: t("apiForbidden") }, { status: 403 })
    }

    const rawBody = await request.json().catch(() => null)
    const parsed = createTeamMemberSchema(t).safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || t("apiInvalidPayload") },
        { status: 400 },
      )
    }

    const adminSupabase = createAdminClient()
    const payload = parsed.data
    const normalizedEmail = payload.email.toLowerCase()

    const { data: existingProfile, error: existingError } = await adminSupabase
      .from("profiles")
      .select(
        "id, full_name, email, role, job_title, avatar_url, hourly_rate, krt_id, team_id, is_super_admin",
      )
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existingProfile?.id) {
      return NextResponse.json(
        {
          error: t("apiMemberEmailExists"),
          code: "PROFILE_ALREADY_EXISTS",
          data: existingProfile,
        },
        { status: 409 },
      )
    }

    const { data: krtRows, error: krtError } = await adminSupabase
      .from("profiles")
      .select("krt_id")

    if (krtError) {
      throw krtError
    }

    const insertPayload: Database["public"]["Tables"]["profiles"]["Insert"] = {
      id: crypto.randomUUID(),
      krt_id: getNextKrtId((krtRows || []).map((row) => row.krt_id)),
      full_name: payload.full_name,
      email: normalizedEmail,
      role: payload.role,
      job_title: payload.job_title,
      hourly_rate: payload.hourly_rate ?? null,
      team_id: payload.team_id ?? null,
    }

    const { data: createdProfile, error: createError } = await adminSupabase
      .from("profiles")
      .insert(insertPayload)
      .select(
        "id, full_name, email, role, job_title, avatar_url, hourly_rate, krt_id, team_id, is_super_admin, leave_balance, leave_used, manager_id, created_at, updated_at, monthly_salary",
      )
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json({ success: true, data: createdProfile })
  } catch (error) {
    console.error("Create team member API error", error)
    return NextResponse.json(
      { error: t("apiCreateMemberFailed") },
      { status: 500 },
    )
  }
}

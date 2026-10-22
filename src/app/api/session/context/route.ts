import { createClient } from "@/shared/api/supabase/server"
import { IMPERSONATION_COOKIE_NAME } from "@/shared/lib/impersonation"
import { mergeDuplicateProfiles } from "@/shared/lib/profile-dedupe"
import { cookies } from "next/headers"

type ProfileRow = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  job_title: string | null
  krt_id: string | null
  hourly_rate: number | null
  team_id: string | null
  is_super_admin: boolean | null
  created_at?: string | null
}

type PermissionRow = {
  page_slug: string
  granted: boolean
}

const PROFILE_SELECT =
  "id, full_name, email, role, job_title, krt_id, team_id, is_super_admin, created_at"

export async function GET() {
  const supabase = await createClient()
  const cookieStore = await cookies()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({
      profile: null,
      authProfile: null,
      userEmail: null,
      permissions: null,
      isImpersonating: false,
    })
  }

  // By-id and by-email lookups are independent: run them together. The email
  // rows also serve as the duplicate-profile check below.
  const [
    { data: authProfileData, error: authProfileError },
    { data: profilesByEmail, error: emailLookupError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", user.id)
      .maybeSingle(),
    user.email
      ? supabase
          .from("profiles")
          .select(PROFILE_SELECT)
          .eq("email", user.email)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as ProfileRow[], error: null }),
  ])

  if (authProfileError && authProfileError.code !== "PGRST116") {
    console.error(
      "Session context auth profile lookup failed:",
      authProfileError,
    )
  }
  if (emailLookupError && emailLookupError.code !== "PGRST116") {
    console.error(
      "Session context email profile lookup failed:",
      emailLookupError,
    )
  }

  let authProfile = (authProfileData as ProfileRow | null) || null

  if (!authProfile) {
    if ((profilesByEmail || []).length === 1) {
      authProfile = profilesByEmail?.[0] as ProfileRow
    } else if ((profilesByEmail || []).length > 1) {
      authProfile = mergeDuplicateProfiles(
        profilesByEmail as ProfileRow[],
      ) as ProfileRow
    }
  }

  if (!authProfile) {
    return Response.json({
      profile: null,
      authProfile: null,
      userEmail: user.email || null,
      permissions: null,
      isImpersonating: false,
    })
  }

  if (authProfile.email) {
    const duplicateProfiles =
      authProfile.email === user.email
        ? profilesByEmail
        : (
            await supabase
              .from("profiles")
              .select(PROFILE_SELECT)
              .eq("email", authProfile.email)
          ).data

    if ((duplicateProfiles || []).length > 1) {
      authProfile = mergeDuplicateProfiles(
        duplicateProfiles as ProfileRow[],
      ) as ProfileRow
    }
  }

  const impersonatedUserId =
    cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value || null
  const shouldImpersonate = Boolean(
    authProfile.is_super_admin === true &&
    impersonatedUserId &&
    impersonatedUserId !== authProfile.id,
  )

  const loadPermissions = (userId: string) =>
    supabase
      .from("user_page_permissions")
      .select("page_slug, granted")
      .eq("user_id", userId)

  let effectiveProfile = authProfile
  let permissionResult

  if (shouldImpersonate) {
    // Fetch the target and its permissions together; fall back to the real
    // user's permissions only if the target doesn't exist.
    const [{ data: impersonatedProfile }, impersonatedPermissions] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(PROFILE_SELECT)
          .eq("id", impersonatedUserId)
          .maybeSingle(),
        loadPermissions(impersonatedUserId as string),
      ])

    if (impersonatedProfile) {
      effectiveProfile = impersonatedProfile as ProfileRow
      permissionResult = impersonatedPermissions
    } else {
      permissionResult = await loadPermissions(authProfile.id)
    }
  } else {
    permissionResult = await loadPermissions(authProfile.id)
  }

  const { data: permissionRows, error: permissionError } = permissionResult

  if (permissionError) {
    console.error("Session context permission lookup failed:", permissionError)
  }

  const normalizedPermissionRows = (permissionRows || []) as PermissionRow[]

  const permissions =
    normalizedPermissionRows.length > 0
      ? Object.fromEntries(
          normalizedPermissionRows.map((row) => [row.page_slug, row.granted]),
        )
      : null

  return Response.json({
    profile: effectiveProfile,
    authProfile,
    userEmail: user.email || null,
    permissions,
    isImpersonating:
      shouldImpersonate && effectiveProfile.id !== authProfile.id,
  })
}

import { createClient } from "@/shared/api/supabase/server"
import type { SessionContextResponse } from "@/shared/hooks/useSessionContext"
import { IMPERSONATION_COOKIE_NAME } from "@/shared/lib/impersonation"
import { mergeDuplicateProfiles } from "@/shared/lib/profile-dedupe"
import { cookies } from "next/headers"
import { cache } from "react"

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
  avatar_url: string | null
  created_at?: string | null
}

const PROFILE_SELECT =
  "id, full_name, email, role, job_title, krt_id, team_id, is_super_admin, avatar_url, created_at"

/**
 * Who is signed in and whose view they see (the ["session-context"] query).
 * The app layout resolves it on the server and seeds the query, so the shell
 * doesn't wait for a browser fetch; /api/session/context serves refetches.
 */
export const getSessionContext = cache(
  async function getSessionContext(): Promise<SessionContextResponse> {
    const supabase = await createClient()
    const cookieStore = await cookies()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        profile: null,
        authProfile: null,
        userEmail: null,
        isImpersonating: false,
      }
    }

    const impersonatedUserId =
      cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value || null

    // By-id and by-email lookups are independent: run them together. The
    // email rows also serve as the duplicate-profile check below. The
    // viewed-as profile comes along too; it's used only if the checks below
    // allow it.
    const [
      { data: authProfileData, error: authProfileError },
      { data: profilesByEmail, error: emailLookupError },
      { data: impersonatedProfile },
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
      impersonatedUserId
        ? supabase
            .from("profiles")
            .select(PROFILE_SELECT)
            .eq("id", impersonatedUserId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
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
      return {
        profile: null,
        authProfile: null,
        userEmail: user.email || null,
        isImpersonating: false,
      }
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

    const shouldImpersonate = Boolean(
      authProfile.is_super_admin === true &&
      impersonatedUserId &&
      impersonatedUserId !== authProfile.id,
    )

    let effectiveProfile = authProfile

    if (shouldImpersonate && impersonatedProfile) {
      effectiveProfile = impersonatedProfile as ProfileRow
    }

    return {
      profile: effectiveProfile,
      authProfile,
      userEmail: user.email || null,
      isImpersonating:
        shouldImpersonate && effectiveProfile.id !== authProfile.id,
    } as SessionContextResponse
  },
)

// src/hooks/useUserProfile.ts
"use client"

import { createClient as createClientBrowser } from "@/shared/api/supabase/client"
import { IMPERSONATION_COOKIE_NAME } from "@/shared/lib/impersonation"
import { mergeDuplicateProfiles } from "@/shared/lib/profile-dedupe"
import { canManageByRole } from "@/shared/lib/roles"
import { Database } from "@/shared/types/database.types"
import { useQuery, useQueryClient } from "@tanstack/react-query"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

// Subset of Profile fields that we actually fetch
export type ProfileSubset = Pick<
  Profile,
  | "id"
  | "full_name"
  | "email"
  | "role"
  | "job_title"
  | "krt_id"
  | "hourly_rate"
  | "team_id"
  | "is_super_admin"
>

type UserProfileResponse = {
  profile: ProfileSubset | null
  authProfile: ProfileSubset | null
  userEmail: string | null
  isImpersonating: boolean
}

const PROFILE_SELECT =
  "id, full_name, email, role, job_title, krt_id, hourly_rate, team_id, is_super_admin, created_at"

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))

  if (!match) return null
  return decodeURIComponent(match.split("=").slice(1).join("=")) || null
}

const fetchUserProfile = async (): Promise<UserProfileResponse> => {
  const supabase = createClientBrowser()

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

  const { data: authProfileData, error: profileError } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle()

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Client fetch failed:", profileError)
  }

  let authProfile = authProfileData || null

  if (!authProfile && user.email) {
    const { data: profilesByEmail, error: emailLookupError } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("email", user.email)
      .order("created_at", { ascending: true })

    if (emailLookupError && emailLookupError.code !== "PGRST116") {
      console.error("Client email profile lookup failed:", emailLookupError)
    }

    if ((profilesByEmail || []).length === 1) {
      authProfile = profilesByEmail?.[0] as ProfileSubset
    } else if ((profilesByEmail || []).length > 1) {
      authProfile = mergeDuplicateProfiles(
        profilesByEmail as ProfileSubset[],
      ) as ProfileSubset
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
    const { data: duplicateProfiles } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("email", authProfile.email)

    if ((duplicateProfiles || []).length > 1) {
      authProfile = mergeDuplicateProfiles(
        duplicateProfiles as ProfileSubset[],
      ) as ProfileSubset
    }
  }

  const impersonatedUserId = getCookieValue(IMPERSONATION_COOKIE_NAME)
  const canImpersonate = authProfile.is_super_admin === true
  const shouldImpersonate = Boolean(
    canImpersonate && impersonatedUserId && impersonatedUserId !== authProfile.id,
  )

  if (!shouldImpersonate) {
    return {
      profile: authProfile,
      authProfile,
      userEmail: user.email || null,
      isImpersonating: false,
    }
  }

  const { data: impersonatedProfile } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", impersonatedUserId)
    .maybeSingle()

  return {
    profile: impersonatedProfile || authProfile,
    authProfile,
    userEmail: user.email || null,
    isImpersonating: Boolean(impersonatedProfile),
  }
}

export function useUserProfile() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<UserProfileResponse>({
    queryKey: ["current-user-profile"],
    queryFn: fetchUserProfile,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  })

  const authProfile = data?.authProfile || data?.profile || null
  const effectiveProfile = data?.profile || null

  return {
    profile: effectiveProfile,
    authProfile,
    userEmail: data?.userEmail || null,
    loading: isLoading,
    isAdmin: canManageByRole(effectiveProfile?.role),
    isSuperAdmin: authProfile?.is_super_admin === true,
    isImpersonating: data?.isImpersonating === true,
    refreshProfile: () =>
      queryClient.invalidateQueries({ queryKey: ["current-user-profile"] }),
  }
}

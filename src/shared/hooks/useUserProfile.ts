// src/hooks/useUserProfile.ts
"use client"

import { createClient as createClientBrowser } from "@/shared/api/supabase/client"
import { canManageByRole } from "@/shared/lib/roles"
import { Database } from "@/shared/types/database.types"
import useSWR from "swr"

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
  userEmail: string | null
}

const fetchUserProfile = async (): Promise<UserProfileResponse> => {
  const supabase = createClientBrowser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      profile: null,
      userEmail: null,
    }
  }

  // Select profile fields - role is the correct field name in database
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, job_title, krt_id, hourly_rate, team_id, is_super_admin",
    )
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("Client fetch failed:", profileError)
  }

  return {
    profile: profileData || null,
    userEmail: user.email || null,
  }
}

export function useUserProfile() {
  const { data, isLoading } = useSWR<UserProfileResponse>(
    "current-user-profile",
    fetchUserProfile,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  )

  return {
    profile: data?.profile || null,
    userEmail: data?.userEmail || null,
    loading: isLoading,
    isAdmin: canManageByRole(data?.profile?.role),
    isSuperAdmin: data?.profile?.is_super_admin === true,
  }
}

"use client"

import { createClient } from "@/shared/api/supabase/client"
import { mergeDuplicateProfiles } from "@/shared/lib/profile-dedupe"
import { canManageByRole } from "@/shared/lib/roles"
import { logError } from "@/shared/lib/utils/logger"
import { useEffect, useState } from "react"
import type { UserProfile } from "./types"

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserEmail(user.email || null)

        // Select profile fields - role is the correct field name in database
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, role, job_title, krt_id, hourly_rate, team_id, avatar_url, created_at",
          )
          .eq("id", user.id)
          .maybeSingle()

        if (profileError && profileError.code !== "PGRST116") {
          logError("Client fetch failed:", profileError)
        }

        let resolvedProfile = profileData as UserProfile | null

        if (!resolvedProfile && user.email) {
          const { data: emailProfiles, error: emailLookupError } = await supabase
            .from("profiles")
            .select(
              "id, full_name, email, role, job_title, krt_id, hourly_rate, team_id, avatar_url, created_at",
            )
            .eq("email", user.email)
            .order("created_at", { ascending: true })

          if (emailLookupError && emailLookupError.code !== "PGRST116") {
            logError("Client email profile lookup failed:", emailLookupError)
          }

          if ((emailProfiles || []).length === 1) {
            resolvedProfile = emailProfiles?.[0] as UserProfile
          } else if ((emailProfiles || []).length > 1) {
            resolvedProfile = mergeDuplicateProfiles(
              emailProfiles as UserProfile[],
            ) as UserProfile
          }
        }

        if (resolvedProfile) {
          setProfile(resolvedProfile)
        }
      }

      setLoading(false)
    }

    fetchProfile()
  }, [])

  return {
    profile,
    userEmail,
    loading,
    isAdmin: canManageByRole(profile?.role),
  }
}

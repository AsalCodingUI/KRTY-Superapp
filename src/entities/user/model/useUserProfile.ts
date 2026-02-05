"use client"

import { createClient } from "@/shared/api/supabase/client"
import { canManageByRole } from "@/shared/lib/roles"
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
            "id, full_name, email, role, job_title, krt_id, hourly_rate, team_id, avatar_url",
          )
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Client fetch failed:", profileError)
        }

        if (profileData) {
          setProfile(profileData as UserProfile)
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

// src/hooks/useUserProfile.ts
"use client"

import { Database } from "@/shared/types/database.types"
import { createClient as createClientBrowser } from "@/shared/api/supabase/client"
import { useEffect, useState } from "react"

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
>

export function useUserProfile() {
  const [profile, setProfile] = useState<ProfileSubset | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClientBrowser()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserEmail(user.email || null)

        // Select profile fields - role is the correct field name in database
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, role, job_title, krt_id, hourly_rate, team_id",
          )
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Client fetch failed:", profileError)
        }

        if (profileData) {
          setProfile(profileData)
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
    isAdmin: profile?.role === "stakeholder",
  }
}

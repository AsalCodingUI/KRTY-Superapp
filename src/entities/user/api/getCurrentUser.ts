import { createClient } from "@/shared/api/supabase/server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import type { UserProfile } from "../model/types"

export async function getCurrentUser(): Promise<{
  data: UserProfile | null
  error: Error | null
}> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        data: null,
        error: authError
          ? new Error(authError.message)
          : new Error("Not authenticated"),
      }
    }

    const data = await resolveProfileByUserIdOrEmail<UserProfile>(
      supabase,
      "id, full_name, email, role, job_title, krt_id, team_id, avatar_url, created_at",
      user.id,
      user.email,
    )

    if (!data) {
      return { data: null, error: new Error("Profile not found") }
    }

    return { data: data as UserProfile, error: null }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to fetch current user"),
    }
  }
}

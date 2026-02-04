import { createClient } from "@/shared/api/supabase/client"
import type { UserProfile } from "../model/types"

export interface UpdateUserProfileData {
  full_name?: string
  job_title?: string
  avatar_url?: string
}

export async function updateUserProfile(
  userId: string,
  updates: UpdateUserProfileData,
): Promise<{ data: UserProfile | null; error: Error | null }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select(
        "id, full_name, email, role, job_title, krt_id, hourly_rate, team_id, avatar_url",
      )
      .single()

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data: data as UserProfile, error: null }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to update user profile"),
    }
  }
}

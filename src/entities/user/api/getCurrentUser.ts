import { createClient } from "@/shared/api/supabase/server"
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
                error: authError ? new Error(authError.message) : new Error("Not authenticated"),
            }
        }

        const { data, error } = await supabase
            .from("profiles")
            .select(
                "id, full_name, email, role, job_title, krt_id, hourly_rate, team_id, avatar_url"
            )
            .eq("id", user.id)
            .single()

        if (error) {
            return { data: null, error: new Error(error.message) }
        }

        return { data: data as UserProfile, error: null }
    } catch (error) {
        return {
            data: null,
            error:
                error instanceof Error ? error : new Error("Failed to fetch current user"),
        }
    }
}

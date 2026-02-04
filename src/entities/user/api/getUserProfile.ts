import { createClient } from "@/shared/api/supabase/server";
import type { UserProfile } from "../model/types";

export async function getUserProfile(
    userId: string
): Promise<{ data: UserProfile | null; error: Error | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("profiles")
            .select(
                "id, full_name, email, role, job_title, krt_id, hourly_rate, team_id, avatar_url"
            )
            .eq("id", userId)
            .single()

        if (error) {
            return { data: null, error: new Error(error.message) }
        }

        return { data: data as UserProfile, error: null }
    } catch (error) {
        return {
            data: null,
            error:
                error instanceof Error ? error : new Error("Failed to fetch user profile"),
        }
    }
}

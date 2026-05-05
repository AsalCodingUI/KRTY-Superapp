"use server"

import { createClient } from "@/shared/api/supabase/server"
import { dedupeProfilesByEmail } from "@/shared/lib/profile-dedupe"
import { logError } from "@/shared/lib/utils/logger"
import { TeamMember } from "../model/types"

/**
 * Fetch all team members
 *
 * @returns Array of team members
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, job_title, role, hourly_rate, avatar_url")
    .order("full_name", { ascending: true })

  if (error) {
    logError("Error fetching team members:", error)
    throw error
  }

  return dedupeProfilesByEmail(data as TeamMember[])
}

/**
 * Fetch a single team member by ID
 *
 * @param memberId - The ID of the team member
 * @returns Team member data
 */
export async function getTeamMember(
  memberId: string,
): Promise<TeamMember | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, job_title, role, hourly_rate, avatar_url")
    .eq("id", memberId)
    .single()

  if (error) {
    logError("Error fetching team member:", error)
    return null
  }

  return data as TeamMember
}

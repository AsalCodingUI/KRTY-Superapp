"use server"

import { createClient } from "@/shared/api/supabase/server"
import { logError } from "@/shared/lib/utils/logger"

/**
 * Get team statistics with server-side aggregation
 * @param teamMembers - Array of profile IDs in the team
 * @returns Aggregated team stats by job title
 */
export async function getTeamStats(teamMembers: string[]) {
  const supabase = await createClient()

  if (!teamMembers || teamMembers.length === 0) {
    return {
      success: true,
      data: {
        totalMembers: 0,
        statsByJobTitle: [],
      },
    }
  }

  try {
    // Fetch profiles with server-side filtering
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, job_title")
      .in("id", teamMembers)

    if (error) throw error

    // Aggregate by job title on server
    const statsMap = new Map<string, number>()

    profiles?.forEach((profile) => {
      const jobTitle = profile.job_title || "Unknown"
      statsMap.set(jobTitle, (statsMap.get(jobTitle) || 0) + 1)
    })

    // Convert to array format
    const statsByJobTitle = Array.from(statsMap.entries()).map(
      ([jobTitle, count]) => ({
        jobTitle,
        count,
        percentage: profiles ? Math.round((count / profiles.length) * 100) : 0,
      }),
    )

    return {
      success: true,
      data: {
        totalMembers: profiles?.length || 0,
        statsByJobTitle,
      },
    }
  } catch (error) {
    logError("[getTeamStats] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch team stats",
      data: null,
    }
  }
}

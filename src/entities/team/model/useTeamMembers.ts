"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { TeamMember } from "./types"

/**
 * Hook to fetch team members
 *
 * @returns Query result with team members data
 */
export function useTeamMembers() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, job_title, role, hourly_rate, avatar_url")
        .order("full_name", { ascending: true })

      if (error) throw error
      return data as TeamMember[]
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook to fetch a single team member by ID
 *
 * @param memberId - The ID of the team member
 * @returns Query result with team member data
 */
export function useTeamMember(memberId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["team-member", memberId],
    queryFn: async () => {
      if (!memberId) return null

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, job_title, role, hourly_rate, avatar_url")
        .eq("id", memberId)
        .single()

      if (error) throw error
      return data as TeamMember
    },
    enabled: !!memberId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

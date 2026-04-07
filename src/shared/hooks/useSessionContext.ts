"use client"

import { canManageByRole } from "@/shared/lib/roles"
import type { Database } from "@/shared/types/database.types"
import { useQuery, useQueryClient } from "@tanstack/react-query"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

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
  | "is_super_admin"
>

export type PagePermissionsMap = Record<string, boolean>

export type SessionContextResponse = {
  profile: ProfileSubset | null
  authProfile: ProfileSubset | null
  userEmail: string | null
  permissions: PagePermissionsMap | null
  isImpersonating: boolean
}

async function fetchSessionContext(): Promise<SessionContextResponse> {
  const response = await fetch("/api/session/context", {
    credentials: "include",
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch session context")
  }

  return (await response.json()) as SessionContextResponse
}

export function useSessionContext() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<SessionContextResponse>({
    queryKey: ["session-context"],
    queryFn: fetchSessionContext,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  })

  const profile = data?.profile || null
  const authProfile = data?.authProfile || profile

  return {
    profile,
    authProfile,
    userEmail: data?.userEmail || null,
    permissions: data?.permissions ?? null,
    loading: isLoading,
    isAdmin: canManageByRole(profile?.role),
    isSuperAdmin: authProfile?.is_super_admin === true,
    isImpersonating: data?.isImpersonating === true,
    refreshSession: () =>
      queryClient.invalidateQueries({ queryKey: ["session-context"] }),
  }
}

"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useQuery } from "@tanstack/react-query"

export type PagePermissionsMap = Record<string, boolean>

type PermissionsPayload = {
  userPermissions: PagePermissionsMap | null
}

const fetchPagePermissions = async (
  userId: string,
): Promise<PermissionsPayload> => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("user_page_permissions")
    .select("page_slug, granted")
    .eq("user_id", userId)

  const userPermissionsRows = (data || []) as Array<{
    page_slug: string
    granted: boolean
  }>
  const userPermissions: PagePermissionsMap | null =
    !error && userPermissionsRows.length > 0
      ? (() => {
          const map: PagePermissionsMap = {}
          for (const row of userPermissionsRows) {
            map[row.page_slug] = row.granted
          }
          return map
        })()
      : null

  return {
    userPermissions,
  }
}

/**
 * Returns a map of page_slug → granted for the current user.
 * Returns null if no custom permissions exist — meaning role-based fallback applies.
 */
export function usePagePermissions() {
  const { profile, loading: profileLoading } = useUserProfile()
  const effectiveUserId = profile?.id

  const { data, isLoading } = useQuery<PermissionsPayload>({
    queryKey: ["current-user-page-permissions", effectiveUserId],
    queryFn: () => fetchPagePermissions(effectiveUserId!),
    enabled: !!effectiveUserId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  })

  return {
    permissions: data?.userPermissions ?? null,
    loading: profileLoading || isLoading,
    /**
     * Resolver: user override > fallback value.
     */
    hasPermission: (slug: string, fallback?: boolean): boolean | null => {
      if (!data) return null
      if (data.userPermissions && slug in data.userPermissions) {
        return data.userPermissions[slug]
      }
      return fallback ?? null
    },
  }
}

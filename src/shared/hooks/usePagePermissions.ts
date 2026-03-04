"use client"

import { createClient } from "@/shared/api/supabase/client"
import useSWR from "swr"

export type PagePermissionsMap = Record<string, boolean>

type PermissionsPayload = {
  userPermissions: PagePermissionsMap | null
}

const fetchPagePermissions = async (): Promise<PermissionsPayload> => {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      userPermissions: null,
    }
  }

  const { data, error } = await supabase
    .from("user_page_permissions")
    .select("page_slug, granted")
    .eq("user_id", user.id)

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
  const { data, isLoading } = useSWR<PermissionsPayload>(
    "current-user-page-permissions",
    fetchPagePermissions,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  )

  return {
    permissions: data?.userPermissions ?? null,
    loading: isLoading,
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

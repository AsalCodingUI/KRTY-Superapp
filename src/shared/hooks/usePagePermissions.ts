"use client"

import { createClient } from "@/shared/api/supabase/client"
import useSWR from "swr"

export type PagePermissionsMap = Record<string, boolean>
export type RolePageDefaultsMap = Record<string, boolean>

type PermissionsPayload = {
  userPermissions: PagePermissionsMap | null
  roleDefaults: RolePageDefaultsMap | null
}

const fetchPagePermissions = async (
  role?: string | null,
): Promise<PermissionsPayload> => {
  const supabase = createClient()

  const [
    {
      data: { user },
    },
    roleDefaultsResult,
  ] = await Promise.all([
    supabase.auth.getUser(),
    role
      ? supabase
          .from("role_page_defaults")
          .select("page_slug, granted")
          .eq("role", role)
      : Promise.resolve({ data: [], error: null }),
  ])

  const roleDefaultsRows = (roleDefaultsResult.data || []) as Array<{
    page_slug: string
    granted: boolean
  }>
  const roleDefaults: RolePageDefaultsMap | null =
    roleDefaultsRows.length > 0
      ? (() => {
          const map: RolePageDefaultsMap = {}
          for (const row of roleDefaultsRows) {
            map[row.page_slug] = row.granted
          }
          return map
        })()
      : null

  if (!user) {
    return {
      userPermissions: null,
      roleDefaults,
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
    roleDefaults,
  }
}

/**
 * Returns a map of page_slug → granted for the current user.
 * Returns null if no custom permissions exist — meaning role-based fallback applies.
 */
export function usePagePermissions(role?: string | null) {
  const { data, isLoading } = useSWR<PermissionsPayload>(
    ["current-user-page-permissions", role || "no-role-default"],
    () => fetchPagePermissions(role),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    },
  )

  return {
    permissions: data?.userPermissions ?? null,
    roleDefaults: data?.roleDefaults ?? null,
    loading: isLoading,
    /**
     * Resolver: user override > role defaults > fallback value.
     */
    hasPermission: (slug: string, fallback?: boolean): boolean | null => {
      if (!data) return null
      if (data.userPermissions && slug in data.userPermissions) {
        return data.userPermissions[slug]
      }
      if (data.roleDefaults && slug in data.roleDefaults) {
        return data.roleDefaults[slug]
      }
      return fallback ?? null
    },
  }
}

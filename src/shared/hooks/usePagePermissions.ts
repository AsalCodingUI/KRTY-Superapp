"use client"

import {
  useSessionContext,
  type PagePermissionsMap,
} from "@/shared/hooks/useSessionContext"

/**
 * Returns a map of page_slug → granted for the current user.
 * Returns null if no custom permissions exist — meaning role-based fallback applies.
 */
export function usePagePermissions() {
  const { permissions, loading } = useSessionContext()

  return {
    permissions: permissions ?? null,
    loading,
    /**
     * Resolver: user override > fallback value.
     */
    hasPermission: (slug: string, fallback?: boolean): boolean | null => {
      if (permissions && slug in permissions) {
        return (permissions as PagePermissionsMap)[slug]
      }
      return fallback ?? null
    },
  }
}

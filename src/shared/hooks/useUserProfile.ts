"use client"

import { useSessionContext } from "@/shared/hooks/useSessionContext"
export type { ProfileSubset } from "@/shared/hooks/useSessionContext"

export function useUserProfile() {
  const {
    profile,
    authProfile,
    userEmail,
    loading,
    isAdmin,
    isSuperAdmin,
    isImpersonating,
    refreshSession,
  } = useSessionContext()

  return {
    profile,
    authProfile,
    userEmail,
    loading,
    isAdmin,
    isSuperAdmin,
    isImpersonating,
    refreshProfile: refreshSession,
  }
}

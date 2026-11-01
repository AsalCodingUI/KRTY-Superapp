"use client"

import { useQueryClient } from "@tanstack/react-query"
import { IMPERSONATION_COOKIE_NAME } from "@/shared/lib/impersonation"
import { useState } from "react"

/** Where "Kembali ke akun saya" goes: clears view-as, then the team page. */
export const STOP_IMPERSONATION_URL = "/api/admin/impersonation/stop"

/** Leave "view as" and go back to the admin's own account. */
export function useStopImpersonation() {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const stop = () => {
    setLoading(true)
    // The route clears it too; dropping it here as well covers a WebKit
    // that holds on to it for a moment (Kretya Flow).
    document.cookie = `${IMPERSONATION_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`
    // Cached data belongs to the member being viewed: drop it all, then a
    // full load (no page rendered as the member survives in the router).
    queryClient.clear()
    window.location.assign(STOP_IMPERSONATION_URL)
  }

  return { stop, loading }
}

"use client"

import { IMPERSONATION_COOKIE_NAME } from "@/shared/lib/impersonation"
import { useT } from "@/shared/i18n/client"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

/** Leave "view as" and go back to the admin's own account. */
export function useStopImpersonation() {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const t = useT("shell")

  const stop = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/impersonation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: null }),
      })
      if (!response.ok) throw new Error()
      // Belt and braces: the cookie isn't httpOnly, so drop it here too
      // (WebKit, i.e. Kretya Flow, can keep sending it for a moment).
      document.cookie = `${IMPERSONATION_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`
      // Cached data belongs to the member being viewed: drop it all.
      queryClient.clear()
      toast.success(t("impersonationStopped"))
      // A full load, not a client navigation: the router cache still holds
      // pages rendered as the member.
      window.location.replace("/teams")
    } catch {
      toast.error(t("impersonationStopFailed"))
    } finally {
      setLoading(false)
    }
  }

  return { stop, loading }
}

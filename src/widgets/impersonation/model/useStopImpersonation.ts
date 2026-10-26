"use client"

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

/** Leave "view as" and go back to the admin's own account. */
export function useStopImpersonation() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { refreshProfile } = useUserProfile()
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
      // Cached data belongs to the member being viewed: drop it all.
      queryClient.clear()
      await refreshProfile()
      toast.success(t("impersonationStopped"))
      router.refresh()
      router.push("/teams")
    } catch {
      toast.error(t("impersonationStopFailed"))
    } finally {
      setLoading(false)
    }
  }

  return { stop, loading }
}

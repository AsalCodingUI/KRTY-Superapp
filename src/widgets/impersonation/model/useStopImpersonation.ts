"use client"

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

/** Leave "view as" and go back to the admin's own account. */
export function useStopImpersonation() {
  const router = useRouter()
  const { refreshProfile } = useUserProfile()
  const [loading, setLoading] = useState(false)

  const stop = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/impersonation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: null }),
      })
      if (!response.ok) throw new Error()
      await refreshProfile()
      toast.success("Kembali ke akun kamu")
      router.refresh()
      router.push("/dashboard?settings=members")
    } catch {
      toast.error("Gagal kembali ke akun kamu")
    } finally {
      setLoading(false)
    }
  }

  return { stop, loading }
}

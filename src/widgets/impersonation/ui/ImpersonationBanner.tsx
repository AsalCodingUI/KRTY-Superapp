"use client"

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { Button } from "@/shared/ui"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function ImpersonationBanner() {
  const router = useRouter()
  const { isImpersonating, profile, authProfile, refreshProfile } = useUserProfile()
  const [loading, setLoading] = useState(false)

  if (!isImpersonating || !profile) return null

  const stopImpersonation = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/impersonation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: null }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Failed to exit impersonation")
      }

      await refreshProfile()
      toast.success("Returned to your account")
      router.refresh()
      router.push("/settings/permission")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to exit impersonation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-warning-light sticky top-0 z-40 px-5 py-2">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <p className="text-body-sm text-foreground-warning-on-color min-w-0 truncate">
          Viewing as{" "}
          <strong>{profile.full_name || profile.email || "User"}</strong>
          {authProfile?.full_name ? (
            <span className="text-foreground-warning-on-color/85">
              {" "}
              • Original: {authProfile.full_name}
            </span>
          ) : null}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={stopImpersonation}
          disabled={loading}
          isLoading={loading}
        >
          Back to my account
        </Button>
      </div>
    </div>
  )
}

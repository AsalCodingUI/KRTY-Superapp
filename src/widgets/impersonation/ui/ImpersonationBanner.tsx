"use client"

import { Spinner } from "@/components/ui/spinner"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { AppBanner } from "@/widgets/app-banner/ui/AppBanner"
import { useEffect, useState } from "react"
import { useStopImpersonation } from "../model/useStopImpersonation"

const DISMISS_KEY = "impersonation_banner_hidden"

/** "Kamu melihat sebagai …" while an admin uses view-as. */
export function ImpersonationBanner() {
  const { isImpersonating, profile, authProfile } = useUserProfile()
  const { stop, loading } = useStopImpersonation()
  const [hiddenFor, setHiddenFor] = useState<string | null>(null)

  // Closing hides it for this person until the tab closes; the account
  // menu still has "Kembali ke akun saya".
  useEffect(() => {
    try {
      setHiddenFor(window.sessionStorage.getItem(DISMISS_KEY))
    } catch {
      // Storage blocked: the banner just shows.
    }
  }, [])

  if (!isImpersonating || !profile || hiddenFor === profile.id) return null

  return (
    <AppBanner
      tone="warning"
      onClose={() => {
        setHiddenFor(profile.id)
        try {
          window.sessionStorage.setItem(DISMISS_KEY, profile.id)
        } catch {
          // Storage blocked: hidden until reload.
        }
      }}
      action={
        <button
          type="button"
          onClick={stop}
          disabled={loading}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium hover:bg-current/10 disabled:opacity-60"
        >
          {loading && <Spinner className="size-3.5" />}
          Kembali ke akun saya
        </button>
      }
    >
      Kamu melihat sebagai{" "}
      <strong className="font-semibold">
        {profile.full_name || profile.email || "anggota"}
      </strong>
      {authProfile?.full_name && (
        <span className="opacity-80"> · akun asli {authProfile.full_name}</span>
      )}
    </AppBanner>
  )
}

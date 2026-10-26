"use client"

import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * A portal page asked for without a valid session (the PIN changed, or the
 * client signed out in another tab): a moving between pages keeps the old
 * layout, so refresh it to bring back the PIN screen.
 */
export function PortalSessionEnded() {
  const router = useRouter()
  useEffect(() => router.refresh(), [router])
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner className="size-5" />
    </div>
  )
}

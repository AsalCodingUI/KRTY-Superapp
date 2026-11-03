"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import {
  SETTINGS_TABS,
  SettingsDialog,
  type SettingsTab,
} from "./SettingsDialog"

/** ?settings=<tab> on any page opens Settings over it (linkable). */
export function useSettingsHref() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return useCallback(
    (tab: SettingsTab | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (tab) params.set("settings", tab)
      else params.delete("settings")
      return params.size ? `${pathname}?${params}` : pathname
    },
    [pathname, searchParams],
  )
}

export function SettingsHost() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hrefFor = useSettingsHref()
  const param = searchParams.get("settings")
  if (!param) return null
  const tab = (SETTINGS_TABS as readonly string[]).includes(param)
    ? (param as SettingsTab)
    : "general"
  return (
    <SettingsDialog
      tab={tab}
      onTabChange={(next) => router.replace(hrefFor(next), { scroll: false })}
      onClose={() => router.replace(hrefFor(null), { scroll: false })}
    />
  )
}

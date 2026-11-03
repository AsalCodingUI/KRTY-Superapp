"use client"

import { replaceUrl } from "@/shared/lib/url-params"
import { usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import dynamic from "next/dynamic"
import { SETTINGS_TABS, type SettingsTab } from "../model/tabs"

// Only loads when Settings opens (it's mounted on every page).
const SettingsDialog = dynamic(
  () => import("./SettingsDialog").then((m) => m.SettingsDialog),
  { ssr: false },
)

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
      onTabChange={(next) => replaceUrl(hrefFor(next))}
      onClose={() => replaceUrl(hrefFor(null))}
    />
  )
}

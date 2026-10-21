"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export type SettingsSection = "general" | "members"

export const SETTINGS_PARAM = "settings"

/**
 * Settings is a modal over the current page, driven by `?settings=<section>`
 * so it can be linked to and survives a reload.
 */
export function useSettingsModal() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const section = searchParams.get(SETTINGS_PARAM) as SettingsSection | null

  const go = useCallback(
    (next: SettingsSection | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next) params.set(SETTINGS_PARAM, next)
      else params.delete(SETTINGS_PARAM)
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router, searchParams],
  )

  return {
    section,
    open: (next: SettingsSection = "general") => go(next),
    close: () => go(null),
  }
}

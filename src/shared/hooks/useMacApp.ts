"use client"

import {
  appInfo,
  fetchLatestMacRelease,
  isNewerVersion,
  tauri,
} from "@/shared/lib/desktop-app"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"

export const MAC_RELEASE_QUERY_KEY = ["mac-release", "latest"] as const

/** The newest Mac release with a download (null: none yet). */
export function useLatestMacRelease(enabled = true) {
  return useQuery({
    queryKey: MAC_RELEASE_QUERY_KEY,
    enabled,
    staleTime: 30 * 60_000,
    queryFn: fetchLatestMacRelease,
  })
}

/** The running app's info; null outside Kretya Flow. */
export function useAppInfo() {
  return useQuery({
    queryKey: ["mac-app", "info"],
    enabled: typeof window !== "undefined" && Boolean(tauri()),
    staleTime: Infinity,
    queryFn: appInfo,
  })
}

/**
 * Inside Kretya Flow: the running version, the newest release, and the
 * release when it's newer than this app (else null).
 */
export function useMacUpdate(enabled = true) {
  const { data: info } = useAppInfo()
  const release = useLatestMacRelease(enabled && Boolean(info))
  const current = info?.version ?? null
  const latest = release.data ?? null
  const available =
    current && latest && isNewerVersion(latest.version, current) ? latest : null
  return { current, latest, available, release }
}

/** A flag kept on this device (localStorage), e.g. a dismissed card. */
export function useDeviceFlag(key: string | null) {
  const [on, setOn] = useState<boolean | null>(null)
  useEffect(() => {
    if (!key) return
    try {
      setOn(localStorage.getItem(key) === "1")
    } catch {
      setOn(false)
    }
  }, [key])
  const set = useCallback(() => {
    if (!key) return
    try {
      localStorage.setItem(key, "1")
    } catch {}
    setOn(true)
  }, [key])
  return [on, set] as const
}

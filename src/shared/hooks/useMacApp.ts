"use client"

import {
  appInfo,
  fetchLatestMacRelease,
  isNewerVersion,
  onUpdateStatus,
  tauri,
  updateStatus,
} from "@/shared/lib/desktop-app"
import { useQuery, useQueryClient } from "@tanstack/react-query"
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

export const UPDATER_QUERY_KEY = ["mac-app", "updater"] as const

/**
 * The app's in-place updater, kept live from its "update-status" events.
 * `status` is null outside the app and in builds without the updater
 * (0.1.0); `loaded` once that's known.
 */
export function useAppUpdater(enabled = true) {
  const queryClient = useQueryClient()
  const inApp = enabled && typeof window !== "undefined" && Boolean(tauri())
  const query = useQuery({
    queryKey: UPDATER_QUERY_KEY,
    enabled: inApp,
    staleTime: Infinity,
    queryFn: async () => (await updateStatus()) ?? null,
  })
  useEffect(() => {
    if (!inApp) return
    return onUpdateStatus((s) => queryClient.setQueryData(UPDATER_QUERY_KEY, s))
  }, [inApp, queryClient])
  return { status: query.data ?? null, loaded: !inApp || query.isFetched }
}

/**
 * Inside Kretya Flow: the running version, the updater's state, and the
 * .dmg fallback: the newest release when it's newer than this app (else
 * null), only while the in-place updater can't do it (an app without it,
 * or it failed).
 */
export function useMacUpdate(enabled = true) {
  const { data: info } = useAppInfo()
  const updater = useAppUpdater(enabled)
  const dmgFallback =
    updater.loaded && (!updater.status || updater.status.phase === "error")
  const release = useLatestMacRelease(enabled && Boolean(info) && dmgFallback)
  const current = info?.version ?? null
  const latest = release.data ?? null
  const available =
    dmgFallback && current && latest && isNewerVersion(latest.version, current)
      ? latest
      : null
  return { current, latest, available, release, updater: updater.status }
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

"use client"

import { canOpenPage, accessLevel } from "@/shared/config/access"
import {
  globalItems,
  workspaces,
  type WorkspaceProfile,
} from "@/shared/config/workspaces"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

/** Between two prefetches: one at a time, never a burst on the server. */
const GAP = 400

/**
 * Every page in the sidebar this person can open, prefetched while the app
 * is idle (after load, one at a time): its code and loading skeleton are
 * here before the click, so a page change starts at once. Links themselves
 * only prefetch on intent (PrefetchLink).
 */
export function IdlePrefetch() {
  const router = useRouter()
  const { profile } = useUserProfile()

  useEffect(() => {
    if (!profile) return
    const p = profile as WorkspaceProfile
    const level = accessLevel(p)
    const hrefs = new Set<string>()
    for (const item of globalItems()) hrefs.add(item.href)
    for (const ws of workspaces) {
      if (ws.can && !ws.can(p)) continue
      for (const item of ws.items(p))
        if (!item.can || item.can(p)) hrefs.add(item.href)
    }
    const queue = [...hrefs].filter(
      (href) => href.startsWith("/") && canOpenPage(href, level),
    )

    let cancelled = false
    let handle: ReturnType<typeof setTimeout> | number | null = null
    // Safari has no requestIdleCallback.
    const idle = (fn: () => void) =>
      typeof requestIdleCallback === "function"
        ? requestIdleCallback(fn, { timeout: 3000 })
        : setTimeout(fn, 200)
    const next = () => {
      if (cancelled) return
      const href = queue.shift()
      if (!href) return
      if (href !== location.pathname) router.prefetch(href)
      handle = setTimeout(() => {
        handle = idle(next)
      }, GAP)
    }
    // After the page itself has loaded.
    handle = setTimeout(() => {
      handle = idle(next)
    }, 2500)
    return () => {
      cancelled = true
      if (handle === null) return
      clearTimeout(handle as ReturnType<typeof setTimeout>)
      if (typeof cancelIdleCallback === "function")
        cancelIdleCallback(handle as number)
    }
  }, [profile, router])

  return null
}

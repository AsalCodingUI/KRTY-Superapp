"use client"

import type { NavMainItem } from "@/components/nav-main"
import { ProjectAvatar } from "@/components/project-avatar"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { hideLeads, inApp, leadState, unreadOf } from "../lib/desktop"
import { useLeadSites } from "../model/data"

export const leadHref = (id: string) => `/leads/${id}`

/** The sites the Leads panel lists, as sidebar rows
 *  with a colored letter tile like a project's. */
export function useLeadTree(enabled: boolean): NavMainItem[] {
  const pathname = usePathname()
  const { data } = useLeadSites(enabled)
  // A reload (or a new sign-in) leaves the app's native site view where
  // it was, over whatever page loads: put it away once on load (a site's
  // page shows it again).
  useEffect(() => {
    void hideLeads()
  }, [])
  // Unread counts from the sites' titles (Gmail's "Inbox (3)", Telegram's
  // "(12)"), for the sites open in the app; every 10s.
  const [unread, setUnread] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!enabled || !inApp() || !data?.length) return
    let alive = true
    const read = async () => {
      if (document.visibilityState !== "visible") return
      const next: Record<string, number> = {}
      for (const site of data) {
        const state = await leadState(site.id)
        next[site.id] = unreadOf(state?.title)
      }
      if (alive)
        setUnread((prev) =>
          JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
        )
    }
    void read()
    const timer = window.setInterval(read, 10_000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [enabled, data])
  return useMemo(
    () =>
      (data ?? []).map((site) => ({
        title: site.name,
        url: leadHref(site.id),
        icon: (
          <ProjectAvatar id={site.id} name={site.name} className="size-3.5" />
        ),
        isActive: pathname === leadHref(site.id),
        badge: unread[site.id] || undefined,
      })),
    [data, pathname, unread],
  )
}

"use client"

import { accessLevel } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useEffect } from "react"
import { inApp, preloadLead } from "../lib/desktop"
import { useLeadSites } from "../model/data"

/** Sites loaded this app session (the main page reloads, the views stay). */
const loaded = new Set<string>()

/**
 * Kretya Flow, for PMs and stakeholders: every Leads site loads in the
 * background a few seconds after the app opens, one at a time, so their
 * notifications and unread counts come in without opening each first.
 * Nothing in a browser (sites can't be embedded there).
 */
export function LeadsPreloader() {
  const { profile } = useUserProfile()
  const allowed = Boolean(profile) && accessLevel(profile) !== "employee"
  const enabled = allowed && inApp()
  const { data: sites } = useLeadSites(enabled)

  useEffect(() => {
    if (!enabled || !sites?.length) return
    let cancelled = false
    const queue = sites.filter((s) => !loaded.has(s.id))
    const timer = window.setTimeout(async () => {
      for (const site of queue) {
        if (cancelled) return
        loaded.add(site.id)
        // An older app build has no lead_preload: stop trying.
        if (!(await preloadLead(site.id, site.url))) return
        await new Promise((r) => setTimeout(r, 1500))
      }
    }, 3000)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [enabled, sites])

  return null
}

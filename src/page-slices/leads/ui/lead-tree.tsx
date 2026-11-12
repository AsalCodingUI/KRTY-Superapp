"use client"

import type { NavMainItem } from "@/components/nav-main"
import { ProjectAvatar } from "@/components/project-avatar"
import { usePathname } from "next/navigation"
import { useEffect, useMemo } from "react"
import { hideLeads } from "../lib/desktop"
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
  return useMemo(
    () =>
      (data ?? []).map((site) => ({
        title: site.name,
        url: leadHref(site.id),
        icon: (
          <ProjectAvatar id={site.id} name={site.name} className="size-3.5" />
        ),
        isActive: pathname === leadHref(site.id),
      })),
    [data, pathname],
  )
}

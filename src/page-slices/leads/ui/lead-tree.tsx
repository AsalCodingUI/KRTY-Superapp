"use client"

import type { NavMainItem } from "@/components/nav-main"
import { ProjectAvatar } from "@/components/project-avatar"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { useLeadSites } from "../model/data"

export const leadHref = (id: string) => `/leads/${id}`

/** The sites the Leads panel lists, as sidebar rows
 *  with a colored letter tile like a project's. */
export function useLeadTree(enabled: boolean): NavMainItem[] {
  const pathname = usePathname()
  const { data } = useLeadSites(enabled)
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

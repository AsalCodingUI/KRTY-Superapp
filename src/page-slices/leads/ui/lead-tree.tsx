"use client"

import type { NavMainItem } from "@/components/nav-main"
import { ProjectAvatar } from "@/components/project-avatar"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { useLeadSites } from "../model/data"

export const leadHref = (id: string) => `/leads/${id}`

/** The sites the Leads panel lists (not the hidden ones), as sidebar rows
 *  with a colored letter tile like a project's. */
export function useLeadTree(enabled: boolean): NavMainItem[] {
  const { profile } = useUserProfile()
  const pathname = usePathname()
  const { data } = useLeadSites(enabled ? profile?.id : null)
  return useMemo(
    () =>
      (data ?? [])
        .filter((site) => !site.hidden)
        .map((site) => ({
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

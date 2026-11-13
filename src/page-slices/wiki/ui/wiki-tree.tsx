"use client"

import type { NavMainItem } from "@/components/nav-main"
import { useMemo } from "react"
import { useWikiPages, wikiHref } from "../model/data"

/**
 * Every wiki page as a link, flat: the panel's active-row matching (a page
 * at any depth wins over Home's /wiki). The panel draws them with
 * WikiTreeNav.
 */
export function useWikiTree(enabled: boolean): NavMainItem[] {
  const { data: pages } = useWikiPages(enabled)
  return useMemo(
    () =>
      (pages ?? []).map((page) => ({
        title: page.title,
        url: wikiHref(page.id),
        icon: null,
      })),
    [pages],
  )
}

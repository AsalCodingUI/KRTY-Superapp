"use client"

import type { NavMainItem } from "@/components/nav-main"
import { useT } from "@/shared/i18n/client"
import { RiFileTextLine } from "@/shared/ui/lucide-icons"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { childrenOf, trailOf, useWikiPages, wikiHref } from "../model/data"

/**
 * The wiki's pages for its panel: the top-level ones, each listing its
 * subpages while it (or one of them) is open, like a project's pages.
 * Deeper pages are reached from their parent page.
 */
export function useWikiTree(enabled: boolean): NavMainItem[] {
  const pathname = usePathname()
  const t = useT("wiki")
  const { data: pages } = useWikiPages(enabled)
  return useMemo(() => {
    if (!pages) return []
    const openId = pathname.startsWith("/wiki/")
      ? pathname.slice("/wiki/".length).split("/")[0]
      : null
    const trail = openId ? trailOf(pages, openId).map((p) => p.id) : []
    return childrenOf(pages, null).map((page) => ({
      title: page.title || t("untitled"),
      url: wikiHref(page.id),
      icon: <RiFileTextLine />,
      isActive: trail[0] === page.id,
      nestOne: true,
      items: childrenOf(pages, page.id).map((child) => ({
        title: child.title || t("untitled"),
        url: wikiHref(child.id),
        isActive: trail[1] === child.id,
      })),
    }))
  }, [pages, pathname, t])
}

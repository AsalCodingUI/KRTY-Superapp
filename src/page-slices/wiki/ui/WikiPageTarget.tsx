"use client"

import { ContextTarget } from "@/shared/context-menu"
import { useT } from "@/shared/i18n/client"
import { RiAddLine, RiDeleteBinLine } from "@/shared/ui/lucide-icons"
import { usePathname, useRouter } from "next/navigation"
import type { ReactElement } from "react"
import {
  trailOf,
  useWikiPages,
  useWikiWriter,
  wikiHref,
  wikiIdOf,
  type WikiPageMeta,
} from "../model/data"

/**
 * Right-click on a wiki page anywhere it's listed (the panel, Home's
 * cards, rows, the breadcrumb): Buka / Buka di tab baru / Salin link (from
 * its href), then Subhalaman baru and Hapus halaman (a second click
 * confirms; its subpages go with it). Deleting the page you're on (or one
 * above it) takes you to its parent.
 */
export function WikiPageTarget({
  page,
  children,
}: {
  page: WikiPageMeta
  children: ReactElement<Record<string, unknown>>
}) {
  const t = useT("wiki")
  const router = useRouter()
  const pathname = usePathname()
  const writer = useWikiWriter()
  const { data: pages = [] } = useWikiPages()
  return (
    <ContextTarget
      type="wiki-page"
      id={page.id}
      label={page.title || t("untitled")}
      href={wikiHref(page)}
      items={() => [
        {
          id: "wiki-new-subpage",
          label: t("newSubpage"),
          icon: RiAddLine,
          onSelect: async () => {
            router.push(wikiHref(await writer.create(page.id)))
          },
        },
        {
          id: "wiki-delete",
          label: t("delete"),
          icon: RiDeleteBinLine,
          destructive: true,
          confirm: true,
          onSelect: async () => {
            const param = pathname.startsWith("/wiki/")
              ? pathname.slice("/wiki/".length).split("/")[0]
              : null
            const openId = param ? wikiIdOf(param, pages) : null
            const above = openId
              ? trailOf(pages, openId).some((p) => p.id === page.id)
              : false
            const parent = pages.find((p) => p.id === page.parent_id)
            await writer.remove(page.id)
            if (above) router.push(parent ? wikiHref(parent) : "/wiki")
          },
        },
      ]}
    >
      {children}
    </ContextTarget>
  )
}

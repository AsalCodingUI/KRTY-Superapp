"use client"

import { PrefetchLink } from "@/components/prefetch-link"
import type { PageLinkRenderer } from "@/page-slices/policies/ui/page-link-context"
import { useT } from "@/shared/i18n/client"
import { useCallback } from "react"
import { wikiHref, wikiIdOf, type WikiPageMeta } from "../model/data"
import { WikiDatabase } from "./WikiDatabase"
import { canEditPage } from "../model/data"
import { WikiIcon } from "./wiki-icon"
import { WikiPageTarget } from "./WikiPageTarget"

/** A link to a page as Notion's: its icon and its (current) title. */
function PageChip({ page }: { page: WikiPageMeta }) {
  const t = useT("wiki")
  return (
    <WikiPageTarget page={page}>
      <PrefetchLink
        href={wikiHref(page)}
        className="hover:bg-muted rounded-control -mx-1 inline-flex max-w-full items-center gap-2 px-1 py-0.5 font-medium"
      >
        <WikiIcon icon={page.icon} kind={page.kind} />
        <span className="decoration-border truncate underline underline-offset-4">
          {page.title || t("untitled")}
        </span>
      </PrefetchLink>
    </WikiPageTarget>
  )
}

/** A database in a page, as Notion's inline database: its title, then
 *  its table (rows edited in place). */
function InlineDatabase({
  db,
  pages,
}: {
  db: WikiPageMeta
  pages: WikiPageMeta[]
}) {
  const t = useT("wiki")
  return (
    // The document's link style (dotted, blue) stays off the table.
    <div className="[&_a]:text-foreground! my-3 flex flex-col gap-2 [&_a]:no-underline!">
      <WikiPageTarget page={db}>
        <PrefetchLink
          href={wikiHref(db)}
          className="text-heading inline-flex w-fit items-center gap-2 text-base font-medium hover:underline"
        >
          <WikiIcon icon={db.icon} kind={db.kind} />
          {db.title || t("untitled")}
        </PrefetchLink>
      </WikiPageTarget>
      <WikiDatabase db={db} pages={pages} readOnly={!canEditPage(db)} />
    </div>
  )
}

/**
 * The wiki's page-link renderer (policies/ui/page-link-context): a link
 * to a wiki page alone on its line reads as a chip with the page's icon,
 * a database as its table in place. An address that no longer matches a
 * page stays a plain link.
 */
export function useWikiPageLinks(pages: WikiPageMeta[]): PageLinkRenderer {
  return useCallback(
    (href, _title) => {
      const param = href.replace(/^\/wiki\//, "").split(/[?#/]/)[0]
      const id = param ? wikiIdOf(param, pages) : null
      const page = id ? pages.find((p) => p.id === id) : undefined
      if (!page) return null
      return page.kind === "database" ? (
        <InlineDatabase db={page} pages={pages} />
      ) : (
        <PageChip page={page} />
      )
    },
    [pages],
  )
}

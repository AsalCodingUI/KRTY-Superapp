"use client"

import { GroupedList, ListRow } from "@/components/grouped-list"
import { PrefetchLink } from "@/components/prefetch-link"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { formatDistanceToNow } from "date-fns"
import { useMemo } from "react"
import { childrenOf, wikiHref, type WikiPageMeta } from "../model/data"
import { WikiIcon } from "./wiki-icon"

/** How many pages lie under `id`, at any depth. */
function countUnder(pages: WikiPageMeta[], id: string) {
  let count = 0
  const stack = [id]
  const seen = new Set(stack)
  while (stack.length) {
    const parent = stack.pop()!
    for (const page of pages)
      if (page.parent_id === parent && !seen.has(page.id)) {
        seen.add(page.id)
        count++
        stack.push(page.id)
      }
  }
  return count
}

/** The pages under `parentId` as rows: title, then when it was last edited
 *  (and by whom), and how many pages are under it. */
export function WikiPageRows({
  pages,
  parentId,
}: {
  pages: WikiPageMeta[]
  parentId: string | null
}) {
  const t = useT("wiki")
  const locale = useDateLocale()
  const rows = useMemo(() => childrenOf(pages, parentId), [pages, parentId])
  return (
    <GroupedList className="text-sm">
      {rows.map((page) => {
        const under = countUnder(pages, page.id)
        const time = formatDistanceToNow(new Date(page.updated_at), {
          addSuffix: true,
          locale,
        })
        return (
          <ListRow
            key={page.id}
            className="flex min-h-14 items-center gap-3 py-2"
          >
            <WikiIcon icon={page.icon} kind={page.kind} />
            <PrefetchLink
              href={wikiHref(page.id)}
              className="flex min-w-0 flex-1 flex-col after:absolute after:inset-0"
            >
              <span className="truncate">{page.title || t("untitled")}</span>
              <span className="text-muted-foreground text-meta truncate">
                {page.updated_by_name
                  ? t("editedBy", { time, name: page.updated_by_name })
                  : t("edited", { time })}
              </span>
            </PrefetchLink>
            {under > 0 && (
              <span className="text-tertiary-foreground text-meta shrink-0 tabular-nums">
                {t("pages", { count: under })}
              </span>
            )}
          </ListRow>
        )
      })}
    </GroupedList>
  )
}

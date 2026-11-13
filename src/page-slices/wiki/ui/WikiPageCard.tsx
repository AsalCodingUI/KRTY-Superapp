"use client"

import { PrefetchLink } from "@/components/prefetch-link"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { formatDistanceToNow } from "date-fns"
import { wikiHref, type WikiPageMeta } from "../model/data"
import { WikiIcon } from "./wiki-icon"

/**
 * A wiki page as a card (Home): its cover as a strip (a quiet fill when it
 * has none), its icon over the strip's edge, the title, when it changed
 * and how many pages are under it.
 */
export function WikiPageCard({
  page,
  count,
}: {
  page: WikiPageMeta
  /** Pages under it (shown when any). */
  count?: number
}) {
  const t = useT("wiki")
  const locale = useDateLocale()
  return (
    <PrefetchLink
      href={wikiHref(page.id)}
      className="rounded-card border-border bg-background dark:bg-surface hover:border-foreground/15 group/card flex min-w-0 flex-col overflow-hidden border transition-colors"
    >
      <div className="bg-muted relative h-16 shrink-0 overflow-hidden">
        {page.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.cover}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1 px-3.5 pt-0 pb-3">
        <div className="bg-background dark:bg-surface rounded-control -mt-4 mb-0.5 grid size-8 place-items-center">
          <WikiIcon
            icon={page.icon}
            kind={page.kind}
            className="size-5 text-lg"
          />
        </div>
        <span className="truncate text-sm font-medium">
          {page.title || t("untitled")}
        </span>
        <span className="text-muted-foreground text-meta truncate">
          {formatDistanceToNow(new Date(page.updated_at), {
            addSuffix: true,
            locale,
          })}
          {count ? ` · ${t("pages", { count })}` : ""}
        </span>
      </div>
    </PrefetchLink>
  )
}

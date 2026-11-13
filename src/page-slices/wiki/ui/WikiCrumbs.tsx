"use client"

import { PrefetchLink } from "@/components/prefetch-link"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useT } from "@/shared/i18n/client"
import { Fragment } from "react"
import { wikiHref, type WikiPageMeta } from "../model/data"
import { WikiIcon } from "./wiki-icon"

/**
 * Where a wiki page sits, as Notion's top bar: Home › parents › the page.
 * A deep trail keeps the first parent and the last two (… between). The
 * wiki's exception to "no breadcrumb row" (docs/ui/navigation.md).
 */
export function WikiCrumbs({
  trail,
  current,
}: {
  /** The page's parents, top first (not the page itself). */
  trail: WikiPageMeta[]
  /** The page: its icon and (live) title. */
  current: { icon: string | null; kind: "page" | "database"; title: string }
}) {
  const t = useT("wiki")
  const tn = useT("nav")
  const shown = trail.length > 3 ? [trail[0], null, ...trail.slice(-2)] : trail
  const crumb = (
    icon: string | null,
    kind: "page" | "database",
    title: string,
  ) => (
    <>
      <WikiIcon icon={icon} kind={kind} className="size-3.5 text-[12px]" />
      <span className="max-w-48 truncate">{title || t("untitled")}</span>
    </>
  )
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap text-sm">
        <BreadcrumbItem>
          <BreadcrumbLink render={<PrefetchLink href="/wiki" />}>
            {tn("wikiAll")}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {shown.map((page, i) => (
          <Fragment key={page?.id ?? `gap-${i}`}>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              {page ? (
                <BreadcrumbLink
                  className="flex min-w-0 items-center gap-1.5"
                  render={<PrefetchLink href={wikiHref(page.id)} />}
                >
                  {crumb(page.icon, page.kind, page.title)}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbEllipsis />
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
        <BreadcrumbSeparator />
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="flex min-w-0 items-center gap-1.5 font-medium">
            {crumb(current.icon, current.kind, current.title)}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

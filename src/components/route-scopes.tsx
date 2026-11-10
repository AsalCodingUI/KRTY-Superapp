"use client"

import { siteConfig } from "@/app/siteConfig"
import { SegmentedControl } from "@/components/segmented-control"
import { matchesRoute } from "@/shared/config/workspaces"
import { useT } from "@/shared/i18n/client"
import { usePathname, useRouter } from "next/navigation"

type Scope = { href: string; label: string }

/**
 * Sibling pages behind one sidebar row, switched like scopes (a
 * SegmentedControl as the page title, as on Projects | Dokumen). The
 * longest matching href is the current one.
 */
export function RouteScopes({ items }: { items: Scope[] }) {
  const pathname = usePathname()
  const router = useRouter()
  const value =
    items
      .filter((item) => matchesRoute(pathname, item.href))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? items[0].href
  return (
    <SegmentedControl
      fitContent
      // In a column (the calendar's header) it keeps its own width.
      className="self-start"
      value={value}
      onChange={(href) => {
        if (href !== value) router.push(href)
      }}
      items={items.map((item) => ({ value: item.href, label: item.label }))}
    />
  )
}

const links = siteConfig.baseLinks

/** Kalender: yours, the projects', Sharing Santuy. */
export function CalendarScopes() {
  const t = useT("nav")
  return (
    <RouteScopes
      items={[
        { href: `${links.calendar}/personal`, label: t("calendarMine") },
        { href: links.calendar, label: t("workspaceProject") },
        { href: `${links.calendar}/santuy`, label: t("sharingSantuy") },
      ]}
    />
  )
}

/** Tugas saya: your tasks and your notes. */
export function MyWorkScopes() {
  const t = useT("nav")
  return (
    <RouteScopes
      items={[
        { href: `${links.projects}/my-tasks`, label: t("myTasksShort") },
        { href: `${links.projects}/my-notes`, label: t("myNotesShort") },
      ]}
    />
  )
}

"use client"

import { siteConfig } from "@/app/siteConfig"
import { PrefetchLink } from "@/components/prefetch-link"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { matchesRoute } from "@/shared/config/workspaces"
import { useT } from "@/shared/i18n/client"
import { usePathname } from "next/navigation"

type Scope = { href: string; label: string }

/**
 * Sibling pages behind one sidebar row (Kalender: Saya / Project /
 * Sharing Santuy). They are pages, not views, so they are page tabs
 * (`TabNavigation plain`: links, ⌘-click opens a tab), never a second
 * SegmentedControl: the pill stays for the view switch under them
 * (Minggu / Bulan), so the two levels don't look alike. The longest
 * matching href is the current one.
 */
export function RouteScopes({ items }: { items: Scope[] }) {
  const pathname = usePathname()
  const value =
    items
      .filter((item) => matchesRoute(pathname, item.href))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? items[0].href
  return (
    // In a column (the calendar's header) it keeps its own width.
    <TabNavigation plain className="self-start">
      {items.map((item) => (
        <TabNavigationLink
          key={item.href}
          asChild
          active={item.href === value}
          showLeadingIcon={false}
        >
          <PrefetchLink href={item.href}>{item.label}</PrefetchLink>
        </TabNavigationLink>
      ))}
    </TabNavigation>
  )
}

const links = siteConfig.baseLinks

/** Kalender: yours, the projects'. */
export function CalendarScopes() {
  const t = useT("nav")
  return (
    <RouteScopes
      items={[
        { href: `${links.calendar}/personal`, label: t("calendarMine") },
        { href: links.calendar, label: t("workspaceProject") },
      ]}
    />
  )
}

"use client"

import { PageHeader } from "@/components/page-header"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { replaceUrl } from "@/shared/lib/url-params"
import { usePathname, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { TableTab } from "./TableTab"

/**
 * /ui: the app's UI rules, one tab per component, each shown live on mock
 * data. The written rules (what an AI reads) live in docs/ui/<tab>.md;
 * a tab here and its doc change together.
 */
const TABS: { key: string; label: string; render: () => ReactNode }[] = [
  { key: "table", label: "Table", render: () => <TableTab /> },
]

export function UiDocsPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const key = searchParams.get("tab")
  const tab = TABS.find((t) => t.key === key) ?? TABS[0]

  return (
    <div className="flex flex-col pb-16">
      <PageHeader className="pt-6 pb-4" title="UI" />
      <TabNavigation className="mb-8">
        {TABS.map((t) => (
          <TabNavigationLink
            key={t.key}
            active={t.key === tab.key}
            onClick={() =>
              replaceUrl(
                t.key === TABS[0].key ? pathname : `${pathname}?tab=${t.key}`,
              )
            }
            showLeadingIcon={false}
          >
            {t.label}
          </TabNavigationLink>
        ))}
      </TabNavigation>
      {tab.render()}
    </div>
  )
}

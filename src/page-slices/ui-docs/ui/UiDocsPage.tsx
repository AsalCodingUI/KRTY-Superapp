"use client"

import { PageHeader } from "@/components/page-header"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { Spinner } from "@/components/ui/spinner"
import { replaceUrl } from "@/shared/lib/url-params"
import dynamic from "next/dynamic"
import { usePathname, useSearchParams } from "next/navigation"
import type { ComponentType } from "react"

/**
 * /ui: the app's UI rules, one tab per doc (docs/ui/<key>.md), each shown
 * live on mock data. A tab and its doc change together. Each tab loads
 * only when opened, so the page stays light.
 */
const loading = () => (
  <div className="flex justify-center py-16">
    <Spinner className="size-6" />
  </div>
)
const tab = (load: () => Promise<ComponentType>) => dynamic(load, { loading })

const TABS: { key: string; label: string; Tab: ComponentType }[] = [
  // Foundations, smallest first.
  {
    key: "typography",
    label: "Typography",
    Tab: tab(() => import("./TypographyTab").then((m) => m.TypographyTab)),
  },
  {
    key: "color",
    label: "Color",
    Tab: tab(() => import("./ColorTab").then((m) => m.ColorTab)),
  },
  {
    key: "radius",
    label: "Radius",
    Tab: tab(() => import("./RadiusTab").then((m) => m.RadiusTab)),
  },
  {
    key: "spacing",
    label: "Spacing",
    Tab: tab(() => import("./SpacingTab").then((m) => m.SpacingTab)),
  },
  {
    key: "elevation",
    label: "Elevation",
    Tab: tab(() => import("./ElevationTab").then((m) => m.ElevationTab)),
  },
  {
    key: "motion",
    label: "Motion",
    Tab: tab(() => import("./MotionTab").then((m) => m.MotionTab)),
  },
  {
    key: "icons",
    label: "Icons",
    Tab: tab(() => import("./IconsTab").then((m) => m.IconsTab)),
  },
  // Components.
  {
    key: "button",
    label: "Button",
    Tab: tab(() => import("./ButtonTab").then((m) => m.ButtonTab)),
  },
  {
    key: "badge",
    label: "Badge",
    Tab: tab(() => import("./BadgeTab").then((m) => m.BadgeTab)),
  },
  {
    key: "form",
    label: "Form",
    Tab: tab(() => import("./FormTab").then((m) => m.FormTab)),
  },
  {
    key: "table",
    label: "Table",
    Tab: tab(() => import("./TableTab").then((m) => m.TableTab)),
  },
  {
    key: "navigation",
    label: "Navigation",
    Tab: tab(() => import("./NavigationTab").then((m) => m.NavigationTab)),
  },
  {
    key: "overlay",
    label: "Overlay",
    Tab: tab(() => import("./OverlayTab").then((m) => m.OverlayTab)),
  },
  {
    key: "feedback",
    label: "Feedback",
    Tab: tab(() => import("./FeedbackTab").then((m) => m.FeedbackTab)),
  },
  {
    key: "layout",
    label: "Layout",
    Tab: tab(() => import("./LayoutTab").then((m) => m.LayoutTab)),
  },
  {
    key: "components",
    label: "Components",
    Tab: tab(() => import("./ComponentsTab").then((m) => m.ComponentsTab)),
  },
]

export function UiDocsPage() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const key = searchParams.get("tab")
  const current = TABS.find((t) => t.key === key) ?? TABS[0]
  const { Tab } = current

  return (
    <div className="flex flex-col pb-16">
      <PageHeader className="pt-6 pb-4" title="UI" />
      <TabNavigation className="mb-8">
        {TABS.map((t) => (
          <TabNavigationLink
            key={t.key}
            active={t.key === current.key}
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
      <Tab />
    </div>
  )
}

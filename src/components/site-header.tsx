"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { navigationConfig } from "@/shared/config/navigation"
import { Notifications } from "@/widgets/notifications/ui/Notifications"
import { usePathname } from "next/navigation"

/** Current section name, taken from the navigation config (fallback: path). */
function useSectionTitle() {
  const pathname = usePathname()
  const items = [...navigationConfig.main, ...navigationConfig.footer]
  const match = items
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]
  if (match) return match.name
  if (pathname.startsWith("/settings")) return "Settings"
  const seg = pathname.split("/").filter(Boolean)[0] ?? "dashboard"
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ")
}

export function SiteHeader() {
  const title = useSectionTitle()

  return (
    <header className="flex h-12 shrink-0 items-center gap-2">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <Notifications variant="icon" />
        </div>
      </div>
    </header>
  )
}

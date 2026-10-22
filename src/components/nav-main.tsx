"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Collapse } from "@/components/ui/collapse"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import { PrefetchLink } from "@/components/prefetch-link"
import { memo, useEffect, useState } from "react"

/** Count of things waiting on this page; hidden when zero. */
function NavBadge({ count }: { count?: number }) {
  if (!count) return null
  return (
    <span className="bg-primary/15 text-primary ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums group-data-[collapsible=icon]:hidden">
      {count > 99 ? "99+" : count}
    </span>
  )
}

/** Memoized: the sidebar passes a memoized `items` array. */
export const NavMain = memo(function NavMain({
  label,
  items,
}: {
  label?: string
  items: {
    title: string
    url: string
    icon: React.ReactNode
    isActive?: boolean
    badge?: number
    /** Page tabs; listed under the page while it is open. */
    items?: {
      title: string
      url: string
      isActive?: boolean
      badge?: number
    }[]
  }[]
}) {
  const [collapsed, setCollapsed] = useCollapsedNav()

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const nested = (item.items?.length ?? 0) > 1
          const open = nested && !collapsed.includes(item.url)
          const childActive = item.items?.some((sub) => sub.isActive) ?? false
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                // With the tabs listed, the active tab is highlighted instead.
                isActive={item.isActive && !(open && childActive)}
                className={nested ? "pr-8" : undefined}
                render={<PrefetchLink href={item.url} />}
              >
                {item.icon}
                <span className="truncate">{item.title}</span>
                {/* The tabs show their own counts while listed. */}
                {!open && (
                  <NavBadge
                    count={
                      item.badge ??
                      item.items?.reduce((n, sub) => n + (sub.badge ?? 0), 0)
                    }
                  />
                )}
              </SidebarMenuButton>
              {nested && (
                <SidebarMenuAction
                  aria-label={
                    open ? `Tutup ${item.title}` : `Buka ${item.title}`
                  }
                  aria-expanded={open}
                  className="text-muted-foreground top-1.5! right-1.5"
                  onClick={() =>
                    setCollapsed(
                      open
                        ? [...collapsed, item.url]
                        : collapsed.filter((url) => url !== item.url),
                    )
                  }
                >
                  <ChevronRight
                    className={cn("transition-transform", open && "rotate-90")}
                  />
                </SidebarMenuAction>
              )}
              {nested && (
                <Collapse open={open}>
                  <SidebarMenuSub>
                    {item.items!.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.url}>
                        <SidebarMenuSubButton
                          isActive={subItem.isActive}
                          // Line the badge up with the parent row's chevron.
                          className={subItem.badge ? "pr-1.5" : undefined}
                          render={<PrefetchLink href={subItem.url} />}
                        >
                          <span className="truncate">{subItem.title}</span>
                          <NavBadge count={subItem.badge} />
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </Collapse>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
})

const COLLAPSED_KEY = "sidebar_collapsed_items"

/** Nested items are open by default; the ones closed are remembered. */
function useCollapsedNav() {
  const [collapsed, setCollapsedState] = useState<string[]>([])
  useEffect(() => {
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(COLLAPSED_KEY) ?? "[]",
      )
      if (Array.isArray(saved)) setCollapsedState(saved)
    } catch {
      // Storage blocked or bad value: everything stays open.
    }
  }, [])
  const setCollapsed = (next: string[]) => {
    setCollapsedState(next)
    try {
      window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next))
    } catch {
      // Storage blocked: the choice lasts for this visit only.
    }
  }
  return [collapsed, setCollapsed] as const
}

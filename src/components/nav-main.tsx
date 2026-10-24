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
import { SlidingIndicator } from "@/components/sliding-indicator"
import { cn } from "@/lib/utils"
import { ChevronRight } from "@/components/icons"
import { PrefetchLink } from "@/components/prefetch-link"
import { useT } from "@/shared/i18n/client"
import { usePathname } from "next/navigation"
import { memo, useEffect, useRef, useState } from "react"

/**
 * Count of things waiting on this page; hidden when zero. It pops when the
 * count goes up while you're here (not on first load), so new work is seen.
 */
function NavBadge({ count }: { count?: number }) {
  const previous = useRef(count)
  const [pops, setPops] = useState(0)
  useEffect(() => {
    if (
      (count ?? 0) > (previous.current ?? 0) &&
      previous.current !== undefined
    )
      setPops((n) => n + 1)
    previous.current = count
  }, [count])

  if (!count) return null
  return (
    <span
      key={pops}
      className={cn(
        "bg-foreground/[0.08] text-foreground/70 blend-ink ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums group-data-[collapsible=icon]:hidden",
        pops > 0 && "animate-count-pop motion-reduce:animate-none",
      )}
    >
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
  const t = useT("shell")
  // Only the group you're in is open; others open on demand (chevron) and
  // close again when you move on, so the menu stays short.
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>([])
  useEffect(() => setExpanded([]), [pathname])

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu className="relative">
        {/* The active page's fill slides between rows (parents and tabs). */}
        <SlidingIndicator
          activeSelector="[data-active]"
          className="bg-sidebar-active blend-light rounded-full"
          shadowClassName="rounded-full shadow-(--elev-2)"
        />
        {items.map((item) => {
          const nested = (item.items?.length ?? 0) > 1
          const childActive = item.items?.some((sub) => sub.isActive) ?? false
          const here = Boolean(item.isActive) || childActive
          const open =
            nested &&
            (here ? !collapsed.includes(item.url) : expanded.includes(item.url))
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                // With the tabs listed, the active tab is highlighted instead.
                isActive={item.isActive && !(open && childActive)}
                className={cn(
                  "not-data-active:blend-ink data-active:bg-transparent",
                  nested && "pr-8",
                )}
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
                    open
                      ? t("navCollapse", { name: item.title })
                      : t("navExpand", { name: item.title })
                  }
                  aria-expanded={open}
                  className="text-muted-foreground top-1.5! right-1.5"
                  onClick={() => {
                    // The current group remembers being closed; others
                    // just toggle for this visit.
                    if (here)
                      setCollapsed(
                        open
                          ? [...collapsed, item.url]
                          : collapsed.filter((url) => url !== item.url),
                      )
                    else
                      setExpanded(
                        open
                          ? expanded.filter((url) => url !== item.url)
                          : [...expanded, item.url],
                      )
                  }}
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
                          className={cn(
                            "not-data-active:blend-ink data-active:bg-transparent",
                            subItem.badge && "pr-1.5",
                          )}
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

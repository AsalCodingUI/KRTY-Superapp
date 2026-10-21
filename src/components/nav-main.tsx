"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

/** Count of things waiting on this page; hidden when zero. */
function NavBadge({ count }: { count?: number }) {
  if (!count) return null
  return (
    <span className="bg-primary/15 text-primary ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums group-data-[collapsible=icon]:hidden">
      {count > 99 ? "99+" : count}
    </span>
  )
}

export function NavMain({
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
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          // With 2+ tabs the active tab is highlighted instead of the page.
          const showSub = Boolean(
            item.isActive && (item.items?.length ?? 0) > 1,
          )
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={item.isActive && !showSub}
                render={<Link href={item.url} prefetch={false} />}
              >
                {item.icon}
                <span className="truncate">{item.title}</span>
                {/* The tabs show their own counts while listed. */}
                {!showSub && (
                  <NavBadge
                    count={
                      item.badge ??
                      item.items?.reduce((n, sub) => n + (sub.badge ?? 0), 0)
                    }
                  />
                )}
              </SidebarMenuButton>
              {showSub && (
                <SidebarMenuSub>
                  {item.items!.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.url}>
                      <SidebarMenuSubButton
                        isActive={subItem.isActive}
                        render={<Link href={subItem.url} prefetch={false} />}
                      >
                        <span className="truncate">{subItem.title}</span>
                        <NavBadge count={subItem.badge} />
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

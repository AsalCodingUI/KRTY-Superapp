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
    /** Page tabs; listed under the page while it is open. */
    items?: {
      title: string
      url: string
      isActive?: boolean
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
                <span>{item.title}</span>
              </SidebarMenuButton>
              {showSub && (
                <SidebarMenuSub>
                  {item.items!.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.url}>
                      <SidebarMenuSubButton
                        isActive={subItem.isActive}
                        render={<Link href={subItem.url} prefetch={false} />}
                      >
                        <span>{subItem.title}</span>
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

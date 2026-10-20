"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Bell as BellIcon,
  ChevronsUpDown as ChevronsUpDownIcon,
  Logout as LogOutIcon,
  MessageCircle as MessageCircleIcon,
} from "@/components/icons"
import Link from "next/link"

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "KR"
  )
}

export function NavUser({
  user,
  onSignOut,
  contactHref,
}: {
  user: {
    name: string
    email: string
    avatar?: string
  }
  onSignOut: () => void
  contactHref?: string
}) {
  const initials = initialsOf(user.name)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            // Stable id: sidebar content differs between SSR and hydration while
            // the profile loads, which shifted Base UI's generated ids.
            id="nav-user-menu-trigger"
            render={
              <SidebarMenuButton className="aria-expanded:bg-sidebar-accent h-8" />
            }
          >
            <Avatar className="size-5">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-[10px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate font-medium">{user.name}</span>
            <ChevronsUpDownIcon className="text-muted-foreground ml-auto size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/notifications" />}>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
              {contactHref && (
                <DropdownMenuItem
                  onClick={() =>
                    window.open(contactHref, "_blank", "noopener,noreferrer")
                  }
                >
                  <MessageCircleIcon />
                  Contact Admin
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onSignOut}>
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

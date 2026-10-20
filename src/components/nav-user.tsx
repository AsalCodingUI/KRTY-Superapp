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
  Settings as SettingsIcon,
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
              <SidebarMenuButton className="aria-expanded:bg-sidebar-accent size-8! justify-center p-0!" />
            }
          >
            <Avatar className="size-6">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="sr-only">{user.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side="right"
            align="end"
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
              <DropdownMenuItem render={<Link href="/settings/general" />}>
                <SettingsIcon />
                Settings
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

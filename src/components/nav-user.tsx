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
  ArrowLeft as UndoIcon,
  Logout as LogOutIcon,
  MessageCircle as MessageCircleIcon,
} from "@/components/icons"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useStopImpersonation } from "@/widgets/impersonation/model/useStopImpersonation"

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
  showName = false,
  side = "right",
}: {
  user: {
    name: string
    email: string
    avatar?: string
  }
  onSignOut: () => void
  contactHref?: string
  /** Show the name next to the avatar (top bar). */
  showName?: boolean
  side?: "right" | "bottom"
}) {
  const initials = initialsOf(user.name)
  const { isImpersonating } = useUserProfile()
  const { stop: stopImpersonation } = useStopImpersonation()

  return (
    // Centred in the rail.
    <SidebarMenu className={showName ? "w-auto" : "items-center"}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            // Stable id: sidebar content differs between SSR and hydration while
            // the profile loads, which shifted Base UI's generated ids.
            id="nav-user-menu-trigger"
            render={
              <SidebarMenuButton
                className={
                  showName
                    ? "text-foreground h-8 w-auto gap-2 px-1.5 hover:bg-transparent active:bg-transparent aria-expanded:bg-transparent"
                    : "aria-expanded:bg-sidebar-accent size-8! justify-center p-0!"
                }
              />
            }
          >
            <Avatar className="size-6">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-[10px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span
              className={
                showName
                  ? "hidden max-w-40 truncate text-sm font-medium lg:inline"
                  : "sr-only"
              }
            >
              {user.name}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={side}
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
              {isImpersonating && (
                <DropdownMenuItem onClick={stopImpersonation}>
                  <UndoIcon />
                  Kembali ke akun saya
                </DropdownMenuItem>
              )}
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

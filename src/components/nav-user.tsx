"use client"

import { useT } from "@/shared/i18n/client"
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
  Download as DownloadIcon,
  Logout as LogOutIcon,
  MessageCircle as MessageCircleIcon,
  User as UserIcon,
} from "@/components/icons"
import { useDesktopShell } from "@/components/desktop-shell"
import { useMacDownload } from "@/components/mac-download"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useStopImpersonation } from "@/widgets/impersonation/model/useStopImpersonation"
import { ProfileSheet } from "@/widgets/profile/ui/ProfileSheet"
import { ContextTarget, copyText } from "@/shared/context-menu"
import { Copy } from "@/components/icons"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { devicePlatform } from "@/shared/lib/desktop-app"

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
  const t = useT("common")
  const tp = useT("profile")
  const tc = useT("ctxmenu")
  const [profileOpen, setProfileOpen] = useState(false)
  const { isImpersonating } = useUserProfile()
  const { stop: stopImpersonation } = useStopImpersonation()
  const td = useT("desktopApp")
  // Inside Kretya Flow: its settings page; on the web: get the app.
  const desktop = useDesktopShell()
  const macDownload = useMacDownload()
  // After mount (the server can't tell): the Windows app on a Windows PC.
  const [windowsPc, setWindowsPc] = useState(false)
  useEffect(() => setWindowsPc(devicePlatform() === "windows"), [])

  return (
    // Centred in the rail.
    <SidebarMenu className={showName ? "w-auto" : "items-center"}>
      <SidebarMenuItem>
        <DropdownMenu>
          {/* Right-click: the account's actions without opening the menu. */}
          <ContextTarget
            type="account"
            label={user.email || user.name}
            items={() => [
              {
                id: "profile",
                label: tp("myProfile"),
                icon: UserIcon,
                onSelect: () => setProfileOpen(true),
              },
              {
                id: "copy-email",
                label: tc("copyEmail"),
                icon: Copy,
                hidden: !user.email,
                onSelect: async () => {
                  if (await copyText(user.email)) toast.success(tc("copied"))
                },
              },
              {
                id: "contact",
                label: t("contactAdmin"),
                icon: MessageCircleIcon,
                hidden: !contactHref,
                onSelect: () =>
                  void window.open(
                    contactHref,
                    "_blank",
                    "noopener,noreferrer",
                  ),
              },
              {
                id: "back-to-me",
                label: t("backToMyAccount"),
                icon: UndoIcon,
                hidden: !isImpersonating,
                onSelect: stopImpersonation,
              },
              {
                id: "logout",
                label: t("logOut"),
                icon: LogOutIcon,
                destructive: true,
                confirm: true,
                onSelect: onSignOut,
              },
            ]}
          >
            <DropdownMenuTrigger
              // Stable id: sidebar content differs between SSR and hydration while
              // the profile loads, which shifted Base UI's generated ids.
              id="nav-user-menu-trigger"
              render={
                <SidebarMenuButton
                  className={
                    showName
                      ? "text-foreground h-8 w-auto gap-2 pr-3 pl-1 hover:bg-transparent active:bg-transparent aria-expanded:bg-transparent"
                      : "aria-expanded:bg-sidebar-accent blend-ink size-8! justify-center p-0!"
                  }
                />
              }
            >
              <Avatar className="size-6">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-chrome-field blend-ink text-muted-foreground text-[10px]">
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
          </ContextTarget>
          <DropdownMenuContent
            className="min-w-56"
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
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <UserIcon />
                {tp("myProfile")}
              </DropdownMenuItem>
              {contactHref && (
                <DropdownMenuItem
                  onClick={() =>
                    window.open(contactHref, "_blank", "noopener,noreferrer")
                  }
                >
                  <MessageCircleIcon />
                  {t("contactAdmin")}
                </DropdownMenuItem>
              )}
              {/* In the Mac app its settings sit at the sidebar's bottom. */}
              {!desktop && (
                <DropdownMenuItem
                  className="max-md:hidden"
                  onClick={() => void macDownload.start("install")}
                >
                  <DownloadIcon />
                  {windowsPc
                    ? td("menuDownloadWindows")
                    : td("menuDownloadMac")}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {isImpersonating && (
                <DropdownMenuItem onClick={stopImpersonation}>
                  <UndoIcon />
                  {t("backToMyAccount")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onSignOut}>
                <LogOutIcon />
                {t("logOut")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
        {macDownload.dialog}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

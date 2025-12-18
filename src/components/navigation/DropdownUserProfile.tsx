"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSubMenu,
  DropdownMenuSubMenuContent,
  DropdownMenuSubMenuTrigger,
  DropdownMenuTrigger,
} from "@/components/Dropdown"
import { useUserProfile } from "@/hooks/useUserProfile"
import { createClient } from "@/lib/supabase/client"
import {
  RiComputerLine,
  RiExternalLinkLine,
  RiMoonLine,
  RiSunLine,
  RiWhatsappLine,
} from "@remixicon/react"
import { useTheme } from "next-themes"
import * as React from "react"

export type DropdownUserProfileProps = {
  children: React.ReactNode
  align?: "center" | "start" | "end"
}

export function DropdownUserProfile({
  children,
  align = "start",
}: DropdownUserProfileProps) {
  const { profile, userEmail } = useUserProfile()
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // Use window.location.href to force a full page reload and clear all state
    window.location.href = "/login"
  }

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const adminContactLink = "https://wa.me/6289525418707"

  const displayEmail = profile?.email || userEmail || "Guest"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

      <DropdownMenuContent align={align}>
        <DropdownMenuLabel>{displayEmail}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuSubMenu>
            <DropdownMenuSubMenuTrigger>Theme</DropdownMenuSubMenuTrigger>
            <DropdownMenuSubMenuContent>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={setTheme}
              >
                <DropdownMenuRadioItem value="light" iconType="check">
                  <RiSunLine className="size-4 shrink-0" aria-hidden="true" />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark" iconType="check">
                  <RiMoonLine className="size-4 shrink-0" aria-hidden="true" />
                  Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system" iconType="check">
                  <RiComputerLine className="size-4 shrink-0" aria-hidden="true" />
                  System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubMenuContent>
          </DropdownMenuSubMenu>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* FIX: Hapus prop 'asChild' di sini biar gak error */}
          <DropdownMenuItem>
            <a
              href={adminContactLink}
              target="_blank"
              rel="noopener noreferrer"
              // Tambahin w-full biar area klik-nya luas
              className="flex items-center w-full"
            >
              <RiWhatsappLine className="size-4 mr-2 shrink-0" aria-hidden="true" />
              Contact Admin
              <RiExternalLinkLine
                className="mb-1 ml-1 size-2.5 shrink-0 text-content-subtle"
                aria-hidden="true"
              />
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
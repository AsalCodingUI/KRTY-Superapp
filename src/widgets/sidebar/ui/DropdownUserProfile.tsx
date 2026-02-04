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
  DropdownMenuSub,
  DropdownMenuSubMenuContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/ui"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { createClient } from "@/shared/api/supabase/client"
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
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
            <DropdownMenuSubMenuContent>
              <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light">
                  <RiSunLine className="size-4 shrink-0" aria-hidden="true" />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <RiMoonLine className="size-4 shrink-0" aria-hidden="true" />
                  Dark
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <RiComputerLine
                    className="size-4 shrink-0"
                    aria-hidden="true"
                  />
                  System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubMenuContent>
          </DropdownMenuSub>
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
              className="flex w-full items-center"
            >
              <RiWhatsappLine
                className="mr-2 size-4 shrink-0"
                aria-hidden="true"
              />
              Contact Admin
              <RiExternalLinkLine
                className="text-content-subtle mb-1 ml-1 size-2.5 shrink-0"
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

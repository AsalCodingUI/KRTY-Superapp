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
} from "@/shared/ui/lucide-icons"
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
  const [isMobile, setIsMobile] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // Use window.location.href to force a full page reload and clear all state
    window.location.href = "/login"
  }

  React.useEffect(() => {
    setMounted(true)
    const updateMobile = () => setIsMobile(window.innerWidth < 1280)
    updateMobile()
    window.addEventListener("resize", updateMobile)
    return () => window.removeEventListener("resize", updateMobile)
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
        {isMobile ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="pt-0">Theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        ) : (
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
              <DropdownMenuSubMenuContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubMenuContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => window.open(adminContactLink, "_blank", "noopener,noreferrer")}
          >
            Contact Admin
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

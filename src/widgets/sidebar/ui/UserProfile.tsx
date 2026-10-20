"use client"

import { Button } from "@/components/ui/button"
import { cx, focusRing } from "@/shared/lib/utils"
import { RiMore2Fill } from "@/shared/ui/lucide-icons"

import { useUserProfile } from "@/shared/hooks/useUserProfile" // Import hook profil
import { DropdownUserProfile } from "./DropdownUserProfile"

export const UserProfileDesktop = () => {
  const { profile } = useUserProfile() // Ambil profil user

  // UPDATE LOGIC: Tambahkan .slice(0, 2) agar max 2 huruf
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2) // <--- Ambil 2 huruf pertama saja
        .join("")
        .toUpperCase()
    : "KR" // Default Kretya

  return (
    <DropdownUserProfile>
      <Button
        aria-label="User settings"
        variant="ghost"
        size="sm"
        className={cx(
          focusRing,
          "group text-label-md text-foreground hover:bg-muted data-[state=open]:bg-muted dark:hover:bg-muted flex w-full items-center justify-between rounded-md p-2",
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className="border-border bg-card text-body-xs text-muted-foreground dark:bg-card dark:text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            {initials}
          </span>
          <span className="truncate">{profile?.full_name ?? "Loading..."}</span>
        </span>
        <RiMore2Fill
          className="text-muted-foreground group-hover:text-muted-foreground group-hover:dark:text-muted-foreground/60 size-4 shrink-0"
          aria-hidden="true"
        />
      </Button>
    </DropdownUserProfile>
  )
}

export const UserProfileMobile = () => {
  const { profile } = useUserProfile()

  // UPDATE LOGIC: Tambahkan .slice(0, 2) agar max 2 huruf
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2) // <--- Ambil 2 huruf pertama saja
        .join("")
        .toUpperCase()
    : "KR"

  return (
    <DropdownUserProfile align="end">
      <Button
        aria-label="User settings"
        variant="ghost"
        size="sm"
        className={cx(
          "group text-label-md text-foreground hover:bg-muted data-[state=open]:bg-muted dark:hover:bg-muted flex items-center rounded-md p-1",
        )}
      >
        <span
          className="border-border bg-card text-body-xs text-muted-foreground dark:bg-card dark:text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full border"
          aria-hidden="true"
        >
          {initials}
        </span>
      </Button>
    </DropdownUserProfile>
  )
}

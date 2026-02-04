"use client"

import { Button } from "@/shared/ui";
import { cx, focusRing } from '@/shared/lib/utils';
import { RiMore2Fill } from "@remixicon/react";

import { useUserProfile } from '@/shared/hooks/useUserProfile'; // Import hook profil
import { DropdownUserProfile } from "./DropdownUserProfile";

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
        className={cx(
          focusRing,
          "group flex w-full items-center justify-between rounded-md p-2 text-sm font-medium text-content hover:bg-muted data-[state=open]:bg-muted dark:hover:bg-muted",
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xs text-content-subtle dark:bg-surface dark:text-content-subtle"
            aria-hidden="true"
          >
            {initials}
          </span>
          <span className="truncate">{profile?.full_name ?? "Loading..."}</span>
        </span>
        <RiMore2Fill
          className="size-4 shrink-0 text-content-subtle group-hover:text-content-subtle group-hover:dark:text-content-placeholder"
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
        className={cx(
          "group flex items-center rounded-md p-1 text-sm font-medium text-content hover:bg-muted data-[state=open]:bg-muted dark:hover:bg-muted",
        )}
      >
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xs text-content-subtle dark:bg-surface dark:text-content-subtle"
          aria-hidden="true"
        >
          {initials}
        </span>
      </Button>
    </DropdownUserProfile>
  )
}
"use client"

import { RiMore2Fill } from "@/shared/ui/lucide-icons"
import type { User } from "./types"
import { cx, focusRing } from "@/shared/lib/utils"
import { Button } from "@/components/ui/button"

export interface UserProfileProps {
  user: User | null
  loading?: boolean
  variant?: "desktop" | "mobile"
}

export function UserProfile({
  user,
  loading = false,
  variant = "desktop",
}: UserProfileProps) {
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "KR"

  if (variant === "mobile") {
    return (
      <Button
        aria-label="User settings"
        variant="ghost"
        className={cx(
          "group text-foreground hover:bg-muted data-popup-open:bg-muted dark:hover:bg-muted flex items-center rounded-md p-1 text-sm font-medium",
        )}
      >
        <span
          className="border-border text-muted-foreground dark:text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full border text-xs"
          aria-hidden="true"
        >
          {initials}
        </span>
      </Button>
    )
  }

  return (
    <Button
      aria-label="User settings"
      variant="ghost"
      className={cx(
        focusRing,
        "group text-foreground hover:bg-muted data-popup-open:bg-muted dark:hover:bg-muted flex w-full items-center justify-between rounded-md p-2 text-sm font-medium",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className="border-border text-muted-foreground dark:text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full border text-xs"
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="truncate">
          {loading ? "Loading..." : (user?.full_name ?? "Guest")}
        </span>
      </span>
      <RiMore2Fill
        className="text-muted-foreground group-hover:text-muted-foreground group-hover:dark:text-muted-foreground/60 size-4 shrink-0"
        aria-hidden="true"
      />
    </Button>
  )
}

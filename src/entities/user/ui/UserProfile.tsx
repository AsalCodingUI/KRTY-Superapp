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
    )
  }

  return (
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

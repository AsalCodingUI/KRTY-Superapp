"use client"

import { RiMore2Fill } from "@/shared/ui/lucide-icons"
import type { User } from "./types"
import { cx, focusRing } from "@/shared/lib/utils"
import { Button } from "@/components/ui/button"
import { useT } from "@/shared/i18n/client"
import { initials } from "@/shared/lib/initials"

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
  const t = useT("teams")
  const tc = useT("common")
  const letters = initials(user?.full_name, "KR")

  if (variant === "mobile") {
    return (
      <Button
        aria-label={t("userSettings")}
        variant="ghost"
        className={cx(
          "group text-foreground hover:bg-muted data-popup-open:bg-muted dark:hover:bg-muted flex items-center rounded-md p-1 text-sm font-medium",
        )}
      >
        <span
          className="border-border text-muted-foreground dark:text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full border text-xs"
          aria-hidden="true"
        >
          {letters}
        </span>
      </Button>
    )
  }

  return (
    <Button
      aria-label={t("userSettings")}
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
          {letters}
        </span>
        <span className="truncate">
          {loading ? tc("loading") : (user?.full_name ?? t("guest"))}
        </span>
      </span>
      <RiMore2Fill
        className="text-muted-foreground group-hover:text-muted-foreground group-hover:dark:text-tertiary-foreground size-4 shrink-0"
        aria-hidden="true"
      />
    </Button>
  )
}

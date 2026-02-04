"use client"

import { RiMore2Fill } from "@remixicon/react"
import type { User } from "./types"
import { cx, focusRing } from "@/shared/lib/utils"
import { Button } from "@/shared/ui";

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
                    "group flex items-center rounded-md p-1 text-sm font-medium text-content hover:bg-muted data-[state=open]:bg-muted dark:hover:bg-muted"
                )}
            >
                <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xs text-content-subtle dark:bg-surface dark:text-content-subtle"
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
                "group flex w-full items-center justify-between rounded-md p-2 text-sm font-medium text-content hover:bg-muted data-[state=open]:bg-muted dark:hover:bg-muted"
            )}
        >
            <span className="flex min-w-0 items-center gap-3">
                <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xs text-content-subtle dark:bg-surface dark:text-content-subtle"
                    aria-hidden="true"
                >
                    {initials}
                </span>
                <span className="truncate">
                    {loading ? "Loading..." : user?.full_name ?? "Guest"}
                </span>
            </span>
            <RiMore2Fill
                className="size-4 shrink-0 text-content-subtle group-hover:text-content-subtle group-hover:dark:text-content-placeholder"
                aria-hidden="true"
            />
        </Button>
    )
}

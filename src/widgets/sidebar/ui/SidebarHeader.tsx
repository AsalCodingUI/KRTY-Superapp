"use client"

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { Notifications } from "@/widgets/notifications/ui/Notifications"

export function SidebarHeader() {
    const { profile } = useUserProfile()

    const initials = profile?.full_name
        ? profile.full_name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
        : "AD"

    return (
        <div className="flex w-full items-center justify-between gap-2 px-3 pb-2 pt-3 transition-colors duration-200">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md">
                <div className="text-label-xs flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-brand-light text-foreground-brand-dark">
                    {initials}
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-start px-1">
                    <span className="text-label-sm text-content block w-full min-w-0 truncate">
                        {profile?.full_name ?? "Asal Design"}
                    </span>
                </div>
            </div>

            <Notifications variant="icon" />
        </div>
    )
}

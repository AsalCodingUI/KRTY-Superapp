"use client"

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { RiNotification3Line } from "@remixicon/react"

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
        <div className="flex w-full items-center justify-between gap-2 p-2 transition-colors duration-200">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[8px]">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#ebf8ff] text-[12px] font-medium text-[#0046b7]">
                    {initials}
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-start px-1">
                    <span className="truncate text-[13px] font-medium leading-5 text-content">
                        {profile?.full_name ?? "Asal Design"}
                    </span>
                </div>
            </div>

            <button
                type="button"
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-content-subtle hover:text-content hover:bg-surface-neutral-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Notifications"
            >
                <RiNotification3Line className="size-4" />
            </button>
        </div>
    )
}

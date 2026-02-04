"use client"

import type { User } from "../model/types"
import { UserAvatar } from "./UserAvatar"
import { Card } from "@/shared/ui";

export interface UserCardProps {
    user: User
    className?: string
    showEmail?: boolean
    showJobTitle?: boolean
    size?: "sm" | "md" | "lg"
}

export function UserCard({
    user,
    className,
    showEmail = true,
    showJobTitle = true,
    size = "md",
}: UserCardProps) {
    const initials = user.full_name
        ? user.full_name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
        : "?"

    const avatarSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "md"

    return (
        <Card className={className}>
            <div className="flex items-center gap-3 p-4">
                <UserAvatar
                    src={user.avatar_url || undefined}
                    initials={initials}
                    alt={user.full_name || "User"}
                    size={avatarSize}
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content truncate">
                        {user.full_name || "Unknown User"}
                    </p>
                    {showEmail && user.email && (
                        <p className="text-xs text-content-subtle truncate">{user.email}</p>
                    )}
                    {showJobTitle && user.job_title && (
                        <p className="text-xs text-content-placeholder truncate">
                            {user.job_title}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    )
}

"use client"

import { EmptyState } from "@/components/empty-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { RiFileList3Line } from "@/shared/ui/lucide-icons"
import { formatDistanceToNow } from "date-fns"

interface Activity {
  id: string
  type:
    | "review"
    | "leave_request"
    | "leave_approved"
    | "leave_rejected"
    | "project_assigned"
  user_name: string | null
  user_avatar: string | null
  description: string
  timestamp: string
}

interface AdminRecentActivitiesProps {
  activities: Activity[]
}

export function AdminRecentActivities({
  activities,
}: AdminRecentActivitiesProps) {
  return (
    <Card className="gap-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-foreground text-sm font-medium">Activity Feed</p>
        <span className="text-muted-foreground/70 text-xs tabular-nums">
          {activities.length} items
        </span>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={<RiFileList3Line className="size-5" />}
          title="Belum ada aktivitas"
          description="Aktivitas terbaru tim akan muncul di sini."
          placement="inner"
          className="min-h-[160px] px-0 py-6"
        />
      ) : (
        <div className="divide-border divide-y">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="hover:bg-accent -mx-3 flex items-start gap-3 rounded-md px-3 py-2 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <Avatar className="size-5">
                    <AvatarImage src={activity.user_avatar || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {activity.user_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-foreground text-sm font-medium">
                      <span className="font-medium">
                        {activity.user_name || "Unknown"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {activity.description}
                      </span>
                    </p>
                    <p className="text-muted-foreground/70 mt-0.5 text-xs">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

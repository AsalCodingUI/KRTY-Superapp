"use client"

import { Avatar, Card, EmptyState } from "@/shared/ui"
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
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-label-md text-foreground-secondary">Activity Feed</p>
        <span className="text-body-xs text-foreground-tertiary tabular-nums">
          {activities.length} items
        </span>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={<RiFileList3Line className="size-5" />}
          title="No recent activities"
          description="Recent team activity will appear here."
          placement="inner"
          className="min-h-[160px] px-0 py-6"
        />
      ) : (
        <div className="border-neutral-primary divide-neutral-primary overflow-hidden rounded-lg border divide-y">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="hover:bg-surface-neutral-secondary flex items-start gap-3 px-3 py-2 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <Avatar
                    size="xs"
                    initials={activity.user_name?.[0] || "?"}
                    src={activity.user_avatar || undefined}
                  />
                  <div className="flex-1">
                    <p className="text-label-md text-foreground-primary">
                      <span className="font-medium">
                        {activity.user_name || "Unknown"}
                      </span>{" "}
                      <span className="text-foreground-secondary">
                        {activity.description}
                      </span>
                    </p>
                    <p className="text-body-xs text-foreground-tertiary mt-0.5">
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

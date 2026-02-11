"use client"

import { Avatar, Badge } from "@/shared/ui"
import { Card } from "@/shared/ui"
import {
  RiCalendarEventLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiFileTextLine,
  RiFolderLine,
} from "@/shared/ui/lucide-icons"
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
  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "review":
        return <RiFileTextLine className="text-foreground-brand-primary size-4" />
      case "leave_request":
        return <RiCalendarEventLine className="text-warning size-4" />
      case "leave_approved":
        return <RiCheckLine className="text-success size-4" />
      case "leave_rejected":
        return <RiCloseCircleLine className="text-danger size-4" />
      case "project_assigned":
        return <RiFolderLine className="text-info size-4" />
      default:
        return <RiFileTextLine className="size-4" />
    }
  }

  const getActivityBgColor = (type: Activity["type"]) => {
    switch (type) {
      case "review":
        return "bg-primary/10"
      case "leave_request":
        return "bg-warning/10"
      case "leave_approved":
        return "bg-success/10"
      case "leave_rejected":
        return "bg-danger/10"
      case "project_assigned":
        return "bg-info/10"
      default:
        return "bg-surface-neutral-secondary"
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-heading-md text-foreground-primary">
          Recent Activities
        </h3>
        <Badge variant="zinc">{activities.length}</Badge>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-body-sm text-foreground-secondary">
            No recent activities
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="border-neutral-primary bg-surface-neutral-secondary flex items-start gap-3 rounded-lg border p-3"
            >
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${getActivityBgColor(activity.type)}`}
              >
                {getActivityIcon(activity.type)}
              </div>

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

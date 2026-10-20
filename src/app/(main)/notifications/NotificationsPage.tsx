"use client"

import { useNotifications } from "@/shared/hooks/useNotifications"
import { cx } from "@/shared/lib/utils"
import { EmptyState } from "@/components/empty-state"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RiDeleteBinLine, RiNotification3Line } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { useState, type MouseEvent as ReactMouseEvent } from "react"

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()
  const [activeTab, setActiveTab] = useState<"unread" | "all">("unread")

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications

  const handleDelete = (event: ReactMouseEvent, id: string) => {
    event.preventDefault()
    event.stopPropagation()
    deleteNotification(id)
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 pb-4">
        <h1 className="text-foreground truncate text-xl font-semibold tracking-tight">
          Notifications
        </h1>
        {unreadCount > 0 && <Badge variant="info">{unreadCount}</Badge>}
      </div>

      <div className="flex flex-col">
        <div className="border-border border-b">
          <TabNavigation className="border-b-0">
            <TabNavigationLink
              active={activeTab === "unread"}
              onClick={() => setActiveTab("unread")}
            >
              Unread
            </TabNavigationLink>
            <TabNavigationLink
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
            >
              All
            </TabNavigationLink>
          </TabNavigation>
        </div>

        <div
          className={cx("py-3 sm:py-4", unreadCount > 0 ? "pb-24 sm:pb-5" : "")}
        >
          {filteredNotifications.length === 0 ? (
            <EmptyState
              title="No notifications"
              description="Nothing new in this tab."
              icon={<RiNotification3Line className="size-5" />}
              placement="inner"
            />
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.link || "#"}
                  onClick={() => markAsRead(notification.id)}
                  className={cx(
                    "hover:bg-muted block rounded-md px-3 py-3 transition-colors",
                    !notification.is_read ? "bg-primary/10" : "",
                  )}
                >
                  <div className="flex gap-3">
                    <div
                      className={cx(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        !notification.is_read ? "bg-primary" : "bg-transparent",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground text-label-md">
                        {notification.title}
                      </p>
                      <p className="text-muted-foreground text-body-sm mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-muted-foreground/70 text-body-xs mt-2">
                        {new Date(
                          notification.created_at || "",
                        ).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(event) => handleDelete(event, notification.id)}
                      className="text-muted-foreground/70 hover:text-foreground hover:bg-muted mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md"
                      aria-label="Delete notification"
                    >
                      <RiDeleteBinLine className="size-4" />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {unreadCount > 0 && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] left-1/2 z-[60] -translate-x-1/2 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead()}
            className="shadow-regular-lg rounded-full"
          >
            Mark all as read
          </Button>
        </div>
      )}
    </div>
  )
}

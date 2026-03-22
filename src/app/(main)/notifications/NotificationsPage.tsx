"use client"

import { useNotifications } from "@/shared/hooks/useNotifications"
import { cx } from "@/shared/lib/utils"
import {
  Badge,
  Button,
  EmptyState,
  TabNavigation,
  TabNavigationLink,
} from "@/shared/ui"
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
      <div className="rounded-xxl flex items-center gap-2 px-4 pt-4 pb-3 sm:px-5">
        <RiNotification3Line className="text-foreground-secondary size-4" />
        <p className="text-label-md text-foreground-primary">Notifications</p>
        {unreadCount > 0 && (
          <Badge size="sm" variant="info">
            {unreadCount}
          </Badge>
        )}
      </div>

      <div className="bg-surface-neutral-primary rounded-xxl flex flex-col">
        <div className="border-neutral-primary border-b px-4 pt-3 sm:px-5">
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
          className={cx(
            "p-3 sm:p-5",
            unreadCount > 0 ? "pb-24 sm:pb-5" : "",
          )}
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
                    "hover:bg-surface-neutral-secondary block rounded-md px-3 py-3 transition-colors",
                    !notification.is_read ? "bg-surface-brand-light" : "",
                  )}
                >
                  <div className="flex gap-3">
                    <div
                      className={cx(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        !notification.is_read
                          ? "bg-surface-brand"
                          : "bg-transparent",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground-primary text-label-md">
                        {notification.title}
                      </p>
                      <p className="text-foreground-secondary text-body-sm mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-foreground-tertiary text-body-xs mt-2">
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
                      className="text-foreground-tertiary hover:text-foreground-primary hover:bg-surface-neutral-secondary mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md"
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
            variant="secondary"
            size="sm"
            onClick={() => markAllAsRead()}
            className="rounded-full shadow-regular-lg"
          >
            Mark all as read
          </Button>
        </div>
      )}
    </div>
  )
}

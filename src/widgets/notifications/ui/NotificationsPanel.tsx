"use client"

import type { useNotifications } from "@/shared/hooks/useNotifications"
import { EmptyState } from "@/components/empty-state"
import { SegmentedControl } from "@/components/segmented-control"
import { Button } from "@/components/ui/button"
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { RiDeleteBinLine, RiNotification3Line } from "@/shared/ui/lucide-icons"
import { format, formatDistanceToNowStrict } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { useMemo, useState, type MouseEvent as ReactMouseEvent } from "react"

type NotificationsApi = ReturnType<typeof useNotifications>

export interface NotificationsPanelProps extends Pick<
  NotificationsApi,
  | "notifications"
  | "unreadCount"
  | "markAsRead"
  | "markAllAsRead"
  | "deleteNotification"
> {
  onClose: () => void
}

/**
 * Notification drawer body. Loaded on demand (first hover/focus/open of the
 * bell) so the topbar doesn't ship the list on every page.
 */
export default function NotificationsPanel({
  onClose,
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
}: NotificationsPanelProps) {
  const [activeTab, setActiveTab] = useState<"unread" | "all">("unread")

  const filteredNotifications = useMemo(
    () =>
      activeTab === "unread"
        ? notifications.filter((n) => !n.is_read)
        : notifications,
    [activeTab, notifications],
  )

  const handleDelete = (event: ReactMouseEvent, id: string) => {
    event.preventDefault()
    event.stopPropagation()
    deleteNotification(id)
  }

  return (
    <SheetContent className="w-full gap-0 sm:max-w-md">
      <SheetHeader>
        <SheetTitle>Notifikasi</SheetTitle>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => markAllAsRead()}
          >
            Baca semua
          </Button>
        )}
      </SheetHeader>

      <div className="shrink-0 px-5 pt-4 pb-3">
        <SegmentedControl
          value={activeTab}
          onChange={setActiveTab}
          items={[
            {
              value: "unread",
              label:
                unreadCount > 0
                  ? `Belum dibaca (${unreadCount})`
                  : "Belum dibaca",
            },
            { value: "all", label: "Semua" },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {filteredNotifications.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <EmptyState
              title={
                activeTab === "unread"
                  ? "Semua sudah dibaca"
                  : "Belum ada notifikasi"
              }
              description="Belum ada yang baru di sini."
              icon={<RiNotification3Line className="size-5" />}
              placement="inner"
            />
          </div>
        ) : (
          <ul className="flex flex-col">
            {filteredNotifications.map((notification) => {
              const created = notification.created_at
                ? new Date(notification.created_at)
                : null
              return (
                <li
                  key={notification.id}
                  className="group/notif hover:bg-muted relative flex gap-3 rounded-lg px-3 py-3 transition-colors"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      notification.is_read ? "bg-transparent" : "bg-primary",
                    )}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-baseline gap-2">
                      {/* The link covers the whole row; delete sits above it. */}
                      <Link
                        href={notification.link || "#"}
                        onClick={() => {
                          markAsRead(notification.id)
                          onClose()
                        }}
                        className={cn(
                          "focus-visible:after:ring-ring min-w-0 flex-1 truncate outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2",
                          notification.is_read
                            ? "text-muted-foreground"
                            : "text-foreground font-medium",
                        )}
                      >
                        {notification.title}
                        {!notification.is_read && (
                          <span className="sr-only"> (belum dibaca)</span>
                        )}
                      </Link>
                      {created && (
                        <time
                          dateTime={created.toISOString()}
                          title={format(created, "d MMM yyyy, HH:mm", {
                            locale: idLocale,
                          })}
                          className="text-tertiary-foreground shrink-0 text-xs tabular-nums"
                        >
                          {formatDistanceToNowStrict(created, {
                            addSuffix: true,
                            locale: idLocale,
                          })}
                        </time>
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-muted-foreground line-clamp-2 text-[13px]">
                        {notification.message}
                      </p>
                    )}
                  </div>
                  {/* Always visible on touch screens, hover-only from sm up. */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Hapus notifikasi"
                    title="Hapus"
                    className="relative z-10 -my-1 shrink-0 opacity-100 transition-opacity group-focus-within/notif:opacity-100 group-hover/notif:opacity-100 sm:opacity-0"
                    onClick={(event) => handleDelete(event, notification.id)}
                  >
                    <RiDeleteBinLine />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </SheetContent>
  )
}

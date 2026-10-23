"use client"

import { EmptyValue } from "@/components/empty-value"
import { PageHeader } from "@/components/page-header"
import { useNotifications } from "@/shared/hooks/useNotifications"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow, ListRowActions } from "@/components/grouped-list"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiDeleteBinLine, RiNotification3Line } from "@/shared/ui/lucide-icons"
import type { Locale } from "date-fns"
import { format, isThisYear, isToday } from "date-fns"
import Link from "next/link"
import { useState, type MouseEvent as ReactMouseEvent } from "react"

/** Shared column template: message, time, hover actions. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto_2rem] items-center gap-x-4 sm:grid-cols-[minmax(0,1fr)_6rem_2rem]"

/** "14:05" today, "23 Okt" this year, otherwise "23 Okt 2025". */
function shortTime(date: Date, locale: Locale) {
  if (isToday(date)) return format(date, "HH:mm")
  return format(date, isThisYear(date) ? "d MMM" : "d MMM yyyy", {
    locale,
  })
}

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()
  const [activeTab, setActiveTab] = useState<"unread" | "all">("unread")
  const t = useT("shell")
  const tc = useT("common")
  const dateLocale = useDateLocale()

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
      <PageHeader
        className="pt-6 pb-4"
        title={t("notifications")}
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline"
              className="hidden sm:inline-flex"
              onClick={() => markAllAsRead()}
            >
              {t("notificationsMarkAllRead")}
            </Button>
          )
        }
      />

      <div className="bleed gutter-x border-border border-b">
        <TabNavigation className="border-b-0">
          <TabNavigationLink
            active={activeTab === "unread"}
            onClick={() => setActiveTab("unread")}
            showLeadingIcon={false}
          >
            {t("notificationsUnread")}
          </TabNavigationLink>
          <TabNavigationLink
            active={activeTab === "all"}
            onClick={() => setActiveTab("all")}
            showLeadingIcon={false}
          >
            {tc("all")}
          </TabNavigationLink>
        </TabNavigation>
      </div>

      <div className={cn("pb-4", unreadCount > 0 && "pb-24 sm:pb-4")}>
        {filteredNotifications.length === 0 ? (
          <EmptyState
            title={t("notificationsEmpty")}
            description={t("notificationsNothingNewTab")}
            icon={<RiNotification3Line className="size-5" />}
            placement="inner"
          />
        ) : (
          <GroupedList>
            {filteredNotifications.map((notification) => {
              const created = notification.created_at
                ? new Date(notification.created_at)
                : null
              return (
                <ListRow
                  key={notification.id}
                  className={cn(ROW_GRID, "min-h-14")}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        notification.is_read ? "bg-transparent" : "bg-primary",
                      )}
                    />
                    <div className="flex min-w-0 flex-col">
                      {/* The link covers the whole row; delete sits above it. */}
                      <Link
                        href={notification.link || "#"}
                        onClick={() => markAsRead(notification.id)}
                        className="text-foreground truncate outline-none after:absolute after:inset-0 focus-visible:underline"
                      >
                        {notification.title}
                        {!notification.is_read && (
                          <span className="sr-only">
                            {" "}
                            {t("notificationsUnreadSr")}
                          </span>
                        )}
                      </Link>
                      {notification.message && (
                        <span className="text-tertiary-foreground truncate text-[13px]">
                          {notification.message}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-muted-foreground text-right text-[13px] whitespace-nowrap tabular-nums"
                    title={
                      created
                        ? format(created, "d MMM yyyy, HH:mm", {
                            locale: dateLocale,
                          })
                        : undefined
                    }
                  >
                    {created ? shortTime(created, dateLocale) : <EmptyValue />}
                  </span>
                  {/* Always visible on touch screens, hover-only from sm up. */}
                  <ListRowActions className="relative z-10 justify-end max-sm:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("notificationsDelete")}
                      title={tc("delete")}
                      onClick={(event) => handleDelete(event, notification.id)}
                    >
                      <RiDeleteBinLine />
                    </Button>
                  </ListRowActions>
                </ListRow>
              )
            })}
          </GroupedList>
        )}
      </div>

      {unreadCount > 0 && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] left-1/2 z-[60] -translate-x-1/2 sm:hidden">
          <Button
            variant="outline"
            onClick={() => markAllAsRead()}
            className="shadow-lg"
          >
            {t("notificationsMarkAllRead")}
          </Button>
        </div>
      )}
    </div>
  )
}

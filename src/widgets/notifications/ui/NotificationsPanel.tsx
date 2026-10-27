"use client"

import {
  URGENT_NOTIFICATION_TYPES,
  type useNotifications,
} from "@/shared/hooks/useNotifications"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import { EmptyState } from "@/components/empty-state"
import { SegmentedControl } from "@/components/segmented-control"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  RiDeleteBinLine,
  RiMegaphoneLine,
  RiNotification3Line,
} from "@/shared/ui/lucide-icons"
import { format, formatDistanceToNowStrict } from "date-fns"
import Link from "next/link"
import { useMemo, useState, type MouseEvent as ReactMouseEvent } from "react"
import { AnnouncementDialog } from "./AnnouncementDialog"
import {
  BellFilled,
  BookFilled,
  CalendarCheckFilled,
  CalendarEventFilled,
  ChartFilled,
  CheckCircleFilled,
  ClockFilled,
  FileFilled,
  FolderFilled,
  MegaphoneFilled,
  MessageFilled,
  StarFilled,
  UserFilled,
} from "./notification-icons"

type NotificationsApi = ReturnType<typeof useNotifications>

/** What a notification is about, as its icon (by `type`). */
const TYPE_ICONS: [RegExp, React.ElementType][] = [
  [/^announcement/, MegaphoneFilled],
  [/^leave_/, CalendarCheckFilled],
  [/^attendance/, ClockFilled],
  [/^calendar_/, CalendarEventFilled],
  [/^one_on_one/, UserFilled],
  [/^review_/, StarFilled],
  [/^kpi_/, ChartFilled],
  [/^(mention|task_comment)$/, MessageFilled],
  [/^task_/, CheckCircleFilled],
  [/^project_/, FolderFilled],
  [/^policy/, BookFilled],
  [/^contract/, FileFilled],
]

export const iconFor = (type: string) =>
  TYPE_ICONS.find(([re]) => re.test(type))?.[1] ?? BellFilled

export interface NotificationsPanelProps extends Pick<
  NotificationsApi,
  | "notifications"
  | "unreadCount"
  | "loading"
  | "isError"
  | "markAsRead"
  | "markAllAsRead"
  | "deleteNotification"
> {
  onClose: () => void
}

/**
 * What a row opens: a page in the app, an outside page in a new tab, or
 * nothing (then the row only marks it read). Covers the whole row.
 */
function NotificationLink({
  link,
  onOpen,
  className,
  children,
}: {
  link: string | null
  onOpen: () => void
  className: string
  children: React.ReactNode
}) {
  if (!link)
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn("text-left", className)}
      >
        {children}
      </button>
    )
  if (/^https?:\/\//.test(link))
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpen}
        className={className}
      >
        {children}
      </a>
    )
  return (
    <Link href={link} onClick={onOpen} className={className}>
      {children}
    </Link>
  )
}

/**
 * Notification drawer body. Loaded on demand (first hover/focus/open of the
 * bell) so the topbar doesn't ship the list on every page.
 */
export default function NotificationsPanel({
  onClose,
  notifications,
  unreadCount,
  loading,
  isError,
  markAsRead,
  markAllAsRead,
  deleteNotification,
}: NotificationsPanelProps) {
  const [activeTab, setActiveTab] = useState<"unread" | "all">("unread")
  const [composing, setComposing] = useState(false)
  const { profile } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const t = useT("shell")
  const isMobile = useIsMobile()
  const tc = useT("common")
  const dateLocale = useDateLocale()

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
    <SheetContent
      // A bottom sheet on phones, like every other panel there.
      side={isMobile ? "bottom" : "right"}
      className={cn(
        "w-full gap-0 sm:max-w-md",
        isMobile &&
          "h-[85dvh] rounded-t-3xl border-t-0 pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <SheetHeader>
        <SheetTitle>{t("notifications")}</SheetTitle>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setComposing(true)}
            >
              <RiMegaphoneLine data-icon="inline-start" />
              {t("announcementNew")}
            </Button>
          )}
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsRead()}
            >
              {t("notificationsReadAll")}
            </Button>
          )}
        </div>
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
                  ? t("notificationsUnreadCount", { count: unreadCount })
                  : t("notificationsUnread"),
            },
            { value: "all", label: tc("all") },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {loading && notifications.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <Spinner className="size-5" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <EmptyState
              title={
                isError && notifications.length === 0
                  ? t("notificationsLoadFailed")
                  : activeTab === "unread"
                    ? t("notificationsAllRead")
                    : t("notificationsEmpty")
              }
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
              const Icon = iconFor(notification.type)
              const urgent = URGENT_NOTIFICATION_TYPES.has(notification.type)
              return (
                <li
                  key={notification.id}
                  className="group/notif hover:bg-muted relative flex gap-3 rounded-lg px-3 py-3 transition-colors"
                >
                  {/* What it's about; a dot on it while unread. */}
                  <span
                    aria-hidden
                    className={cn(
                      "relative flex size-8 shrink-0 items-center justify-center rounded-lg",
                      urgent
                        ? "bg-warning-subtle text-warning"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {!notification.is_read && (
                      <span className="bg-primary ring-background absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2" />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-baseline gap-2">
                      {/* The link covers the whole row; delete sits above it. */}
                      <NotificationLink
                        link={notification.link}
                        onOpen={() => {
                          markAsRead(notification.id)
                          if (notification.link) onClose()
                        }}
                        className={cn(
                          "focus-visible:after:ring-ring min-w-0 flex-1 truncate outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2",
                          notification.is_read
                            ? "text-muted-foreground"
                            : "text-foreground font-medium",
                        )}
                      >
                        {urgent && (
                          <span className="text-warning font-medium">
                            {t("announcementUrgent")} ·{" "}
                          </span>
                        )}
                        {notification.title}
                        {!notification.is_read && (
                          <span className="sr-only">
                            {" "}
                            {t("notificationsUnreadSr")}
                          </span>
                        )}
                      </NotificationLink>
                      {created && (
                        <time
                          dateTime={created.toISOString()}
                          title={format(created, "d MMM yyyy, HH:mm", {
                            locale: dateLocale,
                          })}
                          className="text-tertiary-foreground shrink-0 text-xs tabular-nums"
                        >
                          {formatDistanceToNowStrict(created, {
                            addSuffix: true,
                            locale: dateLocale,
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
                    aria-label={t("notificationsDelete")}
                    title={tc("delete")}
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
      {isAdmin && (
        <AnnouncementDialog open={composing} onOpenChange={setComposing} />
      )}
    </SheetContent>
  )
}

"use client"

import {
  useNotifications,
} from "@/shared/hooks/useNotifications"
import { useT } from "@/shared/i18n/client"
import { cx, focusRing } from "@/shared/lib/utils"
import { RiNotification3Line } from "@/shared/ui/lucide-icons"
import { Sheet } from "@/components/ui/sheet"
import dynamic from "next/dynamic"
import { useCallback, useState } from "react"

interface NotificationsProps {
  variant?: "default" | "icon"
  className?: string
}

const loadPanel = () => import("./NotificationsPanel")
const NotificationsPanel = dynamic(loadPanel, { ssr: false })

/** Warm the panel chunk on hover/focus intent so the first open is instant. */
const preloadPanel = () => {
  void loadPanel()
}

const requestDesktopPermission = async () => {
  if (typeof window === "undefined") return
  if (!("Notification" in window)) return
  if (window.Notification.permission === "default") {
    try {
      await window.Notification.requestPermission()
    } catch {
      // ignore
    }
  }
}

export function Notifications({
  variant = "default",
  className,
}: NotificationsProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    loading,
    isError,
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const t = useT("shell")
  // The drawer loads on first open, then stays mounted for its exit animation.
  const [hasOpened, setHasOpened] = useState(false)
  const close = useCallback(() => setIsOpen(false), [])

  const toggle = () => {
    const nextOpen = !isOpen
    setIsOpen(nextOpen)
    if (nextOpen) {
      setHasOpened(true)
      requestDesktopPermission()
    }
  }

  const panel = (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {hasOpened && (
        <NotificationsPanel
          onClose={close}
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          isError={isError}
          markAsRead={markAsRead}
          markAsUnread={markAsUnread}
          markAllAsRead={markAllAsRead}
          deleteNotification={deleteNotification}
        />
      )}
    </Sheet>
  )

  return (
    <>
      <button
        onClick={toggle}
        onPointerEnter={preloadPanel}
        onFocus={preloadPanel}
        className={cx(
          variant === "default"
            ? cx(
                "hover:bg-muted flex w-full items-center gap-x-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition",
                isOpen
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )
            : cx(
                // Beside the search in the sidebar: the field's size and
                // its chrome hover.
                "blend-ink rounded-control flex size-8 shrink-0 items-center justify-center transition-colors focus:outline-none",
                isOpen
                  ? "text-foreground bg-chrome-field"
                  : "text-muted-foreground hover:text-foreground hover:bg-chrome-hover",
              ),
          focusRing,
          className,
        )}
        aria-label={t("notificationCenter")}
      >
        <div className="relative flex items-center justify-center">
          <RiNotification3Line
            className={cx(
              variant === "default" ? "size-4 shrink-0" : "size-4",
              // The dot cuts its own gap out of the bell (a mask, not a
              // ring), so nothing light shows around it on any background:
              // a 6px hole (the 4px dot + 2px) at the dot's centre.
              unreadCount > 0 &&
                variant === "icon" &&
                "[mask-image:radial-gradient(circle_at_14px_2px,transparent_6px,#000_6.5px)]",
            )}
          />
          {unreadCount > 0 && variant === "icon" && (
            // Unread: a still primary dot (feedback.md), no ping, no red.
            <span
              aria-hidden
              className="bg-primary absolute top-0 right-0 -mt-0.5 -mr-0.5 size-2 rounded-full"
            />
          )}
        </div>

        {variant === "default" && (
          <>
            <span>{t("notificationCenter")}</span>
            {unreadCount > 0 && (
              <span className="bg-primary/10 text-primary ml-auto flex items-center justify-center rounded-sm px-1.5 py-0.5 text-xs font-medium">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {panel}
    </>
  )
}

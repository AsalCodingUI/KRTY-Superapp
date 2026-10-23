"use client"

import { useNotifications } from "@/shared/hooks/useNotifications"
import { useT } from "@/shared/i18n/client"
import { cx, focusRing } from "@/shared/lib/utils"
import { RiNotification3Line } from "@/shared/ui/lucide-icons"
import { Sheet } from "@/components/ui/sheet"
import dynamic from "next/dynamic"
import { useCallback, useState } from "react"

interface NotificationsProps {
  variant?: "default" | "icon"
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

export function Notifications({ variant = "default" }: NotificationsProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const t = useT("shell")
  // The drawer loads on first open, then stays mounted for its exit animation.
  const [hasOpened, setHasOpened] = useState(false)
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <>
      <button
        onClick={() => {
          const nextOpen = !isOpen
          setIsOpen(nextOpen)
          if (nextOpen) {
            setHasOpened(true)
            requestDesktopPermission()
          }
        }}
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
                "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors focus:outline-none",
                isOpen
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              ),
          focusRing,
        )}
        aria-label={t("notificationCenter")}
      >
        <div className="relative flex items-center justify-center">
          <RiNotification3Line
            className={variant === "default" ? "size-4 shrink-0" : "size-4"}
          />
          {unreadCount > 0 && variant === "icon" && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex size-2">
              <span className="bg-destructive absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
              <span className="bg-destructive relative inline-flex size-2 rounded-full"></span>
            </span>
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

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        {hasOpened && (
          <NotificationsPanel
            onClose={close}
            notifications={notifications}
            unreadCount={unreadCount}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
            deleteNotification={deleteNotification}
          />
        )}
      </Sheet>
    </>
  )
}

"use client"

import { useNotifications } from "@/shared/hooks/useNotifications"
import { cx, focusRing } from "@/shared/lib/utils"
import { TabNavigation, TabNavigationLink } from "@/shared/ui"
import { RiCloseLine, RiNotification3Line } from "@remixicon/react"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useRef, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"

interface NotificationsProps {
  variant?: "default" | "icon"
}

const EMPTY_STATE_BELL =
  "https://www.figma.com/api/mcp/asset/117b46b7-b747-4295-bba7-efeeb25f648d"
const SIDEBAR_WIDTH = 256
const PANEL_GUTTER = 12

export function Notifications({ variant = "default" }: NotificationsProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications()
  const [activeTab, setActiveTab] = useState<"unread" | "all">("unread")
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>()
  const [isMobile, setIsMobile] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const updateLayout = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)

      if (!isOpen || mobile) {
        setPanelStyle(undefined)
        return
      }

      setPanelStyle({
        top: PANEL_GUTTER,
        left: SIDEBAR_WIDTH + PANEL_GUTTER,
        width: 386,
      })
    }

    updateLayout()
    window.addEventListener("resize", updateLayout)
    return () => window.removeEventListener("resize", updateLayout)
  }, [isOpen])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications

  const handleNotificationClick = (id: string) => {
    markAsRead(id)
    setIsOpen(false)
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cx(
          variant === "default"
            ? cx(
                "hover:bg-surface-neutral-secondary text-label-md flex w-full items-center gap-x-2.5 rounded-md px-2 py-1.5 transition",
                isOpen
                  ? "bg-surface-neutral-secondary text-foreground-primary"
                  : "text-foreground-secondary hover:text-foreground-primary",
              )
            : cx(
                "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors focus:outline-none",
                isOpen
                  ? "text-content bg-surface-neutral-secondary"
                  : "text-content-subtle hover:text-content hover:bg-surface-neutral-secondary",
              ),
          focusRing,
        )}
        aria-label="Notification Center"
      >
        <div className="relative flex items-center justify-center">
          <RiNotification3Line
            className={variant === "default" ? "size-4 shrink-0" : "size-4"}
          />
          {unreadCount > 0 && variant === "icon" && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
            </span>
          )}
        </div>

        {variant === "default" && (
          <>
            <span>Notification Center</span>
            {unreadCount > 0 && (
              <span className="bg-surface-brand-light text-foreground-brand-dark text-label-xs ml-auto flex items-center justify-center rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                ref={panelRef}
                className={cx(
                  "fixed z-50 flex max-h-[calc(100vh-24px)] flex-col overflow-hidden bg-surface-neutral-primary",
                  isMobile
                    ? "inset-0 rounded-none border-0 shadow-none"
                    : "h-[576px] w-[386px] rounded-xl border border-neutral-primary shadow-regular-md",
                )}
                style={panelStyle}
                initial={
                  isMobile
                    ? { opacity: 0, y: 16 }
                    : { opacity: 0, y: 8, scale: 0.98 }
                }
                animate={
                  isMobile
                    ? { opacity: 1, y: 0 }
                    : { opacity: 1, y: 0, scale: 1 }
                }
                exit={
                  isMobile
                    ? { opacity: 0, y: 16 }
                    : { opacity: 0, y: 8, scale: 0.98 }
                }
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between px-3xl pb-2xl pt-3xl">
                    <h3 className="text-heading-lg text-foreground-primary">
                      Notifications
                    </h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-foreground-secondary text-label-xs hover:text-foreground-primary"
                        >
                          Mark all as read
                        </button>
                      )}
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-foreground-secondary hover:bg-surface-neutral-secondary rounded-md p-1 lg:hidden"
                      >
                        <RiCloseLine className="size-5" />
                      </button>
                    </div>
                  </div>

                  <div className="px-2xl">
                    <TabNavigation>
                      <TabNavigationLink
                        active={activeTab === "unread"}
                        onClick={() => setActiveTab("unread")}
                        className="cursor-pointer"
                      >
                        Unread
                      </TabNavigationLink>
                      <TabNavigationLink
                        active={activeTab === "all"}
                        onClick={() => setActiveTab("all")}
                        className="cursor-pointer"
                      >
                        All
                      </TabNavigationLink>
                    </TabNavigation>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center p-2xl text-center">
                        <div className="flex w-full flex-col items-center gap-xl px-3xl py-5xl">
                          <span className="relative size-8">
                            <img
                              alt=""
                              className="absolute inset-0 size-full"
                              src={EMPTY_STATE_BELL}
                            />
                          </span>
                          <div className="flex w-full flex-col items-start gap-md text-center">
                            <p className="text-heading-sm text-foreground-primary w-full">
                              You don&apos;t have any notifications
                            </p>
                            <p className="text-body-sm text-foreground-secondary w-full">
                              We&apos;ll notify you about important updates and
                              any time you&apos;re mentioned on App.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2">
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                          {filteredNotifications.map((notification) => (
                            <Link
                              key={notification.id}
                              href={notification.link || "#"}
                              onClick={() =>
                                handleNotificationClick(notification.id)
                              }
                              className={cx(
                                "hover:bg-surface-neutral-secondary block px-4 py-4 transition-colors",
                                !notification.is_read
                                  ? "bg-surface-brand-light"
                                  : "",
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
                                <div className="flex-1">
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
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}

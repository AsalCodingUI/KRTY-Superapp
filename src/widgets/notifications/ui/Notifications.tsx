"use client"

import { useNotifications } from "@/shared/hooks/useNotifications"
import { cx, focusRing } from "@/shared/lib/utils"
import { EmptyState } from "@/components/empty-state"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  RiCloseLine,
  RiDeleteBinLine,
  RiNotification3Line,
} from "@/shared/ui/lucide-icons"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { createPortal } from "react-dom"

interface NotificationsProps {
  variant?: "default" | "icon"
}

const SIDEBAR_WIDTH = 256
const PANEL_GUTTER = 12

export function Notifications({ variant = "default" }: NotificationsProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()
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

  const handleDelete = (event: ReactMouseEvent, id: string) => {
    event.preventDefault()
    event.stopPropagation()
    deleteNotification(id)
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => {
          const nextOpen = !isOpen
          setIsOpen(nextOpen)
          if (nextOpen) requestDesktopPermission()
        }}
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
        aria-label="Notification Center"
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
            <span>Notification Center</span>
            {unreadCount > 0 && (
              <span className="bg-primary/10 text-primary ml-auto flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium">
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
                  "bg-sidebar fixed z-50 flex max-h-[calc(100vh-24px)] flex-col overflow-hidden",
                  isMobile
                    ? "inset-0 rounded-none border-0 shadow-none"
                    : "border-border shadow-regular-md h-[600px] w-full max-w-[386px] rounded-xl border",
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
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <h3 className="text-foreground text-base font-semibold">
                      Notifications
                    </h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-muted-foreground hover:text-foreground text-xs font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-muted-foreground hover:bg-muted rounded-md p-1 lg:hidden"
                      >
                        <RiCloseLine className="size-5" />
                      </button>
                    </div>
                  </div>

                  <div className="border-border border-b px-5 pt-2">
                    <div className="pb-2 xl:hidden">
                      <Select
                        value={activeTab}
                        onValueChange={(value) =>
                          setActiveTab(value as "unread" | "all")
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unread">Unread</SelectItem>
                          <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="hidden xl:block">
                      <TabNavigation className="border-b-0">
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
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                      <div className="flex h-full flex-1 items-center justify-center p-4">
                        <EmptyState
                          title="No notifications yet"
                          description="Nothing new in this tab."
                          icon={<RiNotification3Line className="size-5" />}
                          placement="inner"
                        />
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
                                "hover:bg-muted block px-4 py-4 transition-colors",
                                !notification.is_read ? "bg-primary/10" : "",
                              )}
                            >
                              <div className="flex gap-3">
                                <div
                                  className={cx(
                                    "mt-1.5 size-2 shrink-0 rounded-full",
                                    !notification.is_read
                                      ? "bg-primary"
                                      : "bg-transparent",
                                  )}
                                />
                                <div className="flex-1">
                                  <p className="text-foreground text-sm font-medium">
                                    {notification.title}
                                  </p>
                                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                                    {notification.message}
                                  </p>
                                  <p className="text-muted-foreground/70 mt-2 text-xs">
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
                                  onClick={(event) =>
                                    handleDelete(event, notification.id)
                                  }
                                  className="text-muted-foreground/70 hover:text-foreground hover:bg-muted mt-1 inline-flex size-8 items-center justify-center rounded-md"
                                  aria-label="Delete notification"
                                >
                                  <RiDeleteBinLine className="size-4" />
                                </button>
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

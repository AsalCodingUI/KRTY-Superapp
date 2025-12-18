"use client"

import { TabNavigation, TabNavigationLink } from "@/components/TabNavigation"
import { useNotifications } from "@/hooks/useNotifications"
import { cx, focusRing } from "@/lib/utils"
import { RiCloseLine, RiNotification3Line } from "@remixicon/react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export function Notifications() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
    const [activeTab, setActiveTab] = useState<"unread" | "all">("unread")
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

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

    const filteredNotifications = activeTab === "unread"
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
                    "flex w-full items-center gap-x-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition hover:bg-muted hover:dark:bg-surface",
                    isOpen ? "bg-muted dark:bg-surface text-content dark:text-content" : "text-content-subtle hover:text-content dark:text-content-placeholder hover:dark:text-content",
                    focusRing
                )}
            >
                <RiNotification3Line className="size-4 shrink-0" />
                <span>Notification Center</span>
                {unreadCount > 0 && (
                    <span className="ml-auto flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary/10 dark:text-primary">
                        {unreadCount}
                    </span>
                )}
            </button>

            {mounted && isOpen && createPortal(
                <div
                    ref={panelRef}
                    className={cx(
                        "fixed inset-y-0 z-50 w-80 sm:w-80 bg-surface shadow-sm dark:bg-surface border-r border-border transform transition-transform duration-300 ease-in-out",
                        // Desktop: Left-72 (sidebar width), Mobile: Left-0 (full screen drawer style or overlay)
                        // Note: On mobile, sidebar is hidden/drawer, so left-0 is fine.
                        // On desktop, sidebar is fixed w-72.
                        "left-0 lg:left-64",
                        // Animation: Slide out from left (behind sidebar on desktop)
                        // Initial state is handled by mounting, but for smooth enter/exit we need a transition wrapper or CSS animation.
                        // Since we are conditionally rendering, we might miss the exit animation without AnimatePresence.
                        // For simplicity, we just render it. If animation is critical, we'd use a library or CSS classes with mounting delay.
                        // Here we assume it just appears, but let's try to make it slide.
                        "animate-in slide-in-from-left duration-300"
                    )}
                >
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between border-b border-border px-4 py-4">
                            <h3 className="font-semibold text-content dark:text-content">Inbox</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllAsRead()}
                                        className="text-xs font-medium text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-md p-1 text-content-subtle hover:bg-muted hover:text-content-subtle dark:text-content-placeholder dark:hover:bg-hover dark:hover:text-content lg:hidden"
                                >
                                    <RiCloseLine className="size-5" />
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <TabNavigation>
                                <TabNavigationLink
                                    active={activeTab === "unread"}
                                    onClick={() => setActiveTab("unread")}
                                    className="px-4 cursor-pointer"
                                >
                                    Unread
                                </TabNavigationLink>
                                <TabNavigationLink
                                    active={activeTab === "all"}
                                    onClick={() => setActiveTab("all")}
                                    className="px-4 cursor-pointer"
                                >
                                    All
                                </TabNavigationLink>
                            </TabNavigation>
                        </div>

                        <div className="flex-1 overflow-y-auto py-2">
                            {filteredNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <p className="text-sm text-content-subtle dark:text-content-placeholder">
                                        No {activeTab} notifications
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                                    {filteredNotifications.map((notification) => (
                                        <Link
                                            key={notification.id}
                                            href={notification.link || "#"}
                                            onClick={() => handleNotificationClick(notification.id)}
                                            className={cx(
                                                "block px-4 py-4 hover:bg-muted dark:hover:bg-surface/50 transition-colors",
                                                !notification.is_read ? "bg-accent dark:bg-accent" : ""
                                            )}
                                        >
                                            <div className="flex gap-3">
                                                <div className={cx("mt-1.5 size-2 shrink-0 rounded-full", !notification.is_read ? "bg-primary dark:bg-primary" : "bg-transparent")} />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-content dark:text-content">
                                                        {notification.title}
                                                    </p>
                                                    <p className="mt-1 text-sm text-content-subtle dark:text-content-placeholder line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="mt-2 text-xs text-content-placeholder dark:text-content-subtle">
                                                        {new Date(notification.created_at || "").toLocaleDateString(undefined, {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

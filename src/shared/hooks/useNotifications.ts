import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { logError } from "@/shared/lib/utils/logger"
import { Database } from "@/shared/types/database.types"
import { useCallback, useEffect, useState } from "react"

type Notification = Database["public"]["Tables"]["notifications"]["Row"]
type NotificationsSyncDetail =
  | { type: "markAsRead"; id: string }
  | { type: "markAllAsRead" }
  | { type: "delete"; id: string }

const NOTIFICATIONS_SYNC_EVENT = "kretya:notifications-sync"

function broadcastNotificationsSync(detail: NotificationsSyncDetail) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<NotificationsSyncDetail>(NOTIFICATIONS_SYNC_EVENT, {
      detail,
    }),
  )
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { authProfile, loading: profileLoading } = useUserProfile()

  const fetchNotifications = useCallback(async () => {
    if (!authProfile?.id) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(profileLoading)
      return null
    }

    try {
      const response = await fetch("/api/notifications", {
        credentials: "include",
        cache: "no-store",
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          setNotifications([])
          setUnreadCount(0)
          setLoading(false)
          return authProfile.id
        }

        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null

        throw new Error(payload?.error || "Failed to fetch notifications")
      }

      const payload = (await response.json().catch(() => null)) as
        | { notifications?: Notification[] }
        | null
      const data = payload?.notifications || []

      setNotifications(data)
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
      setLoading(false)

      return authProfile.id
    } catch (error) {
      logError("Failed to fetch notifications", error, {
        authProfileId: authProfile.id,
      })
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return authProfile.id
    }
  }, [authProfile?.id, profileLoading])

  const markAsRead = async (id: string) => {
    // Optimistic Update (Update UI duluan biar berasa instan)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    broadcastNotificationsSync({ type: "markAsRead", id })

    // Kirim ke server
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
  }

  const markAllAsRead = async () => {
    // Optimistic Update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    broadcastNotificationsSync({ type: "markAllAsRead" })

    if (!authProfile?.id) return

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    })
  }

  const deleteNotification = async (id: string) => {
    let snapshot: Notification[] = []
    let deleted: Notification | undefined

    setNotifications((prev) => {
      snapshot = prev
      deleted = prev.find((n) => n.id === id)
      return prev.filter((n) => n.id !== id)
    })

    if (deleted && !deleted.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    broadcastNotificationsSync({ type: "delete", id })

    if (!authProfile?.id) return

    const response = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      setNotifications(snapshot)
      setUnreadCount(snapshot.filter((n) => !n.is_read).length)
    }
  }

  useEffect(() => {
    void fetchNotifications()

    const intervalId = window.setInterval(() => {
      void fetchNotifications()
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [fetchNotifications])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleSync = (event: Event) => {
      const detail = (event as CustomEvent<NotificationsSyncDetail>).detail
      if (!detail) return

      if (detail.type === "markAsRead") {
        setNotifications((prev) =>
          prev.map((n) => (n.id === detail.id ? { ...n, is_read: true } : n)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
        return
      }

      if (detail.type === "markAllAsRead") {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
        return
      }

      if (detail.type === "delete") {
        setNotifications((prev) => {
          const next = prev.filter((n) => n.id !== detail.id)
          setUnreadCount(next.filter((n) => !n.is_read).length)
          return next
        })
      }
    }

    window.addEventListener(NOTIFICATIONS_SYNC_EVENT, handleSync as EventListener)
    return () =>
      window.removeEventListener(
        NOTIFICATIONS_SYNC_EVENT,
        handleSync as EventListener,
      )
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  }
}

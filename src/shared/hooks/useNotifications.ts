import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { Database } from "@/shared/types/database.types"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/shared/api/supabase/client"
import { useCallback, useEffect, useMemo } from "react"

type Notification = Database["public"]["Tables"]["notifications"]["Row"]

/** Every consumer shares this cache entry, so there is a single poller. */
export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const

const POLL_INTERVAL_MS = 60_000
const EMPTY: Notification[] = []

type NotificationList = { list: Notification[]; unread: number | null }

async function fetchNotificationList(): Promise<NotificationList> {
  const response = await fetch("/api/notifications", {
    credentials: "include",
    cache: "no-store",
  })
  if (!response.ok) throw new Error("Failed to fetch notifications")

  const payload = (await response.json().catch(() => null)) as {
    notifications?: Notification[]
    unreadCount?: number | null
  } | null
  return {
    list: payload?.notifications || [],
    unread: payload?.unreadCount ?? null,
  }
}

export function useNotifications() {
  const queryClient = useQueryClient()
  // The person being viewed (the signed-in one, or who an admin views as):
  // the bell shows their notifications.
  const { profile, loading: profileLoading } = useUserProfile()
  const userId = profile?.id
  // Scoped per user so a different session never sees a stale list.
  const queryKey = useMemo(
    () => [...NOTIFICATIONS_QUERY_KEY, userId] as const,
    [userId],
  )

  const query = useQuery({
    queryKey,
    queryFn: fetchNotificationList,
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  })

  const notifications = userId ? (query.data?.list ?? EMPTY) : EMPTY
  // The server's count covers rows past the list's cap; fall back to the list.
  const unreadCount = useMemo(
    () => query.data?.unread ?? notifications.filter((n) => !n.is_read).length,
    [notifications, query.data?.unread],
  )
  const loading = userId ? query.isPending : profileLoading
  const isError = userId ? query.isError : false

  const unreadIn = (list: Notification[]) =>
    list.filter((n) => !n.is_read).length

  /**
   * Optimistically rewrite the cached list (and the unread count with it);
   * returns the previous state to restore when the request fails.
   */
  const update = useCallback(
    async (fn: (prev: Notification[]) => Notification[]) => {
      // Don't let an in-flight poll overwrite the optimistic state.
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<NotificationList>(queryKey)
      queryClient.setQueryData<NotificationList>(queryKey, (prev) => {
        const list = prev?.list ?? EMPTY
        const next = fn(list)
        const unread =
          prev?.unread == null
            ? null
            : Math.max(0, prev.unread - (unreadIn(list) - unreadIn(next)))
        return { list: next, unread }
      })
      return previous
    },
    [queryClient, queryKey],
  )

  /** Sends a change; puts the list back as it was if the server refuses. */
  const send = useCallback(
    async (
      previous: NotificationList | undefined,
      request: Promise<Response>,
    ) => {
      const ok = await request.then((r) => r.ok).catch(() => false)
      if (!ok) queryClient.setQueryData(queryKey, previous)
    },
    [queryClient, queryKey],
  )

  const markAsRead = useCallback(
    async (id: string) => {
      const previous = await update((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      )
      await send(
        previous,
        fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }),
      )
    },
    [send, update],
  )

  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    const previous = await update((prev) =>
      prev.map((n) => ({ ...n, is_read: true })),
    )
    queryClient.setQueryData<NotificationList>(queryKey, (prev) =>
      prev ? { ...prev, unread: 0 } : prev,
    )
    await send(
      previous,
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      }),
    )
  }, [queryClient, queryKey, send, update, userId])

  const deleteNotification = useCallback(
    async (id: string) => {
      if (!userId) return
      const previous = await update((prev) => prev.filter((n) => n.id !== id))
      await send(
        previous,
        fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        }),
      )
    },
    [send, update, userId],
  )

  const { refetch: refetchQuery } = query
  const refetch = useCallback(async () => {
    if (!userId) return null
    await refetchQuery()
    return userId
  }, [refetchQuery, userId])

  return {
    notifications,
    unreadCount,
    loading,
    isError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  }
}

/** Types that are urgent: also the app banner, and a desktop alert. */
export const URGENT_NOTIFICATION_TYPES = new Set(["announcement_urgent"])

/**
 * New notifications as they're created (Supabase realtime), instead of
 * waiting for the next poll. While the tab is in the background, urgent
 * ones also raise a desktop notification (if the browser allows it).
 * Mount once (the bell does).
 */
export function useNotificationsRealtime() {
  const queryClient = useQueryClient()
  const { profile, isImpersonating } = useUserProfile()
  // Viewing as someone: their rows aren't readable over realtime with the
  // admin's session (RLS), so the minute poll covers it.
  const userId = isImpersonating ? undefined : profile?.id

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Notification }) => {
          void queryClient.invalidateQueries({
            queryKey: [...NOTIFICATIONS_QUERY_KEY, userId],
          })
          const n = payload.new
          if (
            URGENT_NOTIFICATION_TYPES.has(n.type) &&
            document.visibilityState === "hidden" &&
            "Notification" in window &&
            window.Notification.permission === "granted"
          ) {
            try {
              new window.Notification(n.title, { body: n.message || undefined })
            } catch {
              // Some browsers only allow it from a service worker.
            }
          }
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient, userId])
}

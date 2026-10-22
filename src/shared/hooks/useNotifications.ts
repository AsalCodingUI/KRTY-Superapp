import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { Database } from "@/shared/types/database.types"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

type Notification = Database["public"]["Tables"]["notifications"]["Row"]

/** Every consumer shares this cache entry, so there is a single poller. */
export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const

const POLL_INTERVAL_MS = 60_000
const EMPTY: Notification[] = []

async function fetchNotificationList(): Promise<Notification[]> {
  const response = await fetch("/api/notifications", {
    credentials: "include",
    cache: "no-store",
  })
  if (!response.ok) throw new Error("Failed to fetch notifications")

  const payload = (await response.json().catch(() => null)) as {
    notifications?: Notification[]
  } | null
  return payload?.notifications || []
}

export function useNotifications() {
  const queryClient = useQueryClient()
  const { authProfile, loading: profileLoading } = useUserProfile()
  const userId = authProfile?.id
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

  const notifications = userId ? (query.data ?? EMPTY) : EMPTY
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  )
  const loading = userId ? query.isPending : profileLoading

  /** Optimistically rewrite the cached list; returns the previous one. */
  const update = useCallback(
    async (fn: (prev: Notification[]) => Notification[]) => {
      // Don't let an in-flight poll overwrite the optimistic state.
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Notification[]>(queryKey)
      queryClient.setQueryData<Notification[]>(queryKey, (prev) =>
        fn(prev ?? EMPTY),
      )
      return previous
    },
    [queryClient, queryKey],
  )

  const markAsRead = useCallback(
    async (id: string) => {
      await update((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      )
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
    },
    [update],
  )

  const markAllAsRead = useCallback(async () => {
    await update((prev) => prev.map((n) => ({ ...n, is_read: true })))
    if (!userId) return

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    })
  }, [update, userId])

  const deleteNotification = useCallback(
    async (id: string) => {
      const snapshot = await update((prev) => prev.filter((n) => n.id !== id))
      if (!userId) return

      const response = await fetch(
        `/api/notifications?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      )
      if (!response.ok) {
        queryClient.setQueryData<Notification[]>(queryKey, snapshot)
      }
    },
    [queryClient, queryKey, update, userId],
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
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  }
}

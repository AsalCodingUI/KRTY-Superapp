import { Database } from "@/shared/types/database.types"
import { createClient } from "@/shared/api/supabase/client"
import { RealtimeChannel } from "@supabase/supabase-js"
import { useCallback, useEffect, useState } from "react"

type Notification = Database["public"]["Tables"]["notifications"]["Row"]

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // 1. FIX: Gunakan useState agar instance client stabil (Singleton per component)
  // Ini mencegah koneksi realtime putus-nyambung saat re-render
  const [supabase] = useState(() => createClient())

  const fetchNotifications = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
    }
    setLoading(false)

    // Return userID untuk dipakai di subscription filter
    return user.id
  }, [supabase])

  const markAsRead = async (id: string) => {
    // Optimistic Update (Update UI duluan biar berasa instan)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    // Kirim ke server
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
  }

  const markAllAsRead = async () => {
    // Optimistic Update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
  }

  // 2. FIX: Logic Realtime yang Lebih Cerdas
  useEffect(() => {
    let channel: RealtimeChannel

    const setupRealtime = async () => {
      // Ambil data awal & user ID
      const userId = await fetchNotifications()
      if (!userId) return

      // Subscribe khusus untuk user ini saja
      channel = supabase
        .channel("realtime-notifications")
        .on(
          "postgres_changes",
          {
            event: "*", // Dengarkan INSERT (baru) dan UPDATE (dibaca)
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`, // Filter di level database (Cepat!)
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              // Ada notif baru: Masukkan ke paling atas
              const newNotif = payload.new as Notification
              setNotifications((prev) => [newNotif, ...prev])
              setUnreadCount((prev) => prev + 1)

              // Optional: Bunyikan suara atau toast disini jika mau
            } else if (payload.eventType === "UPDATE") {
              // Ada update (misal dibaca di device lain): Sync state
              const updatedNotif = payload.new as Notification
              setNotifications((prev) =>
                prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n)),
              )
              // Hitung ulang unread count biar akurat
              // (Kita pakai callback state untuk hitung manual dr array yg baru diupdate)
              setNotifications((currentNotifs) => {
                const count = currentNotifs.filter((n) => !n.is_read).length
                setUnreadCount(count)
                return currentNotifs
              })
            }
          },
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [fetchNotifications, supabase])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}

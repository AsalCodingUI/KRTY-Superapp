"use client"

import { createClient } from "@/shared/api/supabase/client"
import {
  NOTIFICATIONS_QUERY_KEY,
  useNotifications,
  useNotificationsRealtime,
} from "@/shared/hooks/useNotifications"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import {
  ActionsContext,
  LayoutRail,
  useDesktopPrefs,
  useMenubarData,
  type On,
  type PopoverActions,
  type Scenario,
} from "@/widgets/menubar/ui/MenubarPopover"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"

/**
 * The desktop app's window. The Tauri shell loads this page in a
 * transparent, native-blurred window under its menu bar icon; the page is
 * the popover (layout Rail) with its buttons doing the real thing. Inside
 * the app, `window.__TAURI__` is there to open links in the browser, set
 * the menu bar title, start at login and show notifications.
 */

const ALL: On = {
  attendance: true,
  schedule: true,
  tasks: true,
  notifications: true,
  approvals: true,
  leave: true,
}

type TauriGlobal = {
  core: {
    invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
  }
}
const tauri = () =>
  typeof window === "undefined"
    ? undefined
    : (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__
const invoke = (cmd: string, args?: Record<string, unknown>) =>
  tauri()
    ?.core.invoke(cmd, args)
    .catch(() => undefined)

/** A web app page opens in the app's own window; any other link in the
 *  browser. (Outside the app, both just open a tab.) */
function openExternal(pathOrUrl: string) {
  const url = new URL(pathOrUrl, window.location.origin)
  if (!tauri()) return void window.open(url, "_blank", "noopener")
  if (url.origin === window.location.origin)
    void invoke("open_in_app", { path: url.pathname + url.search })
  else void invoke("open_external", { url: url.toString() })
}

function useOnline() {
  const [online, setOnline] = useState(true)
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine)
    sync()
    window.addEventListener("online", sync)
    window.addEventListener("offline", sync)
    return () => {
      window.removeEventListener("online", sync)
      window.removeEventListener("offline", sync)
    }
  }, [])
  return online
}

export function DesktopApp() {
  const { profile, loading } = useUserProfile()
  const queryClient = useQueryClient()
  const online = useOnline()
  const { markAsRead } = useNotifications()
  // New notifications arrive over realtime: the popover is hidden most of
  // the time, and the minute poll pauses then.
  useNotificationsRealtime()
  const [prefs] = useDesktopPrefs()
  const person = useMemo(
    () =>
      profile
        ? { id: profile.id, full_name: profile.full_name, role: profile.role }
        : { id: "", full_name: null, role: null },
    [profile],
  )
  const scenario: Scenario = loading
    ? "loading"
    : !profile
      ? "signedOut"
      : !online
        ? "offline"
        : "real"
  const data = useMenubarData(ALL, person, scenario)

  // The window floats over the desktop: no page background of its own.
  useEffect(() => {
    document.documentElement.style.background = "transparent"
    document.body.style.background = "transparent"
  }, [])

  // Start at login, as set.
  useEffect(() => {
    void invoke("set_autostart", { enabled: prefs.launchAtLogin })
  }, [prefs.launchAtLogin])

  // The time worked next to the menu bar icon, if wanted.
  const title =
    prefs.timerInMenuBar && data.clocks && data.log && data.working
      ? `${Math.floor(data.worked / 60)}j ${data.worked % 60}m`
      : ""
  useEffect(() => {
    void invoke("set_tray_title", { title })
  }, [title])

  // New notifications as macOS notifications (not the ones already there
  // when the app opened).
  // And every 30 seconds anyway (hidden windows don't always get the
  // realtime events, and the hook's own poll pauses while hidden).
  useEffect(() => {
    const id = setInterval(() => {
      for (const queryKey of [
        NOTIFICATIONS_QUERY_KEY,
        ["menubar-pending-leave"],
        ["menubar-attendance"],
      ])
        void queryClient.invalidateQueries({ queryKey })
    }, 30_000)
    return () => clearInterval(id)
  }, [queryClient])

  const seen = useRef<Set<string> | null>(null)
  useEffect(() => {
    // The first full list is the baseline: only what comes after is new.
    if (scenario !== "real" || !data.notificationsReady) return
    const ids = new Set(data.unread.map((n) => n.id))
    if (seen.current && prefs.notifyNew) {
      for (const n of data.unread)
        if (!seen.current.has(n.id))
          void invoke("notify", { title: n.title, body: n.message ?? "" })
    }
    seen.current = new Set([...(seen.current ?? []), ...ids])
  }, [data.unread, data.notificationsReady, prefs.notifyNew, scenario])

  // Reminders, each once (remembered on this device for the day): events
  // 10 minutes before they start; for employees, clocking in from 09:00 on
  // weekdays and clocking out after 8 hours.
  useEffect(() => {
    if (scenario !== "real") return
    const key = `krty-reminders-${data.today}`
    let sent: string[] = []
    try {
      sent = JSON.parse(localStorage.getItem(key) ?? "[]")
    } catch {}
    const remind = (id: string, title: string, body: string) => {
      if (sent.includes(id)) return
      sent.push(id)
      void invoke("notify", { title, body })
    }
    const now = data.now.getTime()
    if (prefs.notifyEvents)
      for (const e of data.events) {
        const start = new Date(e.start_at).getTime()
        if (e.all_day || start < now || start - now > 10 * 60_000) continue
        remind(
          `event:${e.id}`,
          `${e.title}`,
          `Mulai ${format(new Date(e.start_at), "HH:mm")}${e.meeting_url ? " · buka KRTY untuk Join" : ""}`,
        )
      }
    const weekday = data.now.getDay() % 6 !== 0
    if (prefs.notifyClock && data.clocks && data.attendanceReady) {
      if (weekday && !data.log && data.now.getHours() >= 9)
        remind(
          "clock-in",
          "Belum clock in",
          "Sudah jam kerja. Clock in dari menu bar KRTY.",
        )
      if (data.working && data.worked >= 8 * 60)
        remind("clock-out", "Sudah 8 jam kerja", "Jangan lupa clock out.")
    }
    try {
      localStorage.setItem(key, JSON.stringify(sent))
    } catch {}
  }, [data, prefs.notifyEvents, prefs.notifyClock, scenario])

  const refresh = (keys: string[][]) =>
    Promise.all(
      keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    )

  const actions = useMemo<PopoverActions>(() => {
    const attendance = async (
      method: "POST" | "PATCH",
      body: Record<string, unknown>,
      failed: string,
    ) => {
      const res = await fetch("/api/attendance/logs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => null)
      if (!res?.ok) {
        const payload = await res?.json().catch(() => null)
        toast.error(payload?.error || failed)
      }
      await refresh([["menubar-attendance"]])
    }
    return {
      clockIn: () =>
        void attendance(
          "POST",
          { action: "clock_in", status: "Present" },
          "Gagal clock in",
        ),
      toggleBreak: () =>
        data.log &&
        void attendance(
          "PATCH",
          {
            action: "toggle_break",
            logId: data.log.id,
            isBreak: Boolean(data.log.is_break),
          },
          "Gagal mengubah istirahat",
        ),
      clockOut: () =>
        data.log &&
        void attendance(
          "PATCH",
          { action: "clock_out", logId: data.log.id },
          "Gagal clock out",
        ),
      completeTask: async (id) => {
        const { error } = await createClient()
          .from("project_tasks")
          .update({
            status: "done",
            done: true,
            completed_at: new Date().toISOString(),
          })
          .eq("id", id)
        if (error) toast.error("Gagal menandai tugas selesai")
        await refresh([["my-tasks"]])
      },
      decide: async (leaveId, approve) => {
        // Only pending ones: another admin may have decided meanwhile.
        const { error } = await createClient()
          .from("leave_requests")
          .update(
            approve
              ? { status: "approved", review_note: null }
              : { status: "rejected", review_note: null },
          )
          .eq("id", leaveId)
          .eq("status", "pending")
        if (error) toast.error(approve ? "Gagal menyetujui" : "Gagal menolak")
        else
          toast.success(approve ? "Pengajuan disetujui" : "Pengajuan ditolak")
        await refresh([["menubar-pending-leave"]])
      },
      open: openExternal,
      openNotification: (n) => {
        void markAsRead(n.id)
        if (n.link) openExternal(n.link)
      },
      retry: () => void queryClient.invalidateQueries(),
      signIn: () => openExternal("/desktop/connect"),
      signOut: async () => {
        await createClient().auth.signOut()
        window.location.reload()
      },
      checkUpdate: () => toast("KRTY untuk Mac sudah versi terbaru"),
      todo: () => undefined,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.log, markAsRead, queryClient])

  return (
    <ActionsContext.Provider value={actions}>
      {/* Room around the panel for its shadow (the window is 460×586;
          macOS draws no shadow of its own on it). */}
      <div className="flex justify-center px-5 pt-1.5 pb-5">
        <LayoutRail
          data={data}
          on={ALL}
          className="shadow-[0_12px_28px_-8px_rgb(0_0_0/0.55),0_0_0_0.5px_rgb(0_0_0/0.6)]"
        />
      </div>
    </ActionsContext.Provider>
  )
}

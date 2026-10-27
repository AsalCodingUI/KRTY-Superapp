"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useNotifications } from "@/shared/hooks/useNotifications"
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
    prefs.timerInMenuBar && data.log && data.working
      ? `${Math.floor(data.worked / 60)}j ${data.worked % 60}m`
      : ""
  useEffect(() => {
    void invoke("set_tray_title", { title })
  }, [title])

  // New notifications as macOS notifications (not the ones already there
  // when the app opened).
  const seen = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (scenario !== "real") return
    const ids = new Set(data.unread.map((n) => n.id))
    if (seen.current && prefs.notifyNew) {
      for (const n of data.unread)
        if (!seen.current.has(n.id))
          void invoke("notify", { title: n.title, body: n.message ?? "" })
    }
    seen.current = new Set([...(seen.current ?? []), ...ids])
  }, [data.unread, prefs.notifyNew, scenario])

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
      <LayoutRail data={data} on={ALL} />
    </ActionsContext.Provider>
  )
}

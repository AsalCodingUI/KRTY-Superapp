"use client"

import { siteConfig } from "@/app/siteConfig"
import { createClient } from "@/shared/api/supabase/client"
import {
  ATTENDANCE_NOTE_TAGS,
  hasAttendanceNote,
} from "@/shared/lib/attendance"
import { isAdminRole } from "@/shared/lib/roles"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

/** Sidebar counts, keyed by the href of the page that handles them. */
export type NavBadges = Record<string, number>

const links = siteConfig.baseLinks

/** Stable fallback so consumers' memo deps don't change every render. */
const EMPTY_BADGES: NavBadges = Object.freeze({}) as NavBadges

/** Coalesce bursts (several approvals in a row). */
const REALTIME_DEBOUNCE_MS = 2_000

/**
 * Things waiting on the current user, shown as sidebar badges. Stakeholders
 * see pending leave requests (Persetujuan) and attendance delete requests
 * (Kehadiran). Kept fresh by realtime changes on both tables.
 */
export function useNavBadges(profile: { id: string; role: string } | null) {
  const enabled = Boolean(profile && isAdminRole(profile.role))
  const queryClient = useQueryClient()
  const queryKey = React.useMemo(
    () => ["nav-badges", profile?.id],
    [profile?.id],
  )
  // Logs carrying the delete request tag, from the last count: lets the
  // realtime handler tell which attendance changes can move the count.
  const deleteRequested = React.useRef(new Set<string>())

  const { data } = useQuery({
    queryKey,
    enabled,
    // No polling: the realtime subscription below invalidates on change.
    staleTime: 30_000,
    queryFn: async (): Promise<NavBadges> => {
      const supabase = createClient()
      const [leave, attendance] = await Promise.all([
        supabase
          .from("leave_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        // LIKE, not ILIKE: the tag is always upper case, and this exact
        // condition is what the partial index serves
        // (migrations/attendance_delete_requested_index.sql). The tag can
        // sit anywhere in the "|"-joined notes, hence the wildcards.
        supabase
          .from("attendance_logs")
          .select("id", { count: "exact" })
          .like("notes", `%${ATTENDANCE_NOTE_TAGS.deleteRequested}%`),
      ])
      deleteRequested.current = new Set(
        ((attendance.data ?? []) as { id: string }[]).map((r) => r.id),
      )
      return {
        [links.leave]: leave.count ?? 0,
        [`${links.leave}/attendance`]: attendance.count ?? 0,
      }
    },
  })

  React.useEffect(() => {
    if (!enabled) return
    const supabase = createClient()
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = undefined
        void queryClient.invalidateQueries({ queryKey })
      }, REALTIME_DEBOUNCE_MS)
    }
    // Every clock-in, break and clock-out is an attendance change; only a
    // log gaining the tag, or a tagged one losing it or being deleted
    // (approved), changes the count. Inserts never carry the tag.
    const onAttendance = (
      payload: RealtimePostgresChangesPayload<{
        id?: string
        notes?: string | null
      }>,
    ) => {
      const id =
        payload.eventType === "DELETE" ? payload.old?.id : payload.new?.id
      const wasTagged = Boolean(id && deleteRequested.current.has(id))
      const isTagged =
        payload.eventType === "UPDATE" &&
        hasAttendanceNote(
          payload.new?.notes,
          ATTENDANCE_NOTE_TAGS.deleteRequested,
        )
      if (wasTagged !== isTagged) refresh()
    }
    const channel = supabase
      .channel("nav-badges")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_requests" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "attendance_logs" },
        onAttendance,
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "attendance_logs" },
        onAttendance,
      )
      .subscribe()
    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [enabled, queryClient, queryKey])

  return data ?? EMPTY_BADGES
}

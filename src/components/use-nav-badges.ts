"use client"

import { siteConfig } from "@/app/siteConfig"
import { createClient } from "@/shared/api/supabase/client"
import {
  subscribeTable,
  type TableChange,
} from "@/shared/realtime/table-channel"
import {
  ATTENDANCE_NOTE_TAGS,
  hasAttendanceNote,
} from "@/shared/lib/attendance"
import { isAdminRole } from "@/shared/lib/roles"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

/** Sidebar counts, keyed by the href of the page that handles them. */
export type NavBadges = Record<string, number>

const links = siteConfig.baseLinks

/** Stable fallback so consumers' memo deps don't change every render. */
const EMPTY_BADGES: NavBadges = Object.freeze({}) as NavBadges

/** Coalesce bursts (several approvals in a row): one refetch per second. */
const REALTIME_DEBOUNCE_MS = 1_000

/**
 * Things waiting on the current user, shown as sidebar badges. Stakeholders
 * see pending leave requests (Persetujuan) and attendance delete requests
 * (Kehadiran). Kept fresh by realtime changes on both tables, only for
 * stakeholders (both counts are company-wide, so nobody else subscribes),
 * on the app's shared per-table channels, and only for changes that can
 * move a count.
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
  // Likewise the pending leave requests.
  const pendingLeave = React.useRef(new Set<string>())

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
          .select("id", { count: "exact" })
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
      pendingLeave.current = new Set(
        ((leave.data ?? []) as { id: string }[]).map((r) => r.id),
      )
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
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = undefined
        void queryClient.invalidateQueries({ queryKey })
      }, REALTIME_DEBOUNCE_MS)
    }
    const idOf = (payload: TableChange) =>
      (payload.eventType === "DELETE" ? payload.old?.id : payload.new?.id) as
        | string
        | undefined
    // Only a request becoming pending, or a pending one leaving that state
    // (approved, rejected, cancelled, deleted), changes the count.
    const onLeave = (payload: TableChange) => {
      const id = idOf(payload)
      const wasPending = Boolean(id && pendingLeave.current.has(id))
      const isPending =
        payload.eventType !== "DELETE" && payload.new?.status === "pending"
      if (wasPending !== isPending) refresh()
    }
    // Every clock-in, break and clock-out is an attendance change; only a
    // log gaining the tag, or a tagged one losing it or being deleted
    // (approved), changes the count. Inserts never carry the tag.
    const onAttendance = (payload: TableChange) => {
      if (payload.eventType === "INSERT") return
      const id = idOf(payload)
      const wasTagged = Boolean(id && deleteRequested.current.has(id))
      const isTagged =
        payload.eventType === "UPDATE" &&
        hasAttendanceNote(
          payload.new?.notes as string | null | undefined,
          ATTENDANCE_NOTE_TAGS.deleteRequested,
        )
      if (wasTagged !== isTagged) refresh()
    }
    // No server filter can narrow these: an update is matched on its new
    // row (a filter on status would miss approvals) and the tag sits inside
    // the notes (no LIKE filter). The channels are the app's shared ones.
    const offLeave = subscribeTable("leave_requests", undefined, onLeave)
    const offAttendance = subscribeTable(
      "attendance_logs",
      undefined,
      onAttendance,
    )
    return () => {
      if (timer) clearTimeout(timer)
      offLeave()
      offAttendance()
    }
  }, [enabled, queryClient, queryKey])

  return data ?? EMPTY_BADGES
}

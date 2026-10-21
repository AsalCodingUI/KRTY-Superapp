"use client"

import { siteConfig } from "@/app/siteConfig"
import { createClient } from "@/shared/api/supabase/client"
import { ATTENDANCE_NOTE_TAGS } from "@/shared/lib/attendance"
import { isAdminRole } from "@/shared/lib/roles"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

/** Sidebar counts, keyed by the href of the page that handles them. */
export type NavBadges = Record<string, number>

const links = siteConfig.baseLinks

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

  const { data } = useQuery({
    queryKey,
    enabled,
    staleTime: 30_000,
    refetchInterval: 120_000,
    queryFn: async (): Promise<NavBadges> => {
      const supabase = createClient()
      const [leave, attendance] = await Promise.all([
        supabase
          .from("leave_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("attendance_logs")
          .select("id", { count: "exact", head: true })
          .ilike("notes", `%${ATTENDANCE_NOTE_TAGS.deleteRequested}%`),
      ])
      return {
        [links.leave]: leave.count ?? 0,
        [`${links.leave}/attendance`]: attendance.count ?? 0,
      }
    },
  })

  React.useEffect(() => {
    if (!enabled) return
    const supabase = createClient()
    const refresh = () => queryClient.invalidateQueries({ queryKey })
    const channel = supabase
      .channel("nav-badges")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_requests" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_logs" },
        refresh,
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, queryClient, queryKey])

  return data ?? {}
}

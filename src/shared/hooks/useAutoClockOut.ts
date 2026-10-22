"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQuery } from "@tanstack/react-query"

export type AutoClockOut = { enabled: boolean; time: string }

export const AUTO_CLOCK_OUT_QUERY_KEY = ["attendance-preferences", "me"]
export const AUTO_CLOCK_OUT_DEFAULTS: AutoClockOut = {
  enabled: false,
  time: "17:00",
}

/**
 * The signed-in person's own auto clock-out choice (attendance_preferences,
 * read by the cron job in migrations/auto_clock_out_per_user.sql).
 * Falls back to "off" when there is no row yet.
 */
export function useAutoClockOut() {
  return useQuery({
    queryKey: AUTO_CLOCK_OUT_QUERY_KEY,
    queryFn: async (): Promise<AutoClockOut> => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return AUTO_CLOCK_OUT_DEFAULTS
      const { data, error } = await supabase
        .from("attendance_preferences" as never)
        .select("auto_clock_out, auto_clock_out_time")
        .eq("user_id", user.id)
        .maybeSingle()
      if (error || !data) return AUTO_CLOCK_OUT_DEFAULTS
      const row = data as {
        auto_clock_out: boolean
        auto_clock_out_time: string | null
      }
      return {
        enabled: row.auto_clock_out,
        // Postgres `time` comes back as HH:MM:SS.
        time: (row.auto_clock_out_time ?? "17:00").slice(0, 5),
      }
    },
  })
}

"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQuery } from "@tanstack/react-query"

export type AutoClockOut = { enabled: boolean; time: string }

const KEY = "auto_clock_out"
const DEFAULTS: AutoClockOut = { enabled: false, time: "17:00" }

/** Read by the cron job in migrations/add_auto_clock_out.sql. */
export function useAutoClockOut() {
  return useQuery({
    queryKey: ["app-settings", KEY],
    queryFn: async (): Promise<AutoClockOut> => {
      const { data, error } = await createClient()
        .from("app_settings")
        .select("value")
        .eq("key", KEY)
        .maybeSingle()
      if (error) throw error
      return { ...DEFAULTS, ...((data?.value as Partial<AutoClockOut>) ?? {}) }
    },
  })
}

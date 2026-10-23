"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import type { FxRates } from "../lib/money"

/** Default IDR rates per currency (markup included), set by stakeholders. */
export function useFxRates() {
  const supabase = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: ["finance", "fx-rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "finance_fx_rates")
        .maybeSingle()
      if (error) throw error
      const value = (data?.value ?? {}) as Record<string, unknown>
      const rates: FxRates = {}
      for (const [code, rate] of Object.entries(value))
        if (typeof rate === "number" && rate > 0) rates[code] = rate
      return rates
    },
  })
}

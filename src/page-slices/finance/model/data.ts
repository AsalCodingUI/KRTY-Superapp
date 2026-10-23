"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import type { InvoiceLite, Subscription } from "@/entities/finance/lib/money"

export const financeKeys = {
  all: ["finance"] as const,
  invoices: () => ["finance", "invoices"] as const,
  subscriptions: () => ["finance", "subscriptions"] as const,
  goal: (year: number) => ["finance", "goal", year] as const,
  rates: () => ["finance", "fx-rates"] as const,
}

/** All invoices, not Draft (drafts are not money yet). Stakeholders only. */
export function useFinanceInvoices() {
  const supabase = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: financeKeys.invoices(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_invoices")
        .select(
          `id, invoice_number, status, issue_date, due_date, amount_idr,
           amount_paid_idr, currency, fx_rate,
           project:projects ( id, name, client_name )`,
        )
        .neq("status", "Draft")
        .order("due_date")
      if (error) throw error
      return (data ?? []) as unknown as InvoiceLite[]
    },
  })
}

export function useSubscriptions() {
  const supabase = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: financeKeys.subscriptions(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_subscriptions")
        .select(
          "id, name, category, amount_idr, currency, fx_rate, cycle, anchor_date, ends_on, notes",
        )
        .order("name")
      if (error) throw error
      return (data ?? []) as Subscription[]
    },
  })
}

export function useFinanceGoal(year: number) {
  const supabase = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: financeKeys.goal(year),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", `finance_goal_${year}`)
        .maybeSingle()
      if (error) throw error
      const amount = (data?.value as { amount_idr?: number } | null)?.amount_idr
      return typeof amount === "number" ? amount : null
    },
  })
}

export { useFxRates } from "@/entities/finance/model/useFxRates"

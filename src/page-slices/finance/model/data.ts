"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { parseISO } from "date-fns"
import { useMemo } from "react"
import type { InvoiceLite, Subscription } from "@/entities/finance/lib/money"

export const financeKeys = {
  all: ["finance"] as const,
  invoices: (year?: number) =>
    year === undefined
      ? (["finance", "invoices"] as const)
      : (["finance", "invoices", year] as const),
  firstInvoiceYear: () => ["finance", "invoices", "first-year"] as const,
  subscriptions: () => ["finance", "subscriptions"] as const,
  goal: (year: number) => ["finance", "goal", year] as const,
  rates: () => ["finance", "fx-rates"] as const,
}

/** One year's invoices (by issue date), not Draft. Stakeholders only. */
export function useFinanceInvoices(year: number) {
  const supabase = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: financeKeys.invoices(year),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_invoices")
        .select(
          `id, invoice_number, status, issue_date, due_date, amount_idr,
           amount_paid_idr, currency, fx_rate,
           project:projects ( id, name, client_name )`,
        )
        .neq("status", "Draft")
        .gte("issue_date", `${year}-01-01`)
        .lt("issue_date", `${year + 1}-01-01`)
        .order("due_date")
      if (error) throw error
      return (data ?? []) as unknown as InvoiceLite[]
    },
  })
}

/** The year of the earliest non-draft invoice (for the year picker). */
export function useFirstInvoiceYear() {
  const supabase = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: financeKeys.firstInvoiceYear(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_invoices")
        .select("issue_date")
        .neq("status", "Draft")
        .order("issue_date")
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data?.issue_date ? parseISO(data.issue_date).getFullYear() : null
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

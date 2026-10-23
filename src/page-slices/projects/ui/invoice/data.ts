"use client"

import { createClient } from "@/shared/api/supabase/client"
import {
  AGENCY_SETTING_KEY,
  DEFAULT_AGENCY,
  type AgencyProfile,
  type PaymentType,
} from "@/entities/finance/lib/invoice"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export const FINANCE_BUCKET = "finance-assets"

export type PaymentMethod = {
  id: string
  name: string
  type: PaymentType
  details: Record<string, string>
  notes: string | null
  qr_path: string | null
  verified_at: string | null
  is_active: boolean
  sort: number
}

export const invoiceKeys = {
  methods: ["payment-methods", "full"] as const,
  agency: ["app-setting", AGENCY_SETTING_KEY] as const,
  numbers: (prefix: string) => ["invoice-numbers", prefix] as const,
}

const db = () => createClient()

/** Payment methods with their details (stakeholders only, by RLS). */
export function usePaymentMethods(enabled = true) {
  return useQuery({
    queryKey: invoiceKeys.methods,
    enabled,
    queryFn: async () => {
      const { data, error } = await db()
        .from("payment_methods")
        .select(
          "id, name, type, details, notes, qr_path, verified_at, is_active, sort",
        )
        .order("sort")
        .order("name")
      if (error) throw error
      return (data ?? []) as unknown as PaymentMethod[]
    },
  })
}

/** Studio name, tagline, email and address printed on every invoice. */
export function useAgency() {
  return useQuery({
    queryKey: invoiceKeys.agency,
    queryFn: async () => {
      const { data } = await db()
        .from("app_settings")
        .select("value")
        .eq("key", AGENCY_SETTING_KEY)
        .maybeSingle()
      return {
        ...DEFAULT_AGENCY,
        ...((data?.value ?? {}) as Partial<AgencyProfile>),
      }
    },
  })
}

export async function saveAgency(profile: AgencyProfile) {
  const { error } = await db()
    .from("app_settings")
    .upsert({ key: AGENCY_SETTING_KEY, value: profile }, { onConflict: "key" })
  if (error) throw error
}

/** Invoice numbers already used with a "INV-KR-YYMM-" prefix. */
export function useInvoiceNumbers(prefix: string, enabled = true) {
  return useQuery({
    queryKey: invoiceKeys.numbers(prefix),
    enabled,
    queryFn: async () => {
      const { data } = await db()
        .from("project_invoices")
        .select("invoice_number")
        .like("invoice_number", `${prefix}%`)
      return ((data ?? []) as { invoice_number: string }[]).map(
        (r) => r.invoice_number,
      )
    },
  })
}

/** Signed URL for a QR code (private bucket). */
export function useQrUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["finance-asset-url", path],
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await db()
        .storage.from(FINANCE_BUCKET)
        .createSignedUrl(path!, 60 * 60)
      if (error || !data) throw error ?? new Error("no url")
      return data.signedUrl
    },
  })
}

export function useRefreshInvoices() {
  const queryClient = useQueryClient()
  return (projectId?: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["invoices"] }),
      queryClient.invalidateQueries({ queryKey: ["invoice-numbers"] }),
      queryClient.invalidateQueries({ queryKey: ["finance"] }),
      projectId
        ? queryClient.invalidateQueries({
            queryKey: ["project-summary", projectId],
          })
        : null,
    ])
}

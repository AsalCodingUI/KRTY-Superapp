"use client"

import { createClient } from "@/shared/api/supabase/client"
import type { ProjectStatus } from "@/page-slices/projects/lib/status"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

export type ClientProject = {
  id: string
  name: string
  status: ProjectStatus
  end_date: string
  project_invoices: {
    status: string
    amount_idr: number
    amount_paid_idr: number
    currency: string
    fx_rate: number | null
  }[]
}

export type ClientRow = {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  country: string | null
  address: string | null
  currency: string
  notes: string | null
  archived_at: string | null
  created_at: string
  projects: ClientProject[]
}

export const clientKeys = {
  all: ["clients"] as const,
  list: () => ["clients", "list"] as const,
}

/** Every client with its projects and their invoices (stakeholders only). */
export function useClients(enabled = true) {
  const supabase = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: clientKeys.list(),
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select(
          `id, name, contact_name, email, phone, website, country, address, currency,
           notes, archived_at, created_at,
           projects:projects!projects_client_id_fkey (
             id, name, status, end_date,
             project_invoices ( status, amount_idr, amount_paid_idr, currency, fx_rate )
           )`,
        )
        .order("name")
      if (error) throw error
      return (data ?? []) as unknown as ClientRow[]
    },
  })
}

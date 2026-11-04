import type {
  InvoiceStatus,
  SaveInvoicePayload,
} from "@/app/(main)/finance/actions/invoice-actions"
import { createClient } from "@/shared/api/supabase/client"

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}

export type { InvoiceStatus, SaveInvoicePayload }

export async function getAllInvoices() {
  const response = await fetch("/api/finance/invoices", { cache: "no-store" })
  return parseJson<any>(response)
}

/**
 * A project's invoices, read straight from the browser: the API route ran
 * the same query with the same user's session (RLS decides either way), so
 * this only skips the extra hop. Same result shape as the route.
 */
export async function getInvoicesByProject(projectId: string) {
  const { data, error } = await createClient()
    .from("project_invoices")
    .select("*, payment_methods(id, name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
  if (error) return { success: false as const, error: error.message, data: [] }
  return { success: true as const, data: data || [] }
}

export async function saveInvoice(payload: SaveInvoicePayload) {
  const response = await fetch("/api/finance/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return parseJson<any>(response)
}

export async function updateInvoice(
  id: string,
  payload: Partial<SaveInvoicePayload>,
) {
  const response = await fetch("/api/finance/invoices", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, payload }),
  })
  return parseJson<any>(response)
}

export async function deleteInvoice(id: string) {
  const response = await fetch("/api/finance/invoices", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  })
  return parseJson<any>(response)
}

export async function getPaymentMethods() {
  const response = await fetch("/api/finance/payment-methods", {
    cache: "no-store",
  })
  return parseJson<any>(response)
}

export async function savePaymentMethod(name: string) {
  const response = await fetch("/api/finance/payment-methods", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  return parseJson<any>(response)
}

export async function updatePaymentMethod(id: string, name: string) {
  const response = await fetch("/api/finance/payment-methods", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, name }),
  })
  return parseJson<any>(response)
}

export async function deletePaymentMethod(id: string) {
  const response = await fetch("/api/finance/payment-methods", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  })
  return parseJson<any>(response)
}

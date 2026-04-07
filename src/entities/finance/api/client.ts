import type {
  InvoiceStatus,
  SaveInvoicePayload,
} from "@/app/(main)/finance/actions/invoice-actions"

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}

export type { InvoiceStatus, SaveInvoicePayload }

export async function getAllInvoices() {
  const response = await fetch("/api/finance/invoices", { cache: "no-store" })
  return parseJson<any>(response)
}

export async function getInvoicesByProject(projectId: string) {
  const params = new URLSearchParams({ projectId })
  const response = await fetch(`/api/finance/invoices?${params.toString()}`, {
    cache: "no-store",
  })
  return parseJson<any>(response)
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

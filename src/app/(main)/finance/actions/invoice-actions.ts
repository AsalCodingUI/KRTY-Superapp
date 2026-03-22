"use server"

import { createClient } from "@/shared/api/supabase/server"

export type InvoiceStatus = "Draft" | "Sent" | "Partial" | "Paid" | "Overdue"

export type LineItem = {
  id: string
  description: string
  quantity: number
  unit_price_idr: number
  total_idr: number
}

export type SaveInvoicePayload = {
  projectId: string
  invoiceNumber: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  amountIdr: number
  amountPaidIdr: number
  paymentMethodId: string | null
  notes: string | null
  lineItems: LineItem[]
}

export async function getInvoicesByProject(projectId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("project_invoices")
    .select("*, payment_methods(id, name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false as const, error: error.message, data: [] }
  }

  return { success: true as const, data: data || [] }
}

export async function getAllInvoices() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("project_invoices")
    .select("*, projects(id, name), payment_methods(id, name)")
    .order("created_at", { ascending: false })

  if (error) {
    return { success: false as const, error: error.message, data: [] }
  }

  return { success: true as const, data: data || [] }
}

export async function saveInvoice(payload: SaveInvoicePayload) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("project_invoices")
    .insert({
      project_id: payload.projectId,
      invoice_number: payload.invoiceNumber,
      status: payload.status,
      issue_date: payload.issueDate,
      due_date: payload.dueDate,
      amount_idr: payload.amountIdr,
      amount_paid_idr: payload.amountPaidIdr,
      payment_method_id: payload.paymentMethodId,
      notes: payload.notes,
      line_items: payload.lineItems as unknown as Record<string, unknown>,
    })
    .select()
    .single()

  if (error) {
    return { success: false as const, error: error.message }
  }

  return { success: true as const, data }
}

export async function updateInvoice(
  id: string,
  payload: Partial<SaveInvoicePayload>,
) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (payload.projectId !== undefined) updateData.project_id = payload.projectId
  if (payload.invoiceNumber !== undefined)
    updateData.invoice_number = payload.invoiceNumber
  if (payload.status !== undefined) updateData.status = payload.status
  if (payload.issueDate !== undefined) updateData.issue_date = payload.issueDate
  if (payload.dueDate !== undefined) updateData.due_date = payload.dueDate
  if (payload.amountIdr !== undefined) updateData.amount_idr = payload.amountIdr
  if (payload.amountPaidIdr !== undefined)
    updateData.amount_paid_idr = payload.amountPaidIdr
  if (payload.paymentMethodId !== undefined)
    updateData.payment_method_id = payload.paymentMethodId
  if (payload.notes !== undefined) updateData.notes = payload.notes
  if (payload.lineItems !== undefined) updateData.line_items = payload.lineItems

  const { data, error } = await supabase
    .from("project_invoices")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false as const, error: error.message }
  }

  return { success: true as const, data }
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("project_invoices")
    .delete()
    .eq("id", id)

  if (error) {
    return { success: false as const, error: error.message }
  }

  return { success: true as const }
}

export async function getPaymentMethods() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    return { success: false as const, error: error.message, data: [] }
  }

  return { success: true as const, data: data || [] }
}

export async function savePaymentMethod(name: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payment_methods")
    .insert({ name })
    .select()
    .single()

  if (error) {
    return { success: false as const, error: error.message }
  }

  return { success: true as const, data }
}

export async function updatePaymentMethod(id: string, name: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payment_methods")
    .update({ name })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { success: false as const, error: error.message }
  }

  return { success: true as const, data }
}

export async function deletePaymentMethod(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("payment_methods").delete().eq("id", id)

  if (error) {
    return { success: false as const, error: error.message }
  }

  return { success: true as const }
}

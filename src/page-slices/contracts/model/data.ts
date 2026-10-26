"use client"

import { createClient } from "@/shared/api/supabase/client"
import type { MessageKey } from "@/shared/i18n/messages"
import {
  slugify,
  splitFileName,
  uploadUnique,
} from "@/shared/lib/storage-names"
import type { Database } from "@/shared/types/database.types"
import { differenceInCalendarDays, parseISO } from "date-fns"
import { useQuery } from "@tanstack/react-query"

/**
 * Employee contracts. HR signs and stamps (e-Meterai) the PDF with an
 * official provider outside the app; here it is only stored and shared.
 * Reads and writes go straight through Supabase: RLS shows employees their
 * own sent contracts and gives stakeholders everything.
 */

type Tables = Database["public"]["Tables"]
export type ContractRecord = Tables["employee_contracts"]["Row"]

export type ContractPerson = {
  id: string
  full_name: string | null
  avatar_url: string | null
  job_title: string | null
}

export type ContractRow = ContractRecord & { person: ContractPerson | null }

export const CONTRACT_KINDS = [
  "pkwt",
  "pkwtt",
  "freelance",
  "nda",
  "addendum",
  "other",
] as const
export type ContractKind = (typeof CONTRACT_KINDS)[number]

export const KIND_LABEL_KEYS: Record<ContractKind, MessageKey<"contracts">> = {
  pkwt: "kindPkwt",
  pkwtt: "kindPkwtt",
  freelance: "kindFreelance",
  nda: "kindNda",
  addendum: "kindAddendum",
  other: "kindOther",
}

export type ContractStatus = "draft" | "sent" | "acknowledged"

export const STATUS_LABEL_KEYS: Record<
  ContractStatus,
  MessageKey<"contracts">
> = {
  draft: "statusDraft",
  sent: "statusSent",
  acknowledged: "statusAcknowledged",
}

export const kindLabelKey = (kind: string) =>
  KIND_LABEL_KEYS[kind as ContractKind] ?? "kindOther"
export const statusLabelKey = (status: string) =>
  STATUS_LABEL_KEYS[status as ContractStatus] ?? "statusSent"

export const supabase = () => createClient()

export const contractKeys = {
  all: ["contracts"] as const,
  list: (scope: string) => ["contracts", "list", scope] as const,
  people: ["contracts", "people"] as const,
}

const CONTRACT_COLUMNS = `*, person:profiles!employee_contracts_user_id_fkey (
  id, full_name, avatar_url, job_title
)`

/**
 * Contracts the viewer may see: everyone's for stakeholders (`userId`
 * null), otherwise one person's. Newest period first.
 */
export function useContracts(userId: string | null, enabled = true) {
  return useQuery({
    queryKey: contractKeys.list(userId ?? "all"),
    enabled,
    queryFn: async () => {
      let query = supabase()
        .from("employee_contracts")
        .select(CONTRACT_COLUMNS)
        .order("start_date", { ascending: false })
        .order("created_at", { ascending: false })
      // Employees never see drafts (RLS too; this also covers "view as",
      // where queries run with the admin's rights).
      if (userId) query = query.eq("user_id", userId).neq("status", "draft")
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as unknown as ContractRow[]
    },
  })
}

/** Everyone a contract can be uploaded for (stakeholders' form). */
export function useContractPeople(enabled = true) {
  return useQuery({
    queryKey: contractKeys.people,
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase()
        .from("profiles")
        .select("id, full_name, avatar_url, job_title")
        .order("full_name")
      if (error) throw error
      return (data ?? []) as ContractPerson[]
    },
  })
}

export const BUCKET = "employee-contracts"

/** "<name-slug>--<user-id>" (storage RLS reads the id from the end). */
export function contractDir(userId: string, name: string | null) {
  return `${slugify(name || "karyawan", 40)}--${userId}`
}

/** Uploads under "<name>--<id>/<title>.pdf" ("-2" if the name is taken). */
export function uploadContractFile(
  userId: string,
  personName: string | null,
  title: string,
  file: File,
) {
  const { ext } = splitFileName(file.name)
  return uploadUnique(
    supabase(),
    BUCKET,
    contractDir(userId, personName),
    slugify(title),
    ext || "pdf",
    file,
  )
}

export async function removeContractFile(path: string) {
  await supabase().storage.from(BUCKET).remove([path])
}

const FILE_URL_TTL_S = 60 * 60

/** Signed URL to show the PDF inline; cached a little under its lifetime. */
export function useContractFileUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["contract-file-url", path],
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase()
        .storage.from(BUCKET)
        .createSignedUrl(path!, FILE_URL_TTL_S)
      if (error || !data) throw error ?? new Error("no url")
      return data.signedUrl
    },
  })
}

/** Short-lived link that downloads the PDF under a readable name. */
export async function downloadContract(path: string, name: string) {
  const { data, error } = await supabase()
    .storage.from(BUCKET)
    .createSignedUrl(path, 60, { download: `${name}.pdf` })
  if (error || !data) throw error ?? new Error("no url")
  window.location.assign(data.signedUrl)
}

/** Days until the contract ends (negative once ended); null if open-ended. */
export function daysLeft(contract: Pick<ContractRecord, "end_date">) {
  if (!contract.end_date) return null
  return differenceInCalendarDays(parseISO(contract.end_date), new Date())
}

/** Ends within the next 30 days (today included). */
export function endsSoon(contract: Pick<ContractRecord, "end_date">) {
  const days = daysLeft(contract)
  return days !== null && days >= 0 && days <= 30
}

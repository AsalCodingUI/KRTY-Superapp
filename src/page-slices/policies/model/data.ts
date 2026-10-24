"use client"

import { createClient } from "@/shared/api/supabase/client"
import type { MessageKey } from "@/shared/i18n/messages"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

export const POLICY_CATEGORIES = [
  "Umum",
  "Cuti",
  "Kehadiran",
  "Jam kerja",
  "Benefit",
  "Keuangan",
  "Etika & perilaku",
] as const

/** Stored category values stay Indonesian; only the label is translated. */
const CATEGORY_KEYS: Record<string, MessageKey<"policies">> = {
  Umum: "catGeneral",
  Cuti: "catLeave",
  Kehadiran: "catAttendance",
  "Jam kerja": "catWorkHours",
  Benefit: "catBenefit",
  Keuangan: "catFinance",
  "Etika & perilaku": "catEthics",
}

/** Display label for a category; custom categories show as written. */
export function categoryLabel(
  t: (key: MessageKey<"policies">) => string,
  category: string,
) {
  const key = CATEGORY_KEYS[category]
  return key ? t(key) : category
}

export type PolicyVersion = {
  id: string
  status: "Draft" | "Published"
  version_number: string
  title: string
  summary: string | null
  body: string
  change_summary: string | null
  effective_at: string | null
  published_at: string | null
  updated_at: string
  author: { full_name: string | null } | null
}

export type PolicyListItem = {
  id: string
  title: string
  category: string
  summary: string | null
  archived_at: string | null
  current_version_id: string | null
  versions: Pick<
    PolicyVersion,
    | "id"
    | "status"
    | "version_number"
    | "title"
    | "effective_at"
    | "published_at"
    | "updated_at"
  >[]
}

/** A version without its body (loaded per version with `usePolicyBody`). */
export type PolicyVersionMeta = Omit<PolicyVersion, "body">

export type PolicyDetail = Omit<PolicyListItem, "versions"> & {
  versions: PolicyVersionMeta[]
}

export const policyKeys = {
  all: ["policies"] as const,
  list: () => ["policies", "list"] as const,
  detail: (id: string) => ["policies", "detail", id] as const,
  /** Keyed by `updated_at` too: a saved draft gets a new body. */
  body: (versionId: string, updatedAt: string) =>
    ["policies", "body", versionId, updatedAt] as const,
}

/** Published versions newest first; the draft (stakeholders only) apart. */
export function splitVersions<
  T extends { status: string; version_number: string },
>(versions: T[]) {
  const published = versions
    .filter((v) => v.status === "Published")
    .sort((a, b) => Number(b.version_number) - Number(a.version_number))
  const draft = versions.find((v) => v.status === "Draft") ?? null
  return { published, latest: published[0] ?? null, draft }
}

/** RLS hides drafts and archived rules from employees. */
export function usePolicies() {
  const supabase = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: policyKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policy_documents")
        .select(
          `id, title, category, summary, archived_at, current_version_id,
           versions:policy_versions!policy_versions_document_id_fkey (
             id, status, version_number, title, effective_at, published_at,
             updated_at
           )`,
        )
        .order("title")
      if (error) throw error
      return (data ?? []) as unknown as PolicyListItem[]
    },
  })
}

/**
 * One rule with its version list (no bodies). The body of the version in
 * force comes along in the same request and seeds `usePolicyBody`; other
 * versions load their body when opened.
 */
export function usePolicy(id: string) {
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: policyKeys.detail(id),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policy_documents")
        .select(
          `id, title, category, summary, archived_at, current_version_id,
           current:policy_versions!policy_documents_current_version_id_fkey (
             id, body
           ),
           versions:policy_versions!policy_versions_document_id_fkey (
             id, status, version_number, title, summary, change_summary,
             effective_at, published_at, updated_at,
             author:profiles!policy_versions_created_by_fkey ( full_name )
           )`,
        )
        .eq("id", id)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      const { current, ...detail } = data as unknown as PolicyDetail & {
        current: { id: string; body: string } | null
      }
      const inForce =
        current && detail.versions?.find((v) => v.id === current.id)
      if (current && inForce)
        queryClient.setQueryData(
          policyKeys.body(current.id, inForce.updated_at),
          current.body,
        )
      return detail as PolicyDetail
    },
  })
}

/** The Markdown body of one version; fetched once per saved state. */
export function usePolicyBody(
  version: Pick<PolicyVersionMeta, "id" | "updated_at"> | null,
) {
  const supabase = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: policyKeys.body(version?.id ?? "", version?.updated_at ?? ""),
    enabled: Boolean(version),
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policy_versions")
        .select("body")
        .eq("id", version!.id)
        .maybeSingle()
      if (error) throw error
      return (data?.body as string | undefined) ?? ""
    },
  })
}

"use client"

import { Markdown } from "@/components/markdown"
import { Spinner } from "@/components/ui/spinner"
import {
  POLICY_SLUGS,
  usePublishedPolicy,
} from "@/entities/policy/model/usePublishedPolicy"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"

/**
 * Aturan cuti, read from the "aturan-cuti" rule in Aturan so HR edits it in
 * one place and every leave screen shows the version in force.
 */
export function LeaveRules() {
  const { data: policy, isLoading } = usePublishedPolicy(POLICY_SLUGS.leave)

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="size-5" />
      </div>
    )
  }

  if (!policy) {
    return (
      <p className="text-muted-foreground text-sm">
        Aturan cuti belum diterbitkan. Tanyakan ke admin, atau cek di{" "}
        <Link href="/policies" className="text-primary hover:underline">
          Aturan
        </Link>
        .
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Markdown className="text-sm leading-6">{policy.body}</Markdown>
      <p className="text-muted-foreground border-border border-t pt-3 text-xs">
        Versi {policy.version}
        {policy.effectiveAt &&
          ` · berlaku sejak ${format(new Date(policy.effectiveAt), "d MMM yyyy", { locale: idLocale })}`}
        {" · "}
        <Link
          href={`/policies/${policy.id}`}
          className="text-primary hover:underline"
        >
          Buka di Aturan
        </Link>
      </p>
    </div>
  )
}

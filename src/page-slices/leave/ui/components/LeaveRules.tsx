"use client"

import { Markdown } from "@/components/markdown"
import { Spinner } from "@/components/ui/spinner"
import {
  POLICY_SLUGS,
  usePublishedPolicy,
} from "@/entities/policy/model/usePublishedPolicy"
import { format } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"
import Link from "next/link"

/**
 * Aturan cuti, read from the "aturan-cuti" rule in Aturan so HR edits it in
 * one place and every leave screen shows the version in force.
 */
export function LeaveRules() {
  const t = useT("leave")
  const dateLocale = useDateLocale()
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
        {t("rulesNotPublished")}{" "}
        <Link href="/policies" className="text-primary hover:underline">
          {t("policiesLink")}
        </Link>
        .
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Markdown className="text-sm leading-6">{policy.body}</Markdown>
      <p className="text-muted-foreground border-border border-t pt-3 text-xs">
        {t("rulesVersion", { version: policy.version })}
        {policy.effectiveAt &&
          ` · ${t("rulesEffectiveSince", { date: format(new Date(policy.effectiveAt), "d MMM yyyy", { locale: dateLocale }) })}`}
        {" · "}
        <Link
          href={`/policies/${policy.id}`}
          className="text-primary hover:underline"
        >
          {t("rulesOpenInPolicies")}
        </Link>
      </p>
    </div>
  )
}

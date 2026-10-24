"use client"

import { cn } from "@/lib/utils"
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
} from "date-fns"
import type { Locale } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"
import { RefreshCW as RefreshCw } from "@/components/icons"
import { FilePen, FilePlus2 } from "lucide-react"
import type { PolicyVersionMeta as PolicyVersion } from "../model/data"

/** "16:16" today, "Kemarin, 16:16", "Jumat, 16:16" this week, else a date. */
export function when(
  value: string | null,
  t: (key: MessageKey<"policies">, vars?: Record<string, string>) => string,
  locale: Locale,
) {
  if (!value) return ""
  const date = new Date(value)
  const days = differenceInCalendarDays(new Date(), date)
  if (days === 0) {
    const minutes = (Date.now() - date.getTime()) / 60_000
    return minutes < 60
      ? formatDistanceToNowStrict(date, { addSuffix: true, locale })
      : t("todayAt", { time: format(date, "HH:mm") })
  }
  if (days === 1) return t("yesterdayAt", { time: format(date, "HH:mm") })
  if (days < 7) return format(date, "EEEE, HH:mm", { locale })
  return format(date, "d MMM yyyy", { locale })
}

type Entry = {
  key: string
  kind: "draft" | "created" | "updated"
  who: string
  at: string | null
  note: string | null
  current: boolean
  viewing: boolean
  onSelect: () => void
}

const ICONS = {
  draft: {
    icon: FilePen,
    tone: "border-border bg-background text-muted-foreground border border-dashed",
  },
  created: { icon: FilePlus2, tone: "bg-success text-white" },
  updated: { icon: RefreshCw, tone: "bg-primary text-primary-foreground" },
} as const

/**
 * Activity-style history (Attio): an icon on the rail, "who did what",
 * when, and the change note as an outlined quote. Clicking opens that version.
 */
export function PolicyHistory({
  published,
  draft,
  viewingId,
  onSelect,
}: {
  published: PolicyVersion[]
  draft: PolicyVersion | null
  viewingId: string | null
  onSelect: (version: PolicyVersion) => void
}) {
  const t = useT("policies")
  const dateLocale = useDateLocale()
  const entries: Entry[] = [
    ...(draft
      ? [
          {
            key: draft.id,
            kind: "draft" as const,
            who: draft.author?.full_name ?? "Admin",
            at: draft.updated_at,
            note: null,
            current: false,
            viewing: viewingId === draft.id,
            onSelect: () => onSelect(draft),
          },
        ]
      : []),
    ...published.map((v, i) => ({
      key: v.id,
      kind: (i === published.length - 1
        ? "created"
        : "updated") as Entry["kind"],
      who: v.author?.full_name ?? "Admin",
      at: v.published_at,
      note: v.change_summary,
      current: i === 0,
      viewing: viewingId === v.id,
      onSelect: () => onSelect(v),
    })),
  ]

  if (entries.length === 0) return null

  return (
    <section aria-label={t("history")} className="flex flex-col">
      <h2 className="text-heading pb-4 text-sm font-semibold">
        {t("history")}
      </h2>
      <ol className="flex flex-col">
        {entries.map((e, i) => {
          const { icon: Icon, tone } = ICONS[e.kind]
          const last = i === entries.length - 1
          return (
            <li key={e.key} className="relative flex gap-3">
              {!last && (
                <span
                  aria-hidden
                  className="bg-border absolute top-6 bottom-0 left-2.5 w-px -translate-x-1/2"
                />
              )}
              <span
                className={cn(
                  "relative mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                  tone,
                )}
              >
                <Icon className="size-3" />
              </span>
              <button
                type="button"
                onClick={e.onSelect}
                aria-current={e.viewing ? "true" : undefined}
                className="group flex min-w-0 flex-1 flex-col gap-1 pb-5 text-left"
              >
                <span className="text-muted-foreground text-sm leading-snug">
                  <span className="text-foreground">{e.who}</span>{" "}
                  {e.kind === "draft"
                    ? t("historyDraft")
                    : e.kind === "created"
                      ? t("historyCreated")
                      : t("historyUpdated")}
                </span>
                <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-[13px]">
                  <span>{when(e.at, t, dateLocale)}</span>
                  {(e.current || e.viewing || e.kind === "draft") && (
                    <span aria-hidden>·</span>
                  )}
                  {e.current && (
                    <span className="text-success">{t("inForce")}</span>
                  )}
                  {e.kind === "draft" && <span>{t("notPublished")}</span>}
                  {e.viewing && (
                    <span className="text-foreground">{t("viewing")}</span>
                  )}
                  {!e.viewing && (
                    <span className="text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      {t("view")}
                    </span>
                  )}
                </span>
                {e.note && (
                  <span className="border-border mt-1.5 rounded-lg border px-3 py-2">
                    <span className="border-border block border-l-2 pl-3 text-sm leading-relaxed">
                      {e.note}
                    </span>
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

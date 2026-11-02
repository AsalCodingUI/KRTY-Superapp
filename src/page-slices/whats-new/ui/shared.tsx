"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { WhatsNewArea, WhatsNewEntry, WhatsNewTag } from "../model/types"
import { useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"

type Key = MessageKey<"whatsNew">

export const AREA_LABEL: Record<WhatsNewArea, Key> = {
  general: "areaGeneral",
  projects: "areaProjects",
  tasks: "areaTasks",
  editor: "areaEditor",
  ai: "areaAi",
  reports: "areaReports",
  calendar: "areaCalendar",
  santuy: "areaSantuy",
  leave: "areaLeave",
  profile: "areaProfile",
  desktop: "areaDesktop",
  clients: "areaClients",
  processes: "areaProcesses",
  finance: "areaFinance",
  performance: "areaPerformance",
  team: "areaTeam",
  policies: "areaPolicies",
}

export const TAG: Record<
  WhatsNewTag,
  { label: Key; variant: "default" | "info" | "success" | "secondary" }
> = {
  new: { label: "tagNew", variant: "default" },
  improved: { label: "tagImproved", variant: "info" },
  fixed: { label: "tagFixed", variant: "success" },
  guide: { label: "tagGuide", variant: "secondary" },
}

/** Baru / Diperbarui / Perbaikan, then who it's for and where it shows. */
export function EntryBadges({
  entry,
  className,
}: {
  entry: WhatsNewEntry
  className?: string
}) {
  const t = useT("whatsNew")
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {!entry.published && <Badge variant="secondary">{t("draft")}</Badge>}
      {entry.tags.map((tag) => (
        <Badge key={tag} variant={TAG[tag].variant}>
          {t(TAG[tag].label)}
        </Badge>
      ))}
      <Badge variant="outline">{t(AREA_LABEL[entry.area])}</Badge>
      {entry.audience !== "everyone" && (
        <Badge variant="warning">
          {t(entry.audience === "pm" ? "audiencePm" : "audienceStakeholder")}
        </Badge>
      )}
      {entry.surface && entry.surface !== "app" && (
        <Badge variant="secondary">
          {t(entry.surface === "mac" ? "surfaceMac" : "surfaceClient")}
        </Badge>
      )}
    </div>
  )
}

/** "2026-11-02" as a local date (no UTC shift). */
export function dayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

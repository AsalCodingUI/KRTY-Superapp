"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { WhatsNewArea, WhatsNewEntry, WhatsNewTag } from "../model/types"
import { useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"

type Key = MessageKey<"whatsNew">
type BadgeVariant =
  | "default"
  | "info"
  | "success"
  | "secondary"
  | "outline"
  | "warning"

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

/**
 * Baru / Diperbarui / Perbaikan, then who it's for and where it shows.
 * `onPicture` sets each on a solid pill so it reads over a screenshot.
 */
export function EntryBadges({
  entry,
  onPicture = false,
  className,
}: {
  entry: WhatsNewEntry
  onPicture?: boolean
  className?: string
}) {
  const t = useT("whatsNew")
  const badges: { key: string; variant: BadgeVariant; label: string }[] = [
    ...(!entry.published
      ? [{ key: "draft", variant: "secondary" as const, label: t("draft") }]
      : []),
    ...entry.tags.map((tag) => ({
      key: tag,
      variant: TAG[tag].variant,
      label: t(TAG[tag].label),
    })),
    { key: "area", variant: "outline", label: t(AREA_LABEL[entry.area]) },
    ...(entry.audience !== "everyone"
      ? [
          {
            key: "audience",
            variant: "warning" as const,
            label: t(
              entry.audience === "pm" ? "audiencePm" : "audienceStakeholder",
            ),
          },
        ]
      : []),
    ...(entry.surface && entry.surface !== "app"
      ? [
          {
            key: "surface",
            variant: "secondary" as const,
            label: t(entry.surface === "mac" ? "surfaceMac" : "surfaceClient"),
          },
        ]
      : []),
  ]
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {badges.map(({ key, variant, label }) =>
        onPicture ? (
          <span
            key={key}
            className="bg-background rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.18)]"
          >
            <Badge
              variant={variant}
              className={cn(variant === "outline" && "border-transparent")}
            >
              {label}
            </Badge>
          </span>
        ) : (
          <Badge key={key} variant={variant}>
            {label}
          </Badge>
        ),
      )}
    </div>
  )
}

/** "2026-11-02" as a local date (no UTC shift). */
export function dayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

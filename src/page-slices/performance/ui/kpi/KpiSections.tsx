"use client"

import type {
  KpiAttention,
  KpiProject,
} from "@/app/(main)/performance/actions/kpi-actions"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import {
  RiArrowRightSLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiTimeLine,
} from "@/shared/ui/lucide-icons"
import Link from "next/link"

type T = ReturnType<typeof useT<"performance">>

export function SectionTitle({
  children,
  extra,
}: {
  children: React.ReactNode
  extra?: React.ReactNode
}) {
  return (
    <div className="flex items-baseline gap-2 pt-6 pb-3">
      <h2 className="text-foreground text-sm">{children}</h2>
      {extra && (
        <span className="text-tertiary-foreground text-[13px] tabular-nums">
          {extra}
        </span>
      )}
    </div>
  )
}

// --- Perlu tindakan (stakeholders) -----------------------------------------

function attentionText(a: KpiAttention, t: T) {
  switch (a.kind) {
    case "overdueMilestone":
      return t("kpiAttnOverdueMilestone", { phase: a.phase, n: a.days })
    case "noDueDate":
      return a.phases
        ? t("kpiAttnNoDueDate", { n: a.phases })
        : t("kpiAttnNoMilestones")
    case "qualityUnscored":
      return t("kpiAttnQualityUnscored")
    case "projectOverdue":
      return t("kpiAttnProjectOverdue", { n: a.days })
  }
}

/** Things a stakeholder should fix for these numbers to be right. */
export function AttentionList({
  items,
  projects,
  hrefFor,
  bare = false,
}: {
  items: KpiAttention[]
  projects: KpiProject[]
  /** The member's scoring page for a project. */
  hrefFor: (project: KpiProject) => string
  /** Without its own title (inside a card that has one). */
  bare?: boolean
}) {
  const t = useT("performance")
  if (items.length === 0) return null
  return (
    <section>
      {!bare && (
        <SectionTitle extra={items.length}>{t("kpiNeedsAction")}</SectionTitle>
      )}
      <GroupedList>
        {items.map((a, i) => {
          const project = projects.find((p) => p.projectId === a.projectId)
          // Quality is scored on the member's page; dates live on the project.
          const href =
            a.kind === "qualityUnscored" && project
              ? hrefFor(project)
              : `/projects/${a.projectId}`
          const Icon =
            a.kind === "qualityUnscored"
              ? RiCheckboxCircleLine
              : a.kind === "noDueDate"
                ? RiCalendarLine
                : RiTimeLine
          return (
            <ListRow key={`${a.kind}-${a.projectId}-${i}`} className="min-h-11">
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  a.kind === "overdueMilestone" || a.kind === "projectOverdue"
                    ? "text-amber-11"
                    : "text-muted-foreground",
                )}
              />
              <div className="flex min-w-0 flex-1 items-baseline gap-2 text-[13px]">
                <Link
                  href={href}
                  prefetch={false}
                  className="text-foreground truncate outline-none after:absolute after:inset-0 focus-visible:underline"
                >
                  {attentionText(a, t)}
                </Link>
                <span className="text-tertiary-foreground truncate">
                  {a.project}
                </span>
              </div>
              <span className="text-muted-foreground shrink-0 text-[13px] opacity-0 transition-opacity group-hover/row:opacity-100">
                {a.kind === "qualityUnscored"
                  ? t("kpiActionScore")
                  : t("kpiActionOpenProject")}
              </span>
              <RiArrowRightSLine className="text-muted-foreground size-4 shrink-0" />
            </ListRow>
          )
        })}
      </GroupedList>
    </section>
  )
}

// --- Menuju target (the member) --------------------------------------------

/** Open milestones of running projects, soonest first. */
export function upcomingMilestones(projects: KpiProject[]) {
  return projects
    .filter((p) => p.running && !p.excluded)
    .flatMap((p) =>
      p.milestones
        .filter(
          (m) =>
            m.due &&
            !m.done &&
            m.source !== "override" &&
            (m.state === "pending" || m.overdueDays > 0),
        )
        .map((m) => ({ project: p, milestone: m, due: m.due as string })),
    )
    .sort((a, b) => a.due.localeCompare(b.due))
}

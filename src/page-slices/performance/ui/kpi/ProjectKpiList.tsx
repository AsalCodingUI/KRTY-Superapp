"use client"

import { orEmpty } from "@/components/empty-value"
import type { KpiProject } from "@/app/(main)/performance/actions/kpi-actions"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { ProjectAvatar } from "@/components/project-avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatPercent } from "@/entities/performance/lib/kpi"
import { RiArrowRightSLine, RiFolderLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { ListColumns } from "../list"

const STATUS_ORDER = ["Active", "Completed", "Archived"]
const STATUS_LABELS: Record<string, string> = {
  Active: "Aktif",
  Completed: "Selesai",
  Archived: "Diarsipkan",
}

/** Shared column template so the header and rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_4.5rem_1rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_9rem_6rem_4.5rem_4.5rem_1rem]"

function Score({ value }: { value: number | null }) {
  return (
    <span className="text-foreground text-right tabular-nums">
      {orEmpty(formatPercent(value))}
    </span>
  )
}

/** The person's projects in scope, active first, each linking to its scores. */
export function ProjectKpiList({
  projects,
  hrefFor,
  showQuarter,
}: {
  projects: KpiProject[]
  hrefFor: (project: KpiProject) => string
  showQuarter: boolean
}) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="Belum ada project"
        description="Belum ada project di periode ini."
        icon={<RiFolderLine className="size-5" />}
        placement="inner"
      />
    )
  }

  const rank = (status: string) => {
    const i = STATUS_ORDER.indexOf(status)
    return i === -1 ? STATUS_ORDER.length : i
  }
  const sorted = [...projects].sort((a, b) => rank(a.status) - rank(b.status))

  return (
    <GroupedList>
      <ListColumns grid={ROW_GRID}>
        <span>Project</span>
        <span className="hidden md:block">Peran</span>
        <span className="hidden md:block">Status</span>
        <span className="hidden text-right md:block">SLA</span>
        <span className="text-right">Kualitas</span>
        <span />
      </ListColumns>
      {sorted.map((project) => {
        const meta = [
          project.isLead && "Lead",
          showQuarter && project.quarter,
        ].filter(Boolean)
        return (
          <ListRow
            key={project.assignmentId}
            className={cn(ROW_GRID, "min-h-14")}
          >
            <div className="flex min-w-0 items-center gap-3">
              <ProjectAvatar
                id={project.projectId}
                name={project.name}
                className="size-7 rounded-md text-[11px]"
              />
              <div className="flex min-w-0 flex-col">
                <Link
                  href={hrefFor(project)}
                  prefetch={false}
                  className="text-foreground truncate outline-none after:absolute after:inset-0 focus-visible:underline"
                >
                  {project.name}
                </Link>
                {meta.length > 0 && (
                  <span className="text-tertiary-foreground truncate text-[13px]">
                    {meta.join(" · ")}
                  </span>
                )}
              </div>
            </div>
            <div className="hidden min-w-0 md:block">
              <Badge variant="secondary" className="max-w-full">
                <span className="truncate">{project.role}</span>
              </Badge>
            </div>
            <div className="hidden md:block">
              <Badge
                variant={project.status === "Active" ? "success" : "secondary"}
              >
                {STATUS_LABELS[project.status] ?? project.status}
              </Badge>
            </div>
            <span className="hidden text-right md:block">
              <Score value={project.sla} />
            </span>
            <Score value={project.quality} />
            <RiArrowRightSLine className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100" />
          </ListRow>
        )
      })}
    </GroupedList>
  )
}

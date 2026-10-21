"use client"

import type { KpiProject } from "@/app/(main)/performance/actions/kpi-actions"
import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListChip,
  ListGroup,
  ListRow,
} from "@/components/grouped-list"
import { formatPercent } from "@/entities/performance/lib/kpi"
import { RiArrowRightSLine, RiFolderLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"

const STATUS_GROUPS = [
  { status: "Active", label: "Aktif" },
  { status: "Completed", label: "Selesai" },
  { status: "Archived", label: "Diarsipkan" },
]

function Score({ label, value }: { label: string; value: number | null }) {
  return (
    <span className="flex w-28 shrink-0 items-baseline justify-end gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      {value === null ? (
        <span className="text-muted-foreground/60">belum</span>
      ) : (
        <span className="font-medium tabular-nums">{formatPercent(value)}</span>
      )}
    </span>
  )
}

/** The person's projects in scope, grouped by status, each linking to its scores. */
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

  return (
    <GroupedList>
      {STATUS_GROUPS.map(({ status, label }) => {
        const items = projects.filter((p) => p.status === status)
        if (items.length === 0) return null
        return (
          <ListGroup
            key={status}
            label={label}
            count={items.length}
            defaultOpen={status !== "Archived"}
          >
            {items.map((project) => (
              <ListRow key={project.assignmentId} className="relative">
                <Link
                  href={hrefFor(project)}
                  prefetch={false}
                  className="min-w-0 flex-1 truncate font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                >
                  {project.name}
                </Link>
                {project.isLead && <ListChip>Lead</ListChip>}
                <ListChip>{project.role}</ListChip>
                {showQuarter && project.quarter && (
                  <ListChip>{project.quarter}</ListChip>
                )}
                <Score label="SLA" value={project.sla} />
                <Score label="Kualitas" value={project.quality} />
                <RiArrowRightSLine className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100" />
              </ListRow>
            ))}
          </ListGroup>
        )
      })}
    </GroupedList>
  )
}

"use client"

import { useProjectSummary } from "@/shared/hooks/useProjectSummary"
import { getProjectAssessment } from "@/app/(main)/performance/actions/kpi-actions"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { formatPercent } from "@/entities/performance/lib/kpi"
import { cn } from "@/lib/utils"
import {
  ProjectKpiSheet,
  projectSheetHref,
} from "@/page-slices/performance/ui/kpi/ProjectKpiSheet"
import { periodLabel } from "@/page-slices/performance/ui/kpi/period"
import {
  ListColumns,
  PersonCell,
  StatBand,
} from "@/page-slices/performance/ui/list"
import { useT } from "@/shared/i18n/client"
import { RiArrowRightSLine, RiGroupLine } from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"

/** Shared column template so the header and member rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_1rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_10rem_5rem_5rem_1rem]"

function Score({ value }: { value: number | null }) {
  const t = useT("performance")
  return (
    <span className="flex justify-end">
      {value === null ? (
        <Badge variant="warning">{t("notYet")}</Badge>
      ) : (
        <span className="text-foreground tabular-nums">
          {formatPercent(value)}
        </span>
      )}
    </span>
  )
}

/**
 * "Penilaian": the project's members and their SLA / work-quality scores in
 * the project's quarter, for its lead (and stakeholders). A row opens the
 * scoring sheet. Replaces the lead's "Tim saya" tab under Kinerja.
 */
export function ProjectAssessment({ projectId }: { projectId: string }) {
  const t = useT("performance")
  const tp = useT("projects")
  const pathname = usePathname()
  const { data: summary } = useProjectSummary(projectId)
  const { data, isLoading } = useQuery({
    queryKey: ["project-assessment", projectId],
    queryFn: () => getProjectAssessment(projectId),
  })

  const project = data?.success ? data.data : null
  const members = project?.members ?? []
  const quarter = project?.quarter ?? null

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={
          <span className="flex items-center gap-2">
            {tp("sectionAssessment")}
            {quarter && (
              <Badge variant="secondary">{periodLabel(quarter, t)}</Badge>
            )}
          </span>
        }
      />
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-6" />
        </div>
      ) : data && !data.success ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          {data.error}
        </p>
      ) : members.length === 0 ? (
        <EmptyState
          title={t("noOtherMembers")}
          icon={<RiGroupLine className="size-5" />}
          placement="inner"
        />
      ) : (
        <>
          <StatBand
            stats={[
              { label: t("member"), value: members.length },
              {
                label: tp("assessmentSlaPending"),
                value: members.filter((m) => m.sla === null).length,
              },
              {
                label: tp("assessmentQualityPending"),
                value: members.filter((m) => m.quality === null).length,
              },
            ]}
          />
          <GroupedList>
            <ListColumns grid={ROW_GRID}>
              <span>{t("member")}</span>
              <span className="hidden md:block">{t("role")}</span>
              <span className="text-right">{t("sla")}</span>
              <span className="text-right">{t("quality")}</span>
              <span />
            </ListColumns>
            {members.map((m) => (
              <ListRow
                key={m.assignmentId}
                className={cn(ROW_GRID, "min-h-14")}
              >
                <PersonCell name={m.full_name} avatarUrl={m.avatar_url}>
                  <Link
                    href={projectSheetHref(
                      pathname,
                      {},
                      { id: projectId, name: summary?.name },
                      m,
                    )}
                    prefetch={false}
                    scroll={false}
                    className="text-foreground truncate outline-none after:absolute after:inset-0 focus-visible:underline"
                  >
                    {m.full_name}
                  </Link>
                </PersonCell>
                <div className="hidden min-w-0 md:block">
                  <Badge variant="secondary" className="max-w-full">
                    <span className="truncate">{m.role}</span>
                  </Badge>
                </div>
                <Score value={m.sla} />
                <Score value={m.quality} />
                <RiArrowRightSLine className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100" />
              </ListRow>
            ))}
          </GroupedList>
        </>
      )}
      <ProjectKpiSheet />
    </div>
  )
}

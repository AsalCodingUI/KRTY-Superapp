"use client"

import { getLeadTeam } from "@/app/(main)/performance/actions/kpi-actions"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { formatPercent } from "@/entities/performance/lib/kpi"
import { useT } from "@/shared/i18n/client"
import { RiArrowRightSLine, RiGroupLine } from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { GridGroup, ListColumns, PersonCell } from "../list"

/** Shared column template so the header, project rows and members line up. */
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

/** "3 belum" for a project header, or nothing when all are scored. */
function Pending({ count }: { count: number }) {
  const t = useT("performance")
  return (
    <span className="text-tertiary-foreground text-right text-[13px] tabular-nums">
      {count > 0 ? t("pendingCount", { n: count }) : ""}
    </span>
  )
}

/** "Tim saya": projects the user leads, members to score on each. */
export function LeadTeam({ period }: { period: string }) {
  const t = useT("performance")
  const { data, isLoading } = useQuery({
    queryKey: ["lead-team", period],
    queryFn: () => getLeadTeam(period),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }
  if (!data?.success) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        {data?.error ?? t("teamLoadFailed")}
      </p>
    )
  }
  if (data.data.length === 0) {
    return (
      <EmptyState
        title={t("noLedProjects")}
        description={t("noLedProjectsDescription")}
        icon={<RiGroupLine className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <GroupedList>
      <ListColumns grid={ROW_GRID}>
        <span>{t("member")}</span>
        <span className="hidden md:block">{t("role")}</span>
        <span className="text-right">{t("sla")}</span>
        <span className="text-right">{t("quality")}</span>
        <span />
      </ListColumns>
      {data.data.map((project) => (
        <GridGroup
          key={project.projectId}
          grid={ROW_GRID}
          label={project.name}
          extra={
            project.quarter ? (
              <Badge variant="secondary">{project.quarter}</Badge>
            ) : undefined
          }
          summary={
            <>
              <span className="text-tertiary-foreground hidden text-[13px] tabular-nums md:block">
                {t("memberCount", { n: project.members.length })}
              </span>
              <Pending
                count={project.members.filter((m) => m.sla === null).length}
              />
              <Pending
                count={project.members.filter((m) => m.quality === null).length}
              />
              <span />
            </>
          }
        >
          {project.members.length === 0 ? (
            <ListRow className="text-muted-foreground">
              {t("noOtherMembers")}
            </ListRow>
          ) : (
            project.members.map((m) => (
              <ListRow
                key={m.assignmentId}
                className={cn(ROW_GRID, "min-h-14")}
              >
                <PersonCell name={m.full_name} avatarUrl={m.avatar_url}>
                  <Link
                    href={`/performance/employee/${m.id}/project/${project.projectId}?dari=tim&periode=${encodeURIComponent(period)}`}
                    prefetch={false}
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
            ))
          )}
        </GridGroup>
      ))}
    </GroupedList>
  )
}

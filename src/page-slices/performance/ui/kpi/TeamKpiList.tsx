"use client"

import { EmptyValue, orEmpty } from "@/components/empty-value"
import {
  getTeamKpi,
  type TeamKpiRow,
} from "@/app/(main)/performance/actions/kpi-actions"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import type { ViewMode } from "@/components/view-toggle"
import { cn } from "@/lib/utils"
import { formatPercent, ratingFor } from "@/entities/performance/lib/kpi"
import { useT } from "@/shared/i18n/client"
import { RiArrowRightSLine, RiGroupLine } from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { ListColumns, PersonCell, StatBand } from "../list"
import { RatingChip } from "./RatingChip"

/** Shared column template so the header and rows line up. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_3.5rem_1rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_4.5rem_3.5rem_9rem_1rem] lg:grid-cols-[minmax(0,1fr)_10rem_4.5rem_4.5rem_4.5rem_3.5rem_9rem_1rem]"

const projectsLabel = (
  row: TeamKpiRow,
  t: ReturnType<typeof useT<"performance">>,
) =>
  row.projectCount
    ? t("projectCount", { n: row.projectCount })
    : t("noProjects")

function Part({
  value,
  className,
}: {
  value: number | null
  className?: string
}) {
  return (
    <span
      className={cn(
        "text-right tabular-nums",
        value === null ? "text-tertiary-foreground" : "text-foreground",
        className,
      )}
    >
      {orEmpty(formatPercent(value))}
    </span>
  )
}

/** Everyone's KPI for the period, best first (list) or as a table. */
export function TeamKpiList({
  scope,
  view,
}: {
  scope: string
  view: ViewMode
}) {
  const t = useT("performance")
  const { data, isLoading } = useQuery({
    queryKey: ["kpi-team", scope],
    queryFn: () => getTeamKpi(scope),
    staleTime: 30_000,
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
        {data?.error ?? t("teamKpiLoadFailed")}
      </p>
    )
  }
  const rows = data.data
  if (rows.length === 0) {
    return (
      <EmptyState
        title={t("noMembers")}
        description={t("noMembersDescription")}
        icon={<RiGroupLine className="size-5" />}
        placement="inner"
      />
    )
  }

  const href = (row: TeamKpiRow) =>
    `/performance/employee/${row.id}?periode=${encodeURIComponent(scope)}`

  const scored = rows.filter((r) => r.final.score !== null)
  const stats = (
    <StatBand
      stats={[
        { label: t("member"), value: rows.length },
        {
          label: t("averageFinalScore"),
          value: scored.length ? (
            Math.round(
              scored.reduce((sum, r) => sum + (r.final.score ?? 0), 0) /
                scored.length,
            )
          ) : (
            <EmptyValue />
          ),
        },
        {
          label: t("ratingBelow"),
          value: scored.filter((r) =>
            ["warning", "destructive"].includes(
              ratingFor(r.final.score)?.tone ?? "",
            ),
          ).length,
        },
        { label: t("noData"), value: rows.length - scored.length },
      ]}
    />
  )

  if (view === "table") {
    const columns: ColumnDef<TeamKpiRow>[] = [
      {
        accessorKey: "full_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("member")} />
        ),
        cell: ({ row }) => (
          <PersonCell
            name={row.original.full_name}
            avatarUrl={row.original.avatar_url}
            secondary={projectsLabel(row.original, t)}
          >
            <Link
              href={href(row.original)}
              prefetch={false}
              className="text-foreground truncate hover:underline"
            >
              {row.original.full_name}
            </Link>
          </PersonCell>
        ),
      },
      ...(
        [
          ["sla", "sla"],
          ["review", "review360Short"],
          ["quality", "quality"],
        ] as const
      ).map(
        ([key, title]): ColumnDef<TeamKpiRow> => ({
          id: key,
          accessorFn: (r) => r.parts[key] ?? -1,
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t(title)} />
          ),
          cell: ({ row }) => (
            <span className="tabular-nums">
              {orEmpty(formatPercent(row.original.parts[key]))}
            </span>
          ),
        }),
      ),
      {
        id: "final",
        accessorFn: (r) => r.final.score ?? -1,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("finalScore")} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="tabular-nums">
              {row.original.final.score === null ? (
                <EmptyValue />
              ) : (
                Math.round(row.original.final.score)
              )}
            </span>
            <RatingChip score={row.original.final.score} />
          </div>
        ),
      },
    ]
    return (
      <>
        {stats}
        <DataTable
          data={rows}
          columns={columns}
          showExport={false}
          showViewOptions={false}
          showFilterbar={false}
          enableSelection={false}
          showTableWrapper={false}
        />
      </>
    )
  }

  const sorted = [...rows].sort(
    (a, b) => (b.final.score ?? -1) - (a.final.score ?? -1),
  )

  return (
    <>
      {stats}
      <GroupedList>
        <ListColumns grid={ROW_GRID}>
          <span>{t("member")}</span>
          <span className="hidden lg:block">{t("jobTitle")}</span>
          <span className="hidden text-right md:block">{t("sla")}</span>
          <span className="hidden text-right md:block">
            {t("review360Short")}
          </span>
          <span className="hidden text-right md:block">{t("quality")}</span>
          <span className="text-right">{t("score")}</span>
          <span className="hidden md:block">{t("rating")}</span>
          <span />
        </ListColumns>
        {sorted.map((row) => (
          <ListRow key={row.id} className={cn(ROW_GRID, "min-h-14")}>
            <PersonCell
              name={row.full_name}
              avatarUrl={row.avatar_url}
              secondary={projectsLabel(row, t)}
            >
              <Link
                href={href(row)}
                prefetch={false}
                className="text-foreground truncate outline-none after:absolute after:inset-0 focus-visible:underline"
                aria-label={t("kpiOf", { name: row.full_name ?? "" })}
              >
                {row.full_name}
              </Link>
            </PersonCell>
            <div className="hidden min-w-0 lg:block">
              {row.job_title && (
                <Badge variant="secondary" className="max-w-full">
                  <span className="truncate">{row.job_title}</span>
                </Badge>
              )}
            </div>
            <Part value={row.parts.sla} className="hidden md:block" />
            <Part value={row.parts.review} className="hidden md:block" />
            <Part value={row.parts.quality} className="hidden md:block" />
            <span className="text-foreground text-right tabular-nums">
              {row.final.score === null ? (
                <EmptyValue />
              ) : (
                Math.round(row.final.score)
              )}
            </span>
            <div className="hidden md:block">
              <RatingChip score={row.final.score} />
            </div>
            <RiArrowRightSLine className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100" />
          </ListRow>
        ))}
      </GroupedList>
    </>
  )
}

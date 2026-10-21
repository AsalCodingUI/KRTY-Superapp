"use client"

import {
  getTeamKpi,
  type TeamKpiRow,
} from "@/app/(main)/performance/actions/kpi-actions"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListGroup, ListRow } from "@/components/grouped-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"
import type { ViewMode } from "@/components/view-toggle"
import {
  formatPercent,
  RATINGS,
  ratingFor,
} from "@/entities/performance/lib/kpi"
import { RiArrowRightSLine, RiGroupLine } from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { RatingChip } from "./RatingChip"

function initials(name: string | null) {
  return (name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function Person({ row }: { row: TeamKpiRow }) {
  return (
    <>
      <Avatar className="size-5">
        <AvatarImage src={row.avatar_url || undefined} alt="" />
        <AvatarFallback className="text-[10px]">
          {initials(row.full_name)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate font-medium">{row.full_name}</span>
      {row.job_title && (
        <span className="text-muted-foreground truncate">{row.job_title}</span>
      )}
    </>
  )
}

function Part({ label, value }: { label: string; value: number | null }) {
  return (
    <span className="hidden w-24 shrink-0 items-baseline justify-end gap-1.5 text-xs md:flex">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          value === null
            ? "text-muted-foreground/60"
            : "font-medium tabular-nums"
        }
      >
        {formatPercent(value)}
      </span>
    </span>
  )
}

const NO_DATA = "Belum ada data"

/** Everyone's KPI for the period, grouped by rating (list) or as a table. */
export function TeamKpiList({
  scope,
  view,
}: {
  scope: string
  view: ViewMode
}) {
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
        {data?.error ?? "Gagal memuat KPI tim."}
      </p>
    )
  }
  const rows = data.data
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Belum ada anggota"
        description="Anggota tim akan muncul di sini."
        icon={<RiGroupLine className="size-5" />}
        placement="inner"
      />
    )
  }

  const href = (row: TeamKpiRow) =>
    `/performance/employee/${row.id}?periode=${encodeURIComponent(scope)}`

  if (view === "table") {
    const columns: ColumnDef<TeamKpiRow>[] = [
      {
        accessorKey: "full_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Anggota" />
        ),
        cell: ({ row }) => (
          <Link
            href={href(row.original)}
            prefetch={false}
            className="flex items-center gap-2 hover:underline"
          >
            <Person row={row.original} />
          </Link>
        ),
      },
      ...(
        [
          ["sla", "SLA"],
          ["review", "360"],
          ["quality", "Kualitas"],
        ] as const
      ).map(
        ([key, title]): ColumnDef<TeamKpiRow> => ({
          id: key,
          accessorFn: (r) => r.parts[key] ?? -1,
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={title} />
          ),
          cell: ({ row }) => (
            <span className="tabular-nums">
              {formatPercent(row.original.parts[key])}
            </span>
          ),
        }),
      ),
      {
        id: "final",
        accessorFn: (r) => r.final.score ?? -1,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nilai akhir" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium tabular-nums">
              {row.original.final.score === null
                ? "—"
                : Math.round(row.original.final.score)}
            </span>
            <RatingChip score={row.original.final.score} />
          </div>
        ),
      },
    ]
    return (
      <DataTable
        data={rows}
        columns={columns}
        showExport={false}
        showViewOptions={false}
        showFilterbar={false}
        enableSelection={false}
        showTableWrapper={false}
      />
    )
  }

  const groups = [...RATINGS.map((r) => r.label), NO_DATA].map((label) => ({
    label,
    items: rows
      .filter((r) => (ratingFor(r.final.score)?.label ?? NO_DATA) === label)
      .sort((a, b) => (b.final.score ?? 0) - (a.final.score ?? 0)),
  }))

  return (
    <GroupedList>
      {groups.map(({ label, items }) =>
        items.length === 0 ? null : (
          <ListGroup key={label} label={label} count={items.length}>
            {items.map((row) => (
              <ListRow key={row.id} className="relative">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Person row={row} />
                </div>
                <Part label="SLA" value={row.parts.sla} />
                <Part label="360" value={row.parts.review} />
                <Part label="Kualitas" value={row.parts.quality} />
                <Link
                  href={href(row)}
                  prefetch={false}
                  className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums outline-none after:absolute after:inset-0"
                  aria-label={`KPI ${row.full_name}`}
                >
                  {row.final.score === null ? "—" : Math.round(row.final.score)}
                </Link>
                <RiArrowRightSLine className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100" />
              </ListRow>
            ))}
          </ListGroup>
        ),
      )}
    </GroupedList>
  )
}

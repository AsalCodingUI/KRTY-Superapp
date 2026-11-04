"use client"

import { createTeamColumns } from "@/app/(main)/teams/Columns"
import { HomeCard, HomeRow } from "@/app/(main)/dashboard/components/home-card"
import { DataTable } from "@/components/data-table"
import { Markdown } from "@/components/markdown"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { adminColumns } from "@/page-slices/leave/ui/components/AdminColumns"
import { EmployeeLeaveList } from "@/page-slices/leave/ui/components/EmployeeLeaveList"
import { RemainingLeaveList } from "@/page-slices/leave/ui/components/RemainingLeaveList"
import { ProjectList } from "@/page-slices/projects/ui/ProjectList"
import { useDateLocale, useT } from "@/shared/i18n/client"
import type { ColumnDef } from "@tanstack/react-table"
import type { ReactNode } from "react"
import * as mock from "../model/mock"

/** The one table style, as it's built into components/grouped-list.tsx
 *  (listRowClassName, listHeaderClassName, listGroupHeaderClassName). */
const RULES: [string, string][] = [
  [
    "Tinggi baris",
    "Cuma 2: biasa 48px (min-h-12), ada deskripsi di bawah judul 56px (min-h-14, ListRow desc)",
  ],
  ["Baris", "py-2 · text-sm · sisi kiri/kanan = gutter halaman"],
  ["Jarak kolom", "gap-x-4 (16px); checkbox ke kolom sebelahnya 24px"],
  ["Jarak vertikal", "Header ke baris pertama = antar baris = 4px"],
  ["Garis", "Nggak ada garis antar baris maupun di bawah header kolom"],
  [
    "Rata",
    "Kolom rata kiri (header ikut isinya); cuma kolom terakhir yang rata kanan. Skor yang dibandingin boleh rata kanan",
  ],
  [
    "Hover / pilih",
    "Satu highlight yang meluncur antar baris (--row-hover), terpilih --row-selected",
  ],
  [
    "Header kolom",
    "Pill yang sama kayak header grup: h-10 · bg-muted · rounded-lg · text-[13px] muted · tanpa garis",
  ],
  [
    "Grup",
    "Header pill: h-10 · bg-muted · rounded-lg · jarak antar grup 4px; ringkasan grup ikut kolom baris",
  ],
  [
    "Status",
    "Pakai Badge (success / warning / info / secondary / destructive)",
  ],
  [
    "Tabel dokumen",
    "Markdown: label di pita muted, baris di kartu rounded, tanpa garis",
  ],
]

/**
 * /table: the app's table style, its rules, and every kind of table that
 * uses it, on mock data. Each one is the real component (rows passed in);
 * the file it lives in is named under its title.
 */
export function TableAuditPage() {
  const tTeams = useT("teams")
  const tLeave = useT("leave")
  const dateLocale = useDateLocale()
  const noop = () => {}

  return (
    <div className="flex flex-col gap-14 pb-16">
      <div className="flex flex-col gap-3 pt-6">
        <PageHeader title="Audit tabel" />
        <p className="text-muted-foreground max-w-2xl text-sm">
          Satu gaya tabel buat semua halaman, diatur terpusat di{" "}
          <code className="font-mono text-xs">components/grouped-list.tsx</code>
          . Semua contoh di bawah pakai komponen aslinya dengan data dummy.
        </p>
      </div>

      <Group title="Aturan">
        <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
          <dl className="bg-background flex flex-col rounded-lg py-1">
            {RULES.map(([label, rule]) => (
              <div
                key={label}
                className="gutter-x flex min-h-11 flex-col justify-center gap-0.5 py-2 text-sm sm:flex-row sm:items-center sm:gap-4"
              >
                <dt className="text-muted-foreground w-36 shrink-0 text-[13px]">
                  {label}
                </dt>
                <dd>{rule}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Group>

      <Group title="Daftar dengan header kolom">
        <Variant
          title="Pengajuan cuti saya"
          source="page-slices/leave/ui/components/EmployeeLeaveList.tsx"
        >
          <EmployeeLeaveList
            requests={mock.myLeave}
            onEdit={noop}
            onCancel={noop}
            page={0}
            pageCount={1}
            onPageChange={noop}
          />
        </Variant>
        <Variant
          title="Saldo cuti"
          source="page-slices/leave/ui/components/RemainingLeaveList.tsx"
        >
          <RemainingLeaveList data={mock.leaveBalances} />
        </Variant>
      </Group>

      <Group title="Daftar dengan grup">
        <Variant
          title="Daftar project (patokan)"
          source="page-slices/projects/ui/ProjectList.tsx"
        >
          <ProjectList projects={mock.projects} />
        </Variant>
      </Group>

      <Group title="DataTable (sort, pilih banyak)">
        <Variant
          title="Tim"
          source="page-slices/teams/ui/TeamsPage.tsx · app/(main)/teams/Columns.tsx"
        >
          <DataTable
            data={mock.teamMembers}
            columns={
              createTeamColumns({ canSelect: false, t: tTeams }) as ColumnDef<
                (typeof mock.teamMembers)[number]
              >[]
            }
            showFilterbar={false}
            enableSelection={false}
          />
        </Variant>
        <Variant
          title="Approval cuti"
          source="page-slices/leave/ui/StakeholderLeavePage.tsx · components/AdminColumns.tsx"
        >
          <DataTable
            data={mock.leaveApprovals}
            columns={
              adminColumns(noop, noop, {
                canSelect: true,
                canManage: true,
                t: tLeave,
                dateLocale,
              }) as ColumnDef<(typeof mock.leaveApprovals)[number]>[]
            }
            showFilterbar={false}
            onBulkApprove={async () => {}}
            onBulkReject={async () => {}}
          />
        </Variant>
      </Group>

      <Group title="Baris di kartu">
        <Variant
          title="Langganan"
          source="page-slices/finance/ui/SubscriptionsTab.tsx · dashboard/components/home-card.tsx"
        >
          <div className="max-w-md">
            <HomeCard title="Langganan">
              <div className="flex flex-col">
                {mock.subscriptions.map((s) => (
                  <HomeRow
                    key={s.name}
                    title={s.name}
                    subtitle={s.cycle}
                    trailing={
                      <span className="text-sm tabular-nums">{s.amount}</span>
                    }
                  />
                ))}
              </div>
            </HomeCard>
          </div>
        </Variant>
      </Group>

      <Group title="Tabel dokumen">
        <Variant title="Markdown" source="components/markdown.tsx">
          <Markdown>{mock.markdownTable}</Markdown>
        </Variant>
        <Variant
          title="Pratinjau spreadsheet"
          source="components/office-view.tsx (gaya grid Excel)"
        >
          <SheetPreview />
        </Variant>
      </Group>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-8">
      <h2 className="text-heading text-lg font-medium tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Variant({
  title,
  source,
  children,
}: {
  title: string
  source: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{title}</h3>
          <Badge variant="secondary">Asli</Badge>
        </div>
        <code className="text-muted-foreground font-mono text-xs">
          {source}
        </code>
      </div>
      {children}
    </div>
  )
}

/** OfficeView's sheet markup (it loads a file, so not importable here). */
function SheetPreview() {
  const [head, ...rows] = mock.sheet
  return (
    <div className="bg-background border-border max-h-64 overflow-auto rounded-lg border">
      <table className="min-w-full border-separate border-spacing-0 text-xs tabular-nums [&_tbody_tr:last-child>td]:border-b-0">
        <thead className="bg-muted-solid text-muted-foreground sticky top-0 z-10">
          <tr>
            <th className="bg-muted-solid sticky left-0 z-10 w-10 border-r border-b" />
            {head.map((_, i) => (
              <th
                key={i}
                className="min-w-24 border-r border-b px-2 py-1 text-left font-medium"
              >
                {String.fromCharCode(65 + i)}
              </th>
            ))}
            <th aria-hidden className="w-full border-b" />
          </tr>
        </thead>
        <tbody>
          {[head, ...rows].map((row, r) => (
            <tr key={r}>
              <td className="bg-muted-solid text-muted-foreground sticky left-0 border-r border-b px-2 py-1 text-right">
                {r + 1}
              </td>
              {row.map((cell, c) => (
                <td
                  key={c}
                  className="max-w-80 truncate border-r border-b px-2 py-1"
                >
                  {cell}
                </td>
              ))}
              <td aria-hidden className="border-b" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

"use client"

import {
  ListChip,
  ListGroup,
  GroupedList,
  ListRow,
} from "@/components/grouped-list"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/page-slices/contracts/ui/parts"
import { InboxCount } from "@/page-slices/leave/ui/components/ApprovalInbox"
import { RatingChip } from "@/page-slices/performance/ui/kpi/RatingChip"
import { CycleStatusBadge } from "@/page-slices/performance/ui/review/cycle-status"
import { ProjectStatusIcon } from "@/page-slices/projects/ui/ProjectStatusIcon"
import { Button } from "@/components/ui/button"
import { RiCheckLine, RiLockLine, RiTimeLine } from "@/shared/ui/lucide-icons"
import type { ReactNode } from "react"
import {
  DocCanvas,
  DocDont,
  DocExample,
  DocGroup,
  DocIntro,
  DocRules,
} from "./doc-blocks"
import * as mock from "../model/badge-mock"

const VARIANTS = [
  ["success", "Selesai, disetujui, bagus"],
  ["warning", "Menunggu, perlu dicek, sebagian"],
  ["destructive", "Ditolak, terlambat, gagal"],
  ["info", "Terjadwal, terkirim, hari ini"],
  ["secondary", "Netral: draft, selesai, label biasa"],
  ["outline", "Belum mulai (draft kontrak)"],
  ["default", "Aksen brand, jarang (Lead, Baru)"],
] as const

const RULES: [string, string][] = [
  [
    "Badge",
    "Status / keadaan. Satu ukuran: h-5 · px-1.5 · text-xs · pill. Warna cuma dari variant",
  ],
  [
    "ListChip",
    "Fakta di baris (jenis, tanggal, mata uang): abu-abu, rounded-md, h-6, text-[13px]",
  ],
  [
    "Peta status",
    "Satu peta status → variant per domain, di satu file (STATUS_VARIANT / <XStatusBadge>)",
  ],
  [
    "Project / task",
    "Bukan badge: glyph ProjectStatusIcon (task lewat StatusDot)",
  ],
  [
    "Angka",
    "Di sebelah label: text-tertiary-foreground tabular-nums ml-1.5, hilang kalau 0",
  ],
  [
    "Belum dibaca",
    "Titik bg-primary size-2 (size-1.5 di ikon / label tab), aria-hidden",
  ],
  ["Sidebar", "NavBadge: pill bg-foreground/[0.08] h-5 min-w-5, 99+"],
]

/** /ui → Badge: variants, each domain's status map, chips and counts. */
export function BadgeTab() {
  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="badge.md">
        Badge buat status, ListChip buat info di baris, plus angka dan titik
        notifikasi.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Varian"
        note="Dipakai di app: secondary 32 · lewat peta 28 · warning 11 · success 9 · info 6 · destructive 4 · default 3."
      >
        <DocExample
          title="Semua varian status"
          source="components/ui/badge.tsx"
        >
          <div className="border-border flex flex-col rounded-xl border border-dashed p-5">
            {VARIANTS.map(([variant, use]) => (
              <div
                key={variant}
                className="flex min-h-10 items-center gap-4 text-sm"
              >
                <code className="w-28 shrink-0 font-mono text-xs">
                  {variant}
                </code>
                <span className="w-24 shrink-0">
                  <Badge variant={variant}>{variant}</Badge>
                </span>
                <span className="text-muted-foreground text-[13px]">{use}</span>
              </div>
            ))}
          </div>
        </DocExample>
        <DocExample
          title="Dengan ikon"
          source='data-icon="inline-start" (ikon size-3)'
        >
          <DocCanvas>
            <Badge variant="success">
              <RiCheckLine data-icon="inline-start" />
              Disetujui
            </Badge>
            <Badge variant="warning">
              <RiTimeLine data-icon="inline-start" />
              Menunggu
            </Badge>
            <Badge variant="secondary">
              <RiLockLine data-icon="inline-start" />
              Internal
            </Badge>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Status per domain">
        {mock.domains.map((d) => (
          <DocExample
            key={d.title}
            title={d.title}
            source={d.source}
            kind="spec"
          >
            <DocCanvas>
              {d.items.map(([label, variant]) => (
                <Badge key={label} variant={variant}>
                  {label}
                </Badge>
              ))}
            </DocCanvas>
          </DocExample>
        ))}
        <DocExample
          title="Kontrak"
          source="page-slices/contracts/ui/parts.tsx (StatusBadge)"
        >
          <DocCanvas>
            {["draft", "sent", "acknowledged"].map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Rating KPI"
          source="page-slices/performance/ui/kpi/RatingChip.tsx"
        >
          <DocCanvas>
            {[98, 88, 80, 65, 40].map((score) => (
              <RatingChip key={score} score={score} />
            ))}
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Siklus 360"
          source="page-slices/performance/ui/review/cycle-status.tsx"
        >
          <DocCanvas>
            {(["scheduled", "running", "ended", "closed"] as const).map((s) => (
              <CycleStatusBadge key={s} status={s} />
            ))}
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Project dan task: glyph, bukan badge"
          source="page-slices/projects/ui/ProjectStatusIcon.tsx · TaskBoard.tsx (StatusDot)"
        >
          <DocCanvas className="gap-6">
            {mock.projectStatuses.map(([status, label, task]) => (
              <span key={status} className="flex items-center gap-2 text-sm">
                <ProjectStatusIcon status={status} />
                {label}
                {task && (
                  <code className="text-tertiary-foreground font-mono text-xs">
                    task: {task}
                  </code>
                )}
              </span>
            ))}
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup
        title="Badge vs ListChip"
        note="Kalau warnanya bakal berubah waktu datanya jalan, itu Badge. Kalau cuma fakta, ListChip."
      >
        <DocExample
          title="Di satu baris"
          source="components/grouped-list.tsx (ListChip) · ui/badge.tsx"
        >
          <GroupedList>
            {mock.leaveRows.map((r) => (
              <ListRow
                key={r.id}
                className="grid grid-cols-[minmax(0,1fr)_auto_6.5rem] items-center gap-x-4"
              >
                <span className="truncate">{r.reason}</span>
                <ListChip>{r.range}</ListChip>
                <Badge variant={mock.LEAVE_VARIANT[r.status]}>{r.label}</Badge>
              </ListRow>
            ))}
          </GroupedList>
        </DocExample>
      </DocGroup>

      <DocGroup title="Angka dan titik">
        <DocExample
          title="Angka di header grup"
          source="components/grouped-list.tsx (ListGroup count)"
        >
          <GroupedList>
            <ListGroup label="Menunggu" count={2}>
              {mock.leaveRows
                .filter((r) => r.status === "pending")
                .map((r) => (
                  <ListRow key={r.id}>{r.reason}</ListRow>
                ))}
            </ListGroup>
          </GroupedList>
        </DocExample>
        <DocExample
          title="Angka di label tab"
          source="page-slices/policies/ui/PoliciesPage.tsx"
          kind="spec"
        >
          <DocCanvas className="gap-7 text-sm font-medium">
            <span>
              Berlaku
              <span className="text-tertiary-foreground ml-1.5 tabular-nums">
                12
              </span>
            </span>
            <span className="text-muted-foreground">
              Draft
              <span className="text-tertiary-foreground ml-1.5 tabular-nums">
                3
              </span>
            </span>
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Sidebar dan notifikasi"
          source="components/nav-main.tsx (NavBadge, NavDot) · leave/ui/components/ApprovalInbox.tsx (InboxCount)"
          kind="spec"
        >
          <DocCanvas className="items-stretch">
            <div className="bg-sidebar flex w-56 flex-col gap-1 rounded-xl p-2 text-sm">
              <SidebarRow label="Cuti">
                <span className="bg-foreground/[0.08] text-foreground/70 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums">
                  4
                </span>
              </SidebarRow>
              <SidebarRow label="Yang baru">
                <span
                  aria-hidden
                  className="bg-primary ml-auto size-2 rounded-full"
                />
              </SidebarRow>
              <SidebarRow label="Tugas">
                <span className="bg-foreground/[0.08] text-foreground/70 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums">
                  99+
                </span>
              </SidebarRow>
            </div>
            <div className="flex items-center">
              <Button>
                Approval
                <InboxCount count={3} />
              </Button>
            </div>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            <>
              Pill bikin sendiri{" "}
              <code className="font-mono text-xs">
                bg-muted rounded-full px-2 py-0.5 text-xs
              </code>
              : pakai Badge secondary atau ListChip.
            </>,
            <>
              <code className="font-mono text-xs">
                bg-success-subtle text-green-11
              </code>{" "}
              di span buat status: Badge success.
            </>,
            <>
              Warna lewat className di Badge (
              <code className="font-mono text-xs">
                {'<Badge className="bg-info-subtle …">'}
              </code>
              ).
            </>,
            <>Ukuran lain: text-sm, text-[11px], py-px.</>,
            <>Peta status yang sama disalin ke file lain.</>,
          ]}
        />
      </DocGroup>
    </div>
  )
}

function SidebarRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex h-8 items-center gap-2 rounded-full px-2.5">
      <span className="truncate">{label}</span>
      {children}
    </div>
  )
}

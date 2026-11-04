"use client"

import { ListChip } from "@/components/grouped-list"
import { Badge, type BadgeVariant } from "@/components/ui/badge"
import {
  LEAVE_STATUS_VARIANT,
  LeaveStatusBadge,
} from "@/entities/leave/ui/LeaveStatus"
import { StepStatusBadge } from "@/page-slices/projects/ui/workspace/StepStatusBadge"
import { cn } from "@/lib/utils"
import {
  RiCheckLine,
  RiCloseLine,
  RiLockLine,
  RiTimeLine,
} from "@/shared/ui/lucide-icons"
import { useEffect, useRef, useState } from "react"
import { BeforeAfter } from "./compare"

/**
 * /ui → Badge, "Sebelum / sesudah": hand-made pills left, Badge variants
 * (and the shared maps) right, then each variant measured from the page.
 */

const pill = "rounded-full px-2 py-0.5 text-xs"

function Code({ children }: { children: string }) {
  return (
    <code className="bg-muted text-caption block rounded-md px-2 py-1 font-mono whitespace-pre">
      {children}
    </code>
  )
}

export function BadgeCompare() {
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label="Langkah proses (portal + panel): span tangan → StepStatusBadge"
        before={
          <>
            <span className={cn(pill, "bg-success-subtle text-success-ink")}>
              Selesai
            </span>
            <span className={cn(pill, "bg-muted text-muted-foreground")}>
              Belum selesai
            </span>
          </>
        }
        after={
          <>
            <StepStatusBadge done>Selesai</StepStatusBadge>
            <StepStatusBadge done={false}>Belum selesai</StepStatusBadge>
          </>
        }
      />
      <BeforeAfter
        label="Status invoice: Badge dicat ulang lewat className → variant"
        before={
          <>
            <Badge className="bg-muted text-muted-foreground">Draft</Badge>
            <Badge className="bg-info-subtle text-blue-11">Terkirim</Badge>
            <Badge className="bg-destructive-subtle text-red-11">
              Terlambat
            </Badge>
          </>
        }
        after={
          <>
            <Badge variant="secondary">Draft</Badge>
            <Badge variant="info">Terkirim</Badge>
            <Badge variant="destructive">Terlambat</Badge>
          </>
        }
      />
      <BeforeAfter
        label="Tag (Internal, Lead, Default): text-[11px] / py-px / px-2.5 py-1 → Badge"
        before={
          <>
            <span className="bg-muted text-muted-foreground text-micro inline-flex items-center gap-1 rounded-full px-1.5 py-px font-medium">
              <RiLockLine className="size-3" />
              Internal
            </span>
            <span className="bg-primary/10 text-primary text-micro rounded-full px-1.5 py-px leading-4 font-medium">
              Lead
            </span>
            <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs">
              Default
            </span>
          </>
        }
        after={
          <>
            <Badge variant="secondary">
              <RiLockLine data-icon="inline-start" />
              Internal
            </Badge>
            <Badge>Lead</Badge>
            <Badge variant="secondary">Default</Badge>
          </>
        }
      />
      <BeforeAfter
        label="RSVP tamu: div rounded-sm → Badge ikon (+ label buat screen reader)"
        before={
          <>
            {(
              [
                ["bg-success-subtle text-success-ink", RiCheckLine],
                ["bg-warning-subtle text-warning-ink", RiTimeLine],
                ["bg-destructive-subtle text-red-11", RiCloseLine],
              ] as const
            ).map(([c, Icon]) => (
              <div
                key={c}
                className={cn(
                  "flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs",
                  c,
                )}
              >
                <Icon className="h-3 w-3" />
              </div>
            ))}
          </>
        }
        after={
          <>
            {(
              [
                ["success", RiCheckLine],
                ["warning", RiTimeLine],
                ["destructive", RiCloseLine],
              ] as const
            ).map(([v, Icon]) => (
              <Badge key={v} variant={v}>
                <Icon />
              </Badge>
            ))}
          </>
        }
      />
      <BeforeAfter
        label="Fakta di kartu (mata uang, negara, fase): pill bergaris → ListChip"
        before={
          <>
            <span className={cn(pill, "border-border border")}>IDR</span>
            <span className={cn(pill, "bg-muted text-muted-foreground")}>
              Indonesia
            </span>
            <span className="border-border rounded-md border px-2 py-0.5 text-xs">
              Discovery
            </span>
          </>
        }
        after={
          <>
            <ListChip>IDR</ListChip>
            <ListChip>Indonesia</ListChip>
            <ListChip>Discovery</ListChip>
          </>
        }
      />
      <BeforeAfter
        label="Peta status cuti: disalin di 4 file → satu LeaveStatusBadge"
        before={
          <div className="flex flex-col gap-2">
            {[
              "EmployeeLeaveList.tsx",
              "LeaveDetailsModal.tsx",
              "LeaveRequestDetailDialog.tsx",
              "AdminColumns.tsx (switch)",
            ].map((f) => (
              <span key={f} className="text-muted-foreground text-meta">
                {f}: <code className="font-mono text-xs">STATUS_VARIANT</code>
              </span>
            ))}
          </div>
        }
        after={
          <div className="flex flex-col gap-2">
            <Code>{`// entities/leave/ui/LeaveStatus.tsx\n${Object.entries(
              LEAVE_STATUS_VARIANT,
            )
              .map(([k, v]) => `${k} → ${v}`)
              .join("\n")}`}</Code>
            <span className="flex gap-2">
              {Object.keys(LEAVE_STATUS_VARIANT).map((s) => (
                <LeaveStatusBadge key={s} status={s} />
              ))}
            </span>
          </div>
        }
      />
      <Measured />
    </div>
  )
}

const VARIANTS: BadgeVariant[] = [
  "success",
  "warning",
  "destructive",
  "info",
  "secondary",
  "outline",
  "default",
]

/** Each variant as the browser resolves it: box, type and colours. */
function Measured() {
  const refs = useRef<(HTMLSpanElement | null)[]>([])
  const [rows, setRows] = useState<string[]>([])
  useEffect(() => {
    setRows(
      VARIANTS.map((_, i) => {
        const el = refs.current[i]
        if (!el) return ""
        const cs = getComputedStyle(el)
        return `${Math.round(el.getBoundingClientRect().height)}px · ${cs.fontSize} / ${cs.fontWeight} · padding ${cs.paddingLeft} · ${cs.backgroundColor} · ${cs.color}`
      }),
    )
  }, [])
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">Diukur dari CSS yang jalan</h3>
      <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
        <div className="bg-background flex flex-col rounded-lg py-1">
          {VARIANTS.map((v, i) => (
            <div
              key={v}
              className="gutter-x grid min-h-12 grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-4 py-2 sm:grid-cols-[6rem_7rem_minmax(0,1fr)]"
            >
              <span>
                <Badge
                  ref={(el: HTMLSpanElement | null) => {
                    refs.current[i] = el
                  }}
                  variant={v}
                >
                  Disetujui
                </Badge>
              </span>
              <code className="text-caption font-mono max-sm:hidden">{v}</code>
              <span className="text-muted-foreground text-meta truncate text-right tabular-nums">
                {rows[i] || "…"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

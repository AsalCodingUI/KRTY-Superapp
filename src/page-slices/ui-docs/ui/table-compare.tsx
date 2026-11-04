"use client"

import {
  GroupedList,
  ListGroup,
  ListHeader,
  ListRow,
} from "@/components/grouped-list"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { BeforeAfter } from "./compare"

/**
 * /ui → Table, "Sebelum / sesudah": a list as pages used to draw it
 * (lines between rows, a lined header, per-row hover, mixed heights,
 * right-aligned middle column, hand-made status pill) vs the shared
 * GroupedList, then its rows and header read from the page.
 */

const ROWS = [
  ["Website Kopi Senja", "Oakland", "Aktif", "12 hari"],
  ["App Kasir Toko Bunga", "Flora & Co", "Review", "4 hari"],
  ["Rebrand Klinik Sehat", "Klinik Sehat", "Selesai", "30 hari"],
] as const
const TONE = {
  Aktif: "success",
  Review: "warning",
  Selesai: "secondary",
} as const
const GRID = "grid grid-cols-[minmax(0,1fr)_6rem_5rem] items-center gap-x-4"

export function TableCompare() {
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label="Daftar dengan header kolom"
        before={
          <div className="text-body w-full">
            <div
              className={cn(
                GRID,
                "text-muted-foreground border-border border-b py-2 text-xs",
              )}
            >
              <span>Project</span>
              <span className="text-right">Status</span>
              <span className="text-right">Durasi</span>
            </div>
            {ROWS.map(([name, client, status, dur], i) => (
              <div
                key={name}
                className={cn(
                  GRID,
                  "border-border/50 hover:bg-muted/20 border-b py-2.5",
                  i === 1 ? "min-h-16" : "min-h-11",
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {client}
                  </span>
                </span>
                <span className="text-right">
                  <span className="bg-success-subtle text-green-11 rounded-sm px-1.5 py-0.5 text-xs">
                    {status}
                  </span>
                </span>
                <span className="text-right tabular-nums">{dur}</span>
              </div>
            ))}
          </div>
        }
        after={
          <GroupedList className="w-full [--bleed:0px]">
            <ListHeader grid={GRID}>
              <span>Project</span>
              <span>Status</span>
              <span className="text-right">Durasi</span>
            </ListHeader>
            {ROWS.map(([name, client, status, dur]) => (
              <ListRow key={name} desc className={GRID}>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{name}</span>
                  <span className="text-tertiary-foreground text-meta truncate">
                    {client}
                  </span>
                </span>
                <span>
                  <Badge variant={TONE[status]}>{status}</Badge>
                </span>
                <span className="text-right tabular-nums">{dur}</span>
              </ListRow>
            ))}
          </GroupedList>
        }
      />
      <BeforeAfter
        label="Grup: header bergaris → pill"
        before={
          <div className="text-body w-full">
            <div className="border-border flex h-12 items-center gap-2 border-b font-medium">
              Aktif <span className="text-muted-foreground">2</span>
            </div>
            <div className="border-border/50 flex min-h-12 items-center border-b">
              Website Kopi Senja
            </div>
          </div>
        }
        after={
          <GroupedList className="w-full [--bleed:0px]">
            <ListGroup label="Aktif" count={2}>
              <ListRow>Website Kopi Senja</ListRow>
            </ListGroup>
          </GroupedList>
        }
      />
      <Measured />
    </div>
  )
}

function Measured() {
  const ref = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState<string[]>([])
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const header = root.querySelector<HTMLElement>("[data-slot=list-header]")
    const list = [...root.querySelectorAll<HTMLElement>("[data-slot=list-row]")]
    const h = (el?: HTMLElement | null) =>
      el ? `${el.getBoundingClientRect().height}px` : "–"
    const r = (el?: HTMLElement | null) =>
      el ? getComputedStyle(el).borderTopLeftRadius : "–"
    const gap =
      header && list[0]
        ? `${(list[0].getBoundingClientRect().top - header.getBoundingClientRect().bottom).toFixed(1)}px`
        : "–"
    setRows([
      `Header: tinggi ${h(header)} · radius ${r(header)} · garis bawah ${header ? getComputedStyle(header).borderBottomWidth : "–"}`,
      `Baris biasa: ${h(list[0])} · baris + deskripsi: ${h(list[1])}`,
      `Header → baris pertama: ${gap}`,
      `Garis antar baris: ${list[0] ? getComputedStyle(list[0]).borderBottomWidth : "–"}`,
    ])
  }, [])
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">Diukur dari CSS yang jalan</h3>
      <div ref={ref} className="sr-only">
        <GroupedList className="w-96">
          <ListHeader grid={GRID}>
            <span>Project</span>
          </ListHeader>
          <ListRow className={GRID}>Satu baris</ListRow>
          <ListRow desc className={GRID}>
            Dengan deskripsi
          </ListRow>
        </GroupedList>
      </div>
      <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
        <div className="bg-background flex flex-col rounded-lg py-1">
          {rows.length
            ? rows.map((t) => (
                <div
                  key={t}
                  className="gutter-x text-meta text-muted-foreground flex min-h-12 items-center tabular-nums"
                >
                  {t}
                </div>
              ))
            : "…"}
        </div>
      </div>
    </div>
  )
}

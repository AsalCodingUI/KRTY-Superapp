"use client"

import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { Bell } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { BeforeAfter } from "./compare"

/**
 * /ui → Navigasi, "Sebelum / sesudah": the old hand-made tab bits left, the
 * TabNavigation props right, then values read from the live page.
 */

const TABS = [
  { value: "all", label: "Semua", count: 12 },
  { value: "draft", label: "Draft", count: 3 },
  { value: "archived", label: "Arsip", count: 0 },
] as const

type Tab = (typeof TABS)[number]["value"]

function useTab() {
  return useState<Tab>("all")
}

export function NavigationCompare() {
  const [a, setA] = useTab()
  const [b, setB] = useTab()
  const [c, setC] = useTab()
  const [d, setD] = useTab()
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label="Angka di tab: pill badge / span ditulis tangan → count"
        before={
          <div className="flex w-full flex-col gap-3">
            <TabNavigation>
              {TABS.map((t) => (
                <TabNavigationLink
                  key={t.value}
                  active={a === t.value}
                  onClick={() => setA(t.value)}
                  showLeadingIcon={false}
                >
                  {t.label}
                  {/* The old `badge` pill. */}
                  <span className="bg-primary text-primary-foreground ml-1.5 inline-flex min-w-5 items-center justify-center rounded-sm px-1.5 py-0.5 text-xs font-medium">
                    {t.count}
                  </span>
                </TabNavigationLink>
              ))}
            </TabNavigation>
            <code className="text-tertiary-foreground text-meta font-mono">
              {"{count > 0 && <span className=…>}"} di 5 halaman
            </code>
          </div>
        }
        after={
          <div className="flex w-full flex-col gap-3">
            <TabNavigation>
              {TABS.map((t) => (
                <TabNavigationLink
                  key={t.value}
                  active={b === t.value}
                  onClick={() => setB(t.value)}
                  count={t.count}
                  showLeadingIcon={false}
                >
                  {t.label}
                </TabNavigationLink>
              ))}
            </TabNavigation>
            <code className="text-tertiary-foreground text-meta font-mono">
              {"count={n}"} · 0 nggak tampil
            </code>
          </div>
        }
      />
      <BeforeAfter
        label="Garis tab digambar ulang: wrapper border-b + border-b-0 → TabNavigation / plain"
        before={
          <div className="flex w-full flex-col gap-5">
            <div className="border-border border-b">
              <TabNavigation className="border-b-0">
                {TABS.map((t) => (
                  <TabNavigationLink
                    key={t.value}
                    active={c === t.value}
                    onClick={() => setC(t.value)}
                    showLeadingIcon={false}
                  >
                    {t.label}
                  </TabNavigationLink>
                ))}
              </TabNavigation>
            </div>
            <div className="bg-muted/60 flex items-center justify-between rounded-lg px-3">
              <TabNavigation className="border-b-0">
                {TABS.map((t) => (
                  <TabNavigationLink
                    key={t.value}
                    active={c === t.value}
                    onClick={() => setC(t.value)}
                    showLeadingIcon={false}
                  >
                    {t.label}
                  </TabNavigationLink>
                ))}
              </TabNavigation>
            </div>
          </div>
        }
        after={
          <div className="flex w-full flex-col gap-5">
            <TabNavigation>
              {TABS.map((t) => (
                <TabNavigationLink
                  key={t.value}
                  active={d === t.value}
                  onClick={() => setD(t.value)}
                  showLeadingIcon={false}
                >
                  {t.label}
                </TabNavigationLink>
              ))}
            </TabNavigation>
            <div className="bg-muted/60 flex items-center justify-between rounded-lg px-3">
              <TabNavigation plain>
                {TABS.map((t) => (
                  <TabNavigationLink
                    key={t.value}
                    active={d === t.value}
                    onClick={() => setD(t.value)}
                    showLeadingIcon={false}
                  >
                    {t.label}
                  </TabNavigationLink>
                ))}
              </TabNavigation>
            </div>
          </div>
        }
      />
      <BeforeAfter
        label="Fokus tab: ring-3 ring-ring/30 → ring-2 ring-focus-ring (sama kayak field & tombol)"
        before={<FocusTab ring="ring-ring/30 ring-3" />}
        after={<FocusTab ring="ring-focus-ring ring-2" />}
      />
      <Measured />
    </div>
  )
}

/** The focus ring drawn statically (in the app it shows on keyboard focus). */
function FocusTab({ ring }: { ring: string }) {
  return (
    <div className="flex items-center gap-6">
      {["Semua", "Draft"].map((label, i) => (
        <span
          key={label}
          className={cn(
            "inline-flex h-8 items-center rounded-md px-0.5 text-sm font-medium",
            i === 0 ? cn("text-foreground", ring) : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      ))}
      <code className="text-tertiary-foreground text-meta font-mono">
        {ring}
      </code>
    </div>
  )
}

/** Tab height, underline, gaps, the count and the focus ring, read from
 *  the live page. */
function Measured() {
  const [tab, setTab] = useTab()
  const [plainTab, setPlainTab] = useTab()
  const box = useRef<HTMLDivElement>(null)
  const plainBox = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLSpanElement>(null)
  const [rows, setRows] = useState<[string, string, string][]>([])
  useEffect(() => {
    const root = box.current
    if (!root) return
    const list = root.querySelector<HTMLElement>(
      "[data-slot=tab-navigation] ul",
    )
    const link = root.querySelector<HTMLElement>("[data-active]")
    const count = root.querySelector<HTMLElement>(".tabular-nums")
    const plainList = plainBox.current?.querySelector<HTMLElement>(
      "[data-slot=tab-navigation] ul",
    )
    const ring = ringRef.current
    if (!list || !link) return
    const ls = getComputedStyle(list)
    const cs = count ? getComputedStyle(count) : null
    // The ring is one of several box-shadows ("<color> 0px 0px 0px 2px"):
    // the widest spread is the ring.
    const shadow = ring ? getComputedStyle(ring).boxShadow : ""
    const spreads = [...shadow.matchAll(/0px 0px 0px (\d+(?:\.\d+)?)px/g)].map(
      (m) => Number(m[1]),
    )
    const spread = spreads.length ? Math.max(...spreads) : null
    setRows([
      [
        "Tinggi tab",
        "TabNavigationLink",
        `${link.getBoundingClientRect().height.toFixed(0)}px`,
      ],
      ["Jarak antar tab", "TabNavigation gap-6", ls.columnGap],
      ["Garis bawah", "TabNavigation", `${ls.borderBottomWidth} solid`],
      [
        "Garis bawah plain",
        "TabNavigation plain",
        plainList ? getComputedStyle(plainList).borderBottomWidth : "…",
      ],
      [
        "Angka",
        "count",
        cs ? `ml ${cs.marginLeft} · ${cs.fontVariantNumeric}` : "…",
      ],
      [
        "Ring fokus",
        "ring-2 ring-focus-ring",
        spread !== null ? `${spread}px` : "…",
      ],
    ])
  }, [])
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">Diukur dari CSS yang jalan</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div ref={box}>
          <TabNavigation>
            {TABS.map((t) => (
              <TabNavigationLink
                key={t.value}
                active={tab === t.value}
                onClick={() => setTab(t.value)}
                count={t.count}
                showLeadingIcon={false}
              >
                {t.label}
              </TabNavigationLink>
            ))}
          </TabNavigation>
        </div>
        <div ref={plainBox}>
          <TabNavigation plain>
            {TABS.map((t) => (
              <TabNavigationLink
                key={t.value}
                active={plainTab === t.value}
                onClick={() => setPlainTab(t.value)}
                showLeadingIcon={false}
              >
                {t.label}
              </TabNavigationLink>
            ))}
          </TabNavigation>
        </div>
      </div>
      <span
        ref={ringRef}
        aria-hidden
        className="ring-focus-ring hidden ring-2"
      />
      <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
        <div className="bg-background flex flex-col rounded-lg py-1">
          {(rows.length
            ? rows
            : [["…", "", ""] as [string, string, string]]
          ).map(([name, source, value]) => (
            <div
              key={name}
              className="gutter-x grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-2"
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-caption">{name}</span>
                <code className="text-tertiary-foreground text-meta truncate font-mono">
                  {source}
                </code>
              </span>
              <span className="text-muted-foreground text-meta tabular-nums">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** The shell, drawn small: the old top bar + breadcrumb row vs the
 *  sidebar header and the tab row on the chrome. */
function Pill({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "text-caption flex h-5 items-center rounded-full px-2",
        className,
      )}
    >
      {children}
    </span>
  )
}

export function ShellCompare() {
  return (
    <BeforeAfter
      label="Top bar + breadcrumb → semua di sidebar, tab di atas halaman"
      before={
        <div className="bg-chrome flex w-full flex-col overflow-hidden rounded-xl">
          <div className="flex h-8 items-center gap-2 px-2">
            <Pill className="font-medium">Kretya</Pill>
            <Pill className="bg-chrome-field">Pribadi · Project</Pill>
            <Pill className="bg-chrome-field mx-auto w-28">Cari ⌘K</Pill>
            <Pill>
              <Bell className="size-3" />
            </Pill>
            <Pill>Ahmad</Pill>
          </div>
          <div className="flex h-36 pr-2 pb-2">
            <div className="text-caption text-muted-foreground flex w-20 flex-col gap-1 px-2">
              <span>Beranda</span>
              <span>Tim</span>
              <span>Cuti</span>
            </div>
            <div className="bg-background flex flex-1 flex-col rounded-lg">
              <div className="text-caption text-muted-foreground flex h-7 items-center gap-1 px-2">
                ◫ | Tim › Akses
              </div>
              <div className="text-body px-2 font-medium">Tim</div>
            </div>
          </div>
        </div>
      }
      after={
        <div className="bg-chrome flex w-full overflow-hidden rounded-xl">
          <div className="text-caption text-muted-foreground flex w-32 flex-col gap-1.5 p-2 whitespace-nowrap">
            <span className="text-foreground flex justify-between font-medium">
              Kretya <span>‹ › ◫</span>
            </span>
            <Pill className="bg-chrome-field justify-center">
              Pribadi · Project
            </Pill>
            <span className="flex gap-1">
              <Pill className="border-chrome-border flex-1 border">Cari</Pill>
              <Pill className="px-1">
                <Bell className="size-3" />
              </Pill>
            </span>
            <span>Beranda</span>
            <span>Tim</span>
            <span className="mt-auto">Ahmad</span>
          </div>
          <div className="flex flex-1 flex-col pr-2 pb-2">
            <div className="flex h-7 items-end">
              <span className="text-caption flex h-6 items-center rounded-t-md bg-(--sheet) px-2 font-medium">
                Tim
              </span>
              <span className="text-caption text-muted-foreground flex h-5 items-center px-2">
                Kalender
              </span>
              <span className="text-caption text-muted-foreground px-1">+</span>
            </div>
            <div className="flex h-36 flex-col rounded-lg rounded-tl-none bg-(--sheet) pt-3">
              <div className="text-body px-2 font-medium">Tim</div>
            </div>
          </div>
        </div>
      }
    />
  )
}

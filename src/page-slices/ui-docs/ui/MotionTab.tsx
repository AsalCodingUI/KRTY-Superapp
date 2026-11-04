"use client"

import { GroupedList, ListRow } from "@/components/grouped-list"
import { RollingValue } from "@/components/rolling-value"
import { SegmentedControl } from "@/components/segmented-control"
import { Button } from "@/components/ui/button"
import { Collapse } from "@/components/ui/collapse"
import { cn } from "@/lib/utils"
import { TAB_ENTER } from "@/shared/hooks/useTabSwitched"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiCloseLine,
  RiRefreshLine,
} from "@/shared/ui/lucide-icons"
import { AnimatePresence, m } from "motion/react"
import { useState, type CSSProperties } from "react"
import * as mock from "../model/motion-mock"
import {
  DocCanvas,
  DocDont,
  DocExample,
  DocGroup,
  DocIntro,
  DocRules,
  DocToken,
} from "./doc-blocks"

const RULES: [string, string][] = [
  [
    "Easing",
    "Satu aja: ease-out (sudah = cubic-bezier(0.23, 1, 0.32, 1)). Di m.* pakai [0.23, 1, 0.32, 1]",
  ],
  [
    "Durasi",
    "150ms hover/warna · 200ms default (baris, collapse, highlight) · 300ms kedatangan besar · bar 600ms",
  ],
  [
    "Yang gerak",
    "Cuma transform & opacity. Tinggi lewat Collapse, bar lewat bar-grow",
  ],
  ["Jarak", "Kecil: 4px buat baris/swap, 8px enter-rise, skala minimal 0.96"],
  [
    "Highlight",
    "Satu indikator yang meluncur (SlidingIndicator / HoverHighlight), bukan tiap item",
  ],
  ["Render pertama", "Nggak ada animasi: initial={false}, useTabSwitched"],
  [
    "Ringan",
    "Lebih dari 50 baris = tanpa motion per baris. Nggak ada layout di list",
  ],
  [
    "Kurangi gerak",
    "MotionConfig reducedMotion=user + motion-reduce:transition-none / animate-none",
  ],
  ["Library", "m.* dari motion/react (LazyMotion), bukan motion.*"],
]

const TOKENS = [
  {
    name: "duration-150 ease-out",
    value: "150ms · hover, warna",
    cls: "duration-150",
  },
  {
    name: "duration-200 ease-out",
    value: "200ms · default",
    cls: "duration-200",
  },
  {
    name: "duration-300 ease-out",
    value: "300ms · kedatangan besar",
    cls: "duration-300",
  },
]

/**
 * /ui → Motion: the one ease, the three durations, and every shared piece
 * of motion (enter, collapse, sliding highlight, number roll, rows coming
 * and going), each the real component with a button to replay it.
 */
export function MotionTab() {
  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="motion.md">
        Satu easing, tiga durasi, dan komponen gerak yang dipakai bareng. Pencet
        tombolnya buat muter ulang.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Token"
        note="Ease-out yang kuat: cepat di awal, mendarat halus. Ketiga titik di bawah pakai kurva yang sama."
      >
        <DurationScale />
        <DocExample
          title="Kurva lain (cuma buat tempatnya)"
          source="app/globals.css @theme"
          kind="spec"
        >
          <div className="flex flex-col">
            <DocToken
              name="ease-in-out"
              value="cubic-bezier(0.77, 0, 0.175, 1)"
            >
              <span className="text-muted-foreground text-sm">
                Barang yang sudah di layar pindah tempat (jarang)
              </span>
            </DocToken>
            <DocToken name="ease-drawer" value="cubic-bezier(0.32, 0.72, 0, 1)">
              <span className="text-muted-foreground text-sm">
                Sheet dan drawer aja
              </span>
            </DocToken>
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Muncul">
        <EnterDemo />
      </DocGroup>

      <DocGroup title="Buka / tutup">
        <CollapseDemo />
      </DocGroup>

      <DocGroup
        title="Highlight yang meluncur"
        note="Satu kotak yang pindah, bukan tiap item nyalain background sendiri."
      >
        <SlidingDemo />
      </DocGroup>

      <DocGroup title="Angka berganti">
        <RollDemo />
      </DocGroup>

      <DocGroup
        title="Baris datang dan pergi"
        note="ListRow di dalam AnimatePresence initial={false}. Di atas 50 baris, GroupedList mematikan motion per baris."
      >
        <ListDemo />
      </DocGroup>

      <DocGroup title="Bar">
        <BarDemo />
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            <>
              <code className="font-mono text-xs">
                const EASE = [0.23, 1, 0.32, 1]
              </code>{" "}
              disalin ke halaman, atau{" "}
              <code className="font-mono text-xs">
                ease-[cubic-bezier(0.23,1,0.32,1)]
              </code>{" "}
              (pakai <code className="font-mono text-xs">ease-out</code>)
            </>,
            'Kurva lain: (0.22,1,0.36,1), (0.2,0,0,1), "easeOut", spring',
            "Durasi di luar skala: 100, 125, 180, 220, 250, 400, 500, 700ms",
            <>
              <code className="font-mono text-xs">
                m.div animate=&#123;&#123; width &#125;&#125;
              </code>{" "}
              atau <code className="font-mono text-xs">transition-[width]</code>{" "}
              di bar (pakai bar-grow)
            </>,
            "layout di baris list (dan layout tanpa fitur max: nggak jalan)",
            "transition-all, animate-ping / bounce yang terus jalan",
          ]}
        />
      </DocGroup>
    </div>
  )
}

/** A dot crossing a track at each duration, all on ease-out. */
function DurationScale() {
  const [on, setOn] = useState(false)
  return (
    <DocExample
      title="Skala durasi"
      source="Tailwind duration-* + ease-out (globals.css --ease-out)"
      kind="spec"
    >
      <div className="flex flex-col gap-2">
        {TOKENS.map((t) => (
          <DocToken key={t.name} name={t.name} value={t.value}>
            <div className="bg-muted relative h-6 w-64 rounded-full">
              <span
                className={cn(
                  "bg-primary absolute top-1 left-1 size-4 rounded-full transition-transform ease-out motion-reduce:transition-none",
                  t.cls,
                  on && "translate-x-[14.5rem]",
                )}
              />
            </div>
          </DocToken>
        ))}
        <div>
          <Button variant="outline" size="sm" onClick={() => setOn((v) => !v)}>
            <RiRefreshLine data-icon="inline-start" />
            Putar
          </Button>
        </div>
      </div>
    </DocExample>
  )
}

function EnterDemo() {
  const [run, setRun] = useState(0)
  return (
    <div className="grid gap-8 md:grid-cols-3">
      <DocExample
        title="enter-rise"
        source="app/globals.css (@utility enter-rise)"
      >
        <DocCanvas className="min-h-32 justify-center">
          <div
            key={run}
            className="enter-rise bg-background rounded-xl px-4 py-3 text-sm shadow-(--elev-2)"
          >
            Muncul sekali, 300ms
          </div>
        </DocCanvas>
      </DocExample>
      <DocExample
        title="m.div (swap kecil)"
        source="opacity + y 4px · 0.2s · [0.23, 1, 0.32, 1]"
      >
        <DocCanvas className="min-h-32 justify-center">
          <m.div
            key={run}
            initial={run ? { opacity: 0, y: 4 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="bg-background rounded-xl px-4 py-3 text-sm shadow-(--elev-2)"
          >
            Ganti isi, 200ms
          </m.div>
        </DocCanvas>
      </DocExample>
      <DocExample title="TAB_ENTER" source="shared/hooks/useTabSwitched.ts">
        <DocCanvas className="min-h-32 justify-center">
          <div
            key={run}
            className={cn(
              "bg-background rounded-xl px-4 py-3 text-sm shadow-(--elev-2)",
              run > 0 && TAB_ENTER,
            )}
          >
            Isi tab, setelah pindah tab
          </div>
        </DocCanvas>
      </DocExample>
      <div className="md:col-span-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRun((n) => n + 1)}
        >
          <RiRefreshLine data-icon="inline-start" />
          Putar ulang
        </Button>
      </div>
    </div>
  )
}

function CollapseDemo() {
  const [open, setOpen] = useState(true)
  return (
    <DocExample title="Collapse" source="components/ui/collapse.tsx">
      <div className="bg-muted dark:bg-muted/40 max-w-md rounded-xl p-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium"
        >
          <RiArrowDownSLine
            className={cn(
              "text-muted-foreground size-4 transition-transform duration-200 ease-out motion-reduce:transition-none",
              !open && "-rotate-90",
            )}
          />
          Detail project
        </button>
        <Collapse open={open}>
          <div className="bg-background text-muted-foreground flex flex-col gap-1 rounded-lg px-3 py-3 text-sm">
            <p>Grid rows 0fr ↔ 1fr: tinggi beranimasi tanpa ngukur.</p>
            <p>
              Pencet cepat berkali-kali: baliknya mulai dari posisi sekarang.
            </p>
          </div>
        </Collapse>
      </div>
    </DocExample>
  )
}

function SlidingDemo() {
  const [value, setValue] =
    useState<(typeof mock.segments)[number]["value"]>("week")
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <DocExample
        title="SlidingIndicator"
        source="components/segmented-control.tsx · sliding-indicator.tsx"
      >
        <SegmentedControl
          fitContent
          items={[...mock.segments]}
          value={value}
          onChange={setValue}
        />
      </DocExample>
      <DocExample
        title="HoverHighlight (arahkan mouse)"
        source="components/grouped-list.tsx · sliding-indicator.tsx"
      >
        <GroupedList>
          {mock.listRows.map((r) => (
            <ListRow key={r.id}>{r.name}</ListRow>
          ))}
        </GroupedList>
      </DocExample>
    </div>
  )
}

function RollDemo() {
  const [i, setI] = useState(0)
  const value = mock.figures[i % mock.figures.length]
  return (
    <DocExample title="RollingValue" source="components/rolling-value.tsx">
      <div className="flex items-center gap-6">
        <span className="text-heading text-3xl font-medium tabular-nums">
          <RollingValue value={value}>{value}</RollingValue>
        </span>
        <Button variant="outline" size="sm" onClick={() => setI((n) => n + 1)}>
          <RiRefreshLine data-icon="inline-start" />
          Ganti kuartal
        </Button>
      </div>
    </DocExample>
  )
}

function ListDemo() {
  const [rows, setRows] = useState(mock.listRows)
  const [next, setNext] = useState(0)
  const add = () => {
    const name = mock.extraRows[next % mock.extraRows.length]
    setRows((r) => [{ id: `n${next}`, name, client: "Baru" }, ...r])
    setNext((n) => n + 1)
  }
  return (
    <DocExample
      title="GroupedList + ListRow"
      source="components/grouped-list.tsx"
    >
      <div className="flex max-w-xl flex-col gap-3">
        <div>
          <Button variant="outline" size="sm" onClick={add}>
            <RiAddLine data-icon="inline-start" />
            Tambah baris
          </Button>
        </div>
        <GroupedList>
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <ListRow key={r.id}>
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Hapus ${r.name}`}
                  onClick={() =>
                    setRows((all) => all.filter((x) => x.id !== r.id))
                  }
                >
                  <RiCloseLine />
                </Button>
              </ListRow>
            ))}
          </AnimatePresence>
        </GroupedList>
      </div>
    </DocExample>
  )
}

function BarDemo() {
  const [run, setRun] = useState(0)
  return (
    <DocExample
      title="bar-grow"
      source="app/globals.css (@utility bar-grow) · set --bar"
    >
      <div className="flex max-w-md flex-col gap-3">
        {[72, 45, 18].map((v) => (
          <div key={`${run}-${v}`} className="bg-muted h-2 rounded-full">
            <div
              className="bar-grow bg-primary h-full rounded-full"
              style={{ "--bar": `${v}%` } as CSSProperties}
            />
          </div>
        ))}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRun((n) => n + 1)}
          >
            <RiRefreshLine data-icon="inline-start" />
            Putar ulang
          </Button>
        </div>
      </div>
    </DocExample>
  )
}

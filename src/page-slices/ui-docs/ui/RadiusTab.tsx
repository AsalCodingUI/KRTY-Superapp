"use client"

import { RadiusCompare } from "./radius-compare"
import { surfaceClassName } from "@/components/panel"
import { ProjectAvatar } from "@/components/project-avatar"
import { ListChip } from "@/components/grouped-list"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { RiAddLine } from "@/shared/ui/lucide-icons"
import type { CSSProperties } from "react"
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
    "Skala",
    "sm 6 · md 8 · lg 10 · xl 14 · 2xl 18 · 3xl 22 · full (pill). Semua turunan --radius (10px)",
  ],
  [
    "Squircle",
    "Radius ≥ 5px otomatis jadi squircle dan dikali 1.715 di browser yang dukung (postcss/smooth-corners.cjs). rounded-full dan < 5px nggak disentuh",
  ],
  [
    "Bersarang",
    "Radius dalam = radius luar − padding. Container: nest-rounded-* nest-p-*, anak: rounded-nested (min 4px)",
  ],
  ["Kontrol", "Button, input, select, badge, tab, avatar: rounded-full"],
  ["Label kecil", "ListChip, textarea, tooltip: rounded-md · Kbd: rounded-sm"],
  ["Baris", "Highlight hover/terpilih + pill header: rounded-lg"],
  ["Kartu", "surfaceClassName / HomeCard / Panel: rounded-xl"],
  ["Melayang", "Popover, menu, select, toast: rounded-2xl"],
  [
    "Modal & halaman",
    "Dialog, drawer, page sheet: rounded-3xl · sheet kanan: rounded-nested",
  ],
  [
    "App Mac",
    "Page sheet md:rounded-[10px] (sudut jendela 16pt − 6px); sheet kanan turun ke 4px",
  ],
]

const SCALE: { cls: string; round: string; squircle: string; use: string }[] = [
  { cls: "rounded-sm", round: "6px", squircle: "10.3px", use: "Kbd" },
  {
    cls: "rounded-md",
    round: "8px",
    squircle: "13.7px",
    use: "ListChip, textarea",
  },
  {
    cls: "rounded-lg",
    round: "10px",
    squircle: "17.2px",
    use: "Highlight baris, item menu",
  },
  { cls: "rounded-xl", round: "14px", squircle: "24px", use: "Kartu" },
  {
    cls: "rounded-2xl",
    round: "18px",
    squircle: "30.9px",
    use: "Popover, menu, toast",
  },
  {
    cls: "rounded-3xl",
    round: "22px",
    squircle: "37.7px",
    use: "Dialog, page sheet",
  },
  { cls: "rounded-full", round: "pill", squircle: "—", use: "Kontrol" },
]

/** Spelled out so Tailwind sees each class. */
const SCALE_CLASS: Record<string, string> = {
  "rounded-sm": "rounded-sm",
  "rounded-md": "rounded-md",
  "rounded-lg": "rounded-lg",
  "rounded-xl": "rounded-xl",
  "rounded-2xl": "rounded-2xl",
  "rounded-3xl": "rounded-3xl",
  "rounded-full": "rounded-full",
}

const PER_COMPONENT: [string, string][] = [
  ["Button, Toggle", "rounded-full"],
  ["Input, Select, InputGroup", "rounded-full"],
  ["Textarea", "rounded-md"],
  ["Badge", "rounded-full"],
  ["ListChip", "rounded-md"],
  ["Kbd, angka di tab", "rounded-sm"],
  ["Checkbox", "rounded-[5px] (di komponennya)"],
  ["Avatar, Switch, Progress", "rounded-full"],
  ["ProjectAvatar", "rounded-[5px] (di komponennya)"],
  ["Tabs, SegmentedControl, item sidebar", "rounded-full"],
  ["Highlight baris, pill header", "rounded-lg"],
  ["Item menu / select", "rounded-nested (10px / 6px)"],
  ["Tooltip", "rounded-md"],
  ["Kartu, thumbnail file", "rounded-xl"],
  ["Popover, menu, toast, command", "rounded-2xl · nest-rounded-2xl nest-p-2"],
  ["Dialog, alert dialog, drawer", "rounded-3xl"],
  ["Dialog di HP (sheet bawah)", "max-sm:rounded-t-[28px]"],
  ["Sheet kanan, side panel", "rounded-nested (14px; Mac 4px)"],
  [
    "Page sheet web / HP / Mac",
    "md:rounded-3xl · max-md:rounded-t-3xl · md:rounded-[10px]",
  ],
  ["Kartu kaca (MinimalCard)", "rounded-[24px]"],
  ["Kertas (invoice, PDF)", "rounded-[4px]"],
]

/** Inline styles skip the PostCSS squircle pass, so the two corners can be
 *  set side by side. corner-shape isn't in React's CSS types yet. */
const roundCorner = { borderRadius: 22, cornerShape: "round" } as CSSProperties
const squircleCorner = {
  borderRadius: 22 * 1.715,
  cornerShape: "squircle",
} as CSSProperties

/** /ui → Radius: the scale, nested corners, and who gets which. */
export function RadiusTab() {
  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="radius.md">
        Satu skala radius, diatur terpusat lewat{" "}
        <code className="font-mono text-xs">--radius</code> di globals.css.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Sebelum / sesudah"
        note="Radius per peran (rounded-chip, row, card, popover, dialog, control, tile) dipasang di semua komponen. Kiri: nilai lama; kanan: yang jalan sekarang."
      >
        <RadiusCompare />
      </DocGroup>

      <DocGroup
        title="Skala"
        note="Angka kedua: ukuran setelah dikali squircle (Chrome). Safari & app Mac tampil bulat biasa di angka pertama."
      >
        <div className="flex flex-col">
          {SCALE.map((s) => (
            <DocToken
              key={s.cls}
              name={s.cls}
              value={`${s.round} · squircle ${s.squircle}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "bg-muted border-border size-16 shrink-0 border",
                    s.cls === "rounded-full" && "w-28",
                    SCALE_CLASS[s.cls],
                  )}
                />
                <span className="text-muted-foreground text-sm">{s.use}</span>
              </div>
            </DocToken>
          ))}
        </div>
      </DocGroup>

      <DocGroup
        title="Squircle"
        note="postcss/smooth-corners.cjs: corner-shape: squircle + radius × 1.715, jadi luas potongannya sama dengan sudut bulat."
      >
        <DocExample title="Bulat vs squircle (22px)" kind="spec">
          <DocCanvas>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-primary/15 size-28" style={roundCorner} />
              <span className="text-muted-foreground text-[13px]">
                round 22px
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-primary/15 size-28" style={squircleCorner} />
              <span className="text-muted-foreground text-[13px]">
                squircle 37.7px
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-primary/15 squircle-mask size-28" />
              <span className="text-muted-foreground text-[13px]">
                squircle-mask (ikon app)
              </span>
            </div>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup
        title="Radius bersarang"
        note="Dalam = luar − padding. Container pasang nest-rounded-* nest-p-*, anaknya rounded-nested."
      >
        <div className="grid gap-8 md:grid-cols-2">
          <DocExample
            title="Benar: nest-rounded-2xl nest-p-2"
            source="globals.css · ui/dropdown-menu.tsx"
            kind="spec"
          >
            <NestedDemo nested />
          </DocExample>
          <DocExample title="Salah: radius sama di dalam" kind="spec">
            <NestedDemo nested={false} />
          </DocExample>
        </div>
        <DocExample
          title="Sheet kanan di dalam page sheet"
          source="ui/sheet.tsx (--nest-r: 3xl, --nest-p: 8px → 14px)"
          kind="spec"
        >
          <div className="bg-chrome rounded-3xl p-3">
            <div className="bg-background nest-rounded-3xl relative h-56 max-w-xl p-4 shadow-(--elev-3) [--nest-p:0.5rem]">
              <div className="bg-muted h-4 w-32 rounded-full" />
              <div className="bg-popover rounded-nested absolute top-2 right-2 bottom-2 w-48 shadow-(--elev-5)" />
            </div>
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Per komponen">
        <DocRules rules={PER_COMPONENT} />
        <DocExample title="Kontrol & label" kind="real">
          <DocCanvas>
            <Button>
              <RiAddLine data-icon="inline-start" />
              Tombol
            </Button>
            <Button variant="outline" size="icon" aria-label="Tambah">
              <RiAddLine />
            </Button>
            <Input className="w-40" placeholder="Input" />
            <Badge variant="success">Badge</Badge>
            <ListChip>ListChip</ListChip>
            <Kbd>⌘K</Kbd>
            <Checkbox defaultChecked aria-label="Checkbox" />
            <Avatar>
              <AvatarFallback>KS</AvatarFallback>
            </Avatar>
            <ProjectAvatar id="demo" name="Kretya" />
          </DocCanvas>
        </DocExample>
        <DocExample title="Kotak" kind="real">
          <DocCanvas className="items-start">
            <Textarea className="w-48" placeholder="Textarea (rounded-md)" />
            <div className={cn(surfaceClassName, "w-48 p-5 text-sm")}>
              Kartu (rounded-xl)
            </div>
            <div className="bg-popover nest-rounded-2xl nest-p-2 w-48 shadow-(--elev-4)">
              <div className="bg-accent rounded-nested flex min-h-8 items-center px-2 text-sm">
                Menu (rounded-2xl)
              </div>
            </div>
            <div className="bg-popover flex h-28 w-48 items-center justify-center rounded-3xl text-sm shadow-(--elev-5)">
              Dialog (rounded-3xl)
            </div>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="App Mac" note="DESKTOP_CSS di src/app/(main)/layout.tsx">
        <DocRules
          rules={[
            [
              "Page sheet",
              "6px dari tepi jendela (md:pr-1.5 md:pb-1.5), md:rounded-[10px]: sudut jendela macOS 16pt − 6",
            ],
            [
              "Sheet kanan",
              "right/bottom 14px (6 + 8), --nest-r 10px × --corner-k → rounded-nested jatuh ke 4px",
            ],
            [
              "Squircle",
              "WebKit belum dukung corner-shape: semua sudut bulat biasa",
            ],
            ["Windows", "Sama dengan web"],
          ]}
        />
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            "Item rounded-2xl di dalam menu rounded-2xl p-2 (sudutnya tabrakan)",
            "Nilai di antara skala: rounded-[24px], rounded-[12px], rounded-[9px]",
            "rounded-full di kartu atau kotak multi-baris",
            "Nyalin bg-card border rounded-xl ke halaman; pakai surfaceClassName",
            "Ngatur corner-shape atau radius sendiri per halaman",
          ]}
        />
      </DocGroup>
    </div>
  )
}

function NestedDemo({ nested }: { nested: boolean }) {
  return (
    <div
      className={cn(
        "bg-popover w-56 shadow-(--elev-4)",
        nested ? "nest-rounded-2xl nest-p-2" : "rounded-2xl p-2",
      )}
    >
      {["Buka", "Ganti nama", "Hapus"].map((label, i) => (
        <div
          key={label}
          className={cn(
            "flex min-h-8 items-center px-2 text-sm",
            i === 0 && "bg-accent",
            nested ? "rounded-nested" : "rounded-2xl",
          )}
        >
          {label}
        </div>
      ))}
    </div>
  )
}

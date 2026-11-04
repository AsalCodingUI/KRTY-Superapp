"use client"

import { HomeCard } from "@/app/(main)/dashboard/components/home-card"
import { surfaceClassName } from "@/components/panel"
import { ProjectAvatar } from "@/components/project-avatar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { initials } from "@/shared/lib/initials"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { BeforeAfter } from "./compare"

/**
 * /ui → Components, "Sebelum / sesudah": the hand-made versions on the
 * left (drawn from their old code), the shared pieces on the right, then
 * the helper's output and the sizes as the browser resolves them.
 */

const NAMES = ["Ayu Lestari", "bima pratama", "Kretya", "  Citra  Wulandari "]

/** Old inline rule: the first two characters. */
const sliceTwo = (name: string) => name.slice(0, 2).toUpperCase()

/** Old local helpers (ProjectList, task-utils, nav-user…): word initials,
 *  one letter for a one-word name. */
const wordLetters = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

function Letters({ value }: { value: string }) {
  return (
    <code className="bg-muted text-caption rounded-chip px-1.5 py-0.5 font-mono">
      {value || "∅"}
    </code>
  )
}

/** The old finance NameTile: its own palette, rounded-md, first letter. */
const OLD_TILE_COLORS = [
  "bg-blue-9",
  "bg-teal-9",
  "bg-purple-9",
  "bg-orange-9",
  "bg-pink-9",
]
function OldNameTile({ name, i }: { name: string; i: number }) {
  return (
    <span
      className={cn(
        "text-micro flex size-7 shrink-0 items-center justify-center rounded-md font-medium text-white",
        OLD_TILE_COLORS[i % OLD_TILE_COLORS.length],
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

const CLIENTS = ["Figma", "Notion", "Sinar Makmur"]

export function ComponentsCompare() {
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label="Inisial: 5 helper lokal + 16 .slice(0, 2) → initials() (shared/lib/initials)"
        before={
          <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-4 gap-y-2">
            <span className="text-tertiary-foreground text-meta">nama</span>
            <span className="text-tertiary-foreground text-meta">
              .slice(0, 2)
            </span>
            <span className="text-tertiary-foreground text-meta">
              helper kata
            </span>
            {NAMES.map((n) => (
              <Row key={n} name={n}>
                <Letters value={sliceTwo(n)} />
                <Letters value={wordLetters(n)} />
              </Row>
            ))}
          </div>
        }
        after={
          <div className="grid grid-cols-[auto_auto] items-center gap-x-4 gap-y-2">
            <span className="text-tertiary-foreground text-meta">nama</span>
            <span className="text-tertiary-foreground text-meta">
              initials()
            </span>
            {NAMES.map((n) => (
              <Row key={n} name={n}>
                <Letters value={initials(n)} />
              </Row>
            ))}
          </div>
        }
      />
      <BeforeAfter
        label="Ukuran avatar: className size-5 / size-7 / size-8 → prop size xs / md / default"
        before={
          <>
            {["size-5", "size-6", "size-7", "size-8", "size-10"].map((s) => (
              <Avatar key={s} className={s}>
                <AvatarFallback>{initials("Ayu Lestari")}</AvatarFallback>
              </Avatar>
            ))}
          </>
        }
        after={
          <>
            {(["xs", "sm", "md", "default", "lg"] as const).map((s) => (
              <Avatar key={s} size={s}>
                <AvatarFallback>{initials("Ayu Lestari")}</AvatarFallback>
              </Avatar>
            ))}
          </>
        }
      />
      <BeforeAfter
        label="HomeCard: permukaan kartu ditulis sendiri → surfaceClassName"
        before={
          <section className="bg-card border-field-border dark:border-border rounded-card p-surface flex w-56 min-w-0 flex-col gap-4 border">
            <h2 className="text-heading text-title font-normal">Kehadiran</h2>
            <span className="text-muted-foreground text-meta">8 / 11 jam</span>
          </section>
        }
        after={
          <HomeCard title="Kehadiran" className="w-56">
            <span className="text-muted-foreground text-meta">8 / 11 jam</span>
          </HomeCard>
        }
      />
      <BeforeAfter
        label="Logo klien di Keuangan: NameTile (palet sendiri) → ProjectAvatar"
        before={
          <>
            {CLIENTS.map((c, i) => (
              <OldNameTile key={c} name={c} i={i} />
            ))}
          </>
        }
        after={
          <>
            {CLIENTS.map((c) => (
              <ProjectAvatar
                key={c}
                id={c}
                name={c}
                className="text-micro size-7"
              />
            ))}
          </>
        }
      />
      <Measured />
    </div>
  )
}

function Row({ name, children }: { name: string; children: ReactNode }) {
  return (
    <>
      <span className="text-caption whitespace-pre">“{name}”</span>
      {children}
    </>
  )
}

const SIZES = ["xs", "sm", "md", "default", "lg"] as const

/** Avatar sizes and the card surface, read from the live page. */
function Measured() {
  const avatars = useRef<(HTMLSpanElement | null)[]>([])
  const card = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState<[string, string][]>([])
  useEffect(() => {
    const out: [string, string][] = SIZES.map((s, i) => {
      const el = avatars.current[i]?.firstElementChild
      return [
        `Avatar size="${s}"`,
        el ? `${el.getBoundingClientRect().width}px` : "",
      ]
    })
    const el = card.current?.firstElementChild
    if (el) {
      const cs = getComputedStyle(el)
      out.push(["HomeCard: radius", cs.borderTopLeftRadius])
      out.push(["HomeCard: padding", cs.paddingTop])
      out.push([
        "HomeCard: border",
        `${cs.borderTopWidth} ${cs.borderTopColor}`,
      ])
    }
    setRows(out)
  }, [])
  return (
    <div className="relative flex flex-col gap-2">
      <h3 className="text-body font-medium">Diukur dari CSS yang jalan</h3>
      <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
        <div className="bg-background flex flex-col rounded-lg py-1">
          {rows.map(([k, v]) => (
            <div
              key={k}
              className="gutter-x grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-2"
            >
              <code className="text-caption font-mono">{k}</code>
              <span className="text-muted-foreground text-meta tabular-nums">
                {v || "…"}
              </span>
            </div>
          ))}
        </div>
      </div>
      <code className="text-tertiary-foreground text-caption font-mono">
        surfaceClassName = {surfaceClassName}
      </code>
      {/* Off-screen copies to measure. */}
      <div aria-hidden className="invisible absolute size-0 overflow-hidden">
        {SIZES.map((s, i) => (
          <span
            key={s}
            ref={(el) => {
              avatars.current[i] = el
            }}
          >
            <Avatar size={s} />
          </span>
        ))}
        <div ref={card}>
          <HomeCard title="x">x</HomeCard>
        </div>
      </div>
    </div>
  )
}

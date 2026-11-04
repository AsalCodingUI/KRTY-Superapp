"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { BeforeAfter } from "./compare"

/**
 * /ui → Spacing, "Sebelum / sesudah": old spacing left, the role tokens
 * right, then the tokens and a label → input gap measured from the page.
 */

function Field({ gap, label }: { gap: string; label: string }) {
  return (
    <div className={cn("flex w-44 flex-col", gap)}>
      <Label>{label}</Label>
      <Input placeholder="Rebranding" />
    </div>
  )
}

export function SpacingCompare() {
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label="Label → input: gap-1.5 / gap-2 / gap-3 → gap-field (8px)"
        before={
          <>
            <Field gap="gap-1.5" label="Nama project" />
            <Field gap="gap-3" label="Klien" />
          </>
        }
        after={
          <>
            <Field gap="gap-field" label="Nama project" />
            <Field gap="gap-field" label="Klien" />
          </>
        }
      />
      <BeforeAfter
        label="space-y → flex gap (elemen tersembunyi nggak ninggalin jarak)"
        before={
          <div className="text-meta w-44 space-y-3">
            <div className="bg-muted rounded-lg px-3 py-2">Baris 1</div>
            <div className="bg-muted hidden rounded-lg px-3 py-2">
              Tersembunyi
            </div>
            <div className="bg-muted rounded-lg px-3 py-2">Baris 3</div>
          </div>
        }
        after={
          <div className="text-meta flex w-44 flex-col gap-3">
            <div className="bg-muted rounded-lg px-3 py-2">Baris 1</div>
            <div className="bg-muted hidden rounded-lg px-3 py-2">
              Tersembunyi
            </div>
            <div className="bg-muted rounded-lg px-3 py-2">Baris 3</div>
          </div>
        }
      />
      <BeforeAfter
        label="Di luar grid 4px: gap-7 (28px) → gap-6 (24px)"
        before={
          <div className="flex gap-7">
            {[1, 2, 3].map((i) => (
              <span key={i} className="bg-primary/20 size-8 rounded-lg" />
            ))}
          </div>
        }
        after={
          <div className="flex gap-6">
            {[1, 2, 3].map((i) => (
              <span key={i} className="bg-primary/20 size-8 rounded-lg" />
            ))}
          </div>
        }
      />
      <BeforeAfter
        label="Padding kartu: p-5 di tiap kartu → p-surface (20px, satu tempat)"
        before={
          <div className="bg-card border-field-border text-meta w-48 rounded-xl border p-5">
            Langganan
          </div>
        }
        after={
          <div className="bg-card border-field-border text-meta rounded-card p-surface w-48 border">
            Langganan
          </div>
        }
      />
      <Measured />
    </div>
  )
}

const TOKENS = [
  ["gap-field", "gap", "Label → kontrolnya"],
  ["gap-fields", "gap", "Antar field"],
  ["gap-inline", "gap", "Tombol / chip berdampingan"],
  ["gap-section", "gap", "Antar section di halaman"],
  ["p-surface", "padding", "Padding kartu, dialog, sheet"],
] as const

/** The tokens and a real label → input gap, read from the live page. */
function Measured() {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const label = useRef<HTMLLabelElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<string[]>([])
  const [gap, setGap] = useState("")
  useEffect(() => {
    setRows(
      TOKENS.map(([, kind], i) => {
        const el = refs.current[i]
        if (!el) return ""
        const cs = getComputedStyle(el)
        return kind === "gap" ? cs.rowGap : cs.paddingTop
      }),
    )
    if (label.current && input.current)
      setGap(
        `${(
          input.current.getBoundingClientRect().top -
          label.current.getBoundingClientRect().bottom
        ).toFixed(1)}px`,
      )
  }, [])
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">Diukur dari CSS yang jalan</h3>
      <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
        <div className="bg-background flex flex-col rounded-lg py-1">
          {TOKENS.map(([c, , role], i) => (
            <div
              key={c}
              className="gutter-x grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-2"
            >
              <span className="flex min-w-0 flex-col">
                <code className="text-caption font-mono">{c}</code>
                <span className="text-tertiary-foreground text-meta truncate">
                  {role}
                </span>
              </span>
              <span className="text-muted-foreground text-meta tabular-nums">
                {rows[i] || "…"}
              </span>
              <div
                aria-hidden
                ref={(el) => {
                  refs.current[i] = el
                }}
                className={cn(c, "hidden")}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="gap-field flex w-48 flex-col">
          <Label ref={label}>Contoh field</Label>
          <Input ref={input} placeholder="…" />
        </div>
        <span className="text-muted-foreground text-meta tabular-nums">
          label → input: {gap || "…"}
        </span>
      </div>
    </div>
  )
}

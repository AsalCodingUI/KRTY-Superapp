"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { RiNotification3Line } from "@/shared/ui/lucide-icons"
import { useEffect, useRef, useState } from "react"
import { BeforeAfter } from "./compare"

/**
 * /ui → Feedback, "Sebelum / sesudah": old toast copy, route skeletons and
 * the pinging bell dot left, what runs now right, then measured.
 */

/** A picture of a toast (the Toaster is always dark). */
function ToastPill({ text, error = false }: { text: string; error?: boolean }) {
  return (
    <span className="rounded-popover shadow-popover text-body flex items-center gap-2 bg-neutral-900 px-4 py-3 text-white">
      <span
        aria-hidden
        className={cn(
          "size-2 shrink-0 rounded-full",
          error ? "bg-red-400" : "bg-emerald-400",
        )}
      />
      {text}
    </span>
  )
}

const bell =
  "text-muted-foreground relative grid size-7 place-items-center rounded-md"

export function FeedbackCompare() {
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label="Copy toast: titik, 3 ejaan “tersimpan”, error.message → satu gaya"
        before={
          <div className="flex flex-col items-start gap-2">
            <ToastPill error text="Gagal menyimpan." />
            <ToastPill error text="Gagal nyimpen. Coba lagi." />
            <ToastPill text="Tersimpan." />
            <ToastPill text="Disimpan" />
            <ToastPill
              error
              text="new row violates row-level security policy for table “leave_requests”"
            />
          </div>
        }
        after={
          <div className="flex flex-col items-start gap-2">
            <ToastPill error text="Gagal menyimpan, coba lagi" />
            <ToastPill error text="Gagal menyimpan, coba lagi" />
            <ToastPill text="Tersimpan" />
            <ToastPill text="Tersimpan" />
            <ToastPill error text="Gagal menyetujui pengajuan" />
          </div>
        }
      />
      <BeforeAfter
        label="Skeleton route vs tombol asli: h-9 rounded-md → h-8 rounded-control"
        before={
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Button>Tambah klien</Button>
          </div>
        }
        after={
          <div className="flex items-center gap-2">
            <Skeleton className="rounded-control h-8 w-32" />
            <Button>Tambah klien</Button>
          </div>
        }
      />
      <BeforeAfter
        label="Titik belum dibaca di lonceng: merah + ping terus → titik diam"
        before={
          <span className={bell}>
            <RiNotification3Line className="size-4" />
            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex size-2">
              <span className="bg-destructive absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-destructive relative inline-flex size-2 rounded-full" />
            </span>
          </span>
        }
        after={
          <span className={bell}>
            <RiNotification3Line className="size-4" />
            <span className="bg-primary ring-background absolute top-0 right-0 -mt-1 -mr-1 size-2 rounded-full ring-2" />
          </span>
        }
      />
      <Measured />
    </div>
  )
}

/** Skeleton vs the real button, and the bell dot's animation. */
function Measured() {
  const skeleton = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const dot = useRef<HTMLSpanElement>(null)
  const [rows, setRows] = useState<[string, string, string][]>([])
  useEffect(() => {
    const s = skeleton.current
    const b = button.current
    const d = dot.current
    if (!s || !b || !d) return
    const cs = getComputedStyle(s)
    const cb = getComputedStyle(b)
    const cd = getComputedStyle(d)
    setRows([
      ["Tinggi", cs.height, cb.height],
      ["Radius", cs.borderRadius, cb.borderRadius],
      ["Animasi titik", cd.animationName, cd.backgroundColor],
    ])
  }, [])
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">Diukur dari CSS yang jalan</h3>
      <div className="bg-muted dark:bg-muted/40 rounded-card p-1">
        <div className="bg-background rounded-row flex flex-col py-1">
          <div className="gutter-x text-tertiary-foreground text-meta grid min-h-10 grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4">
            <span />
            <span>Skeleton (sesudah)</span>
            <span>Button asli</span>
          </div>
          {rows.map(([label, a, b]) => (
            <div
              key={label}
              className="gutter-x grid min-h-12 grid-cols-[8rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4 py-2"
            >
              <span className="text-meta">{label}</span>
              <code className="text-caption truncate font-mono">{a}</code>
              <code className="text-caption truncate font-mono">{b}</code>
            </div>
          ))}
          {rows.length === 0 && (
            <span className="gutter-x text-meta py-3">…</span>
          )}
        </div>
      </div>
      <p className="text-tertiary-foreground text-meta">
        Baris terakhir: animation-name titik lonceng (harus none) dan warnanya.
      </p>
      <div aria-hidden className="pointer-events-none invisible fixed top-0">
        <Skeleton ref={skeleton} className="rounded-control h-8 w-32" />
        <Button ref={button}>Tambah klien</Button>
        <span
          ref={dot}
          className="bg-primary ring-background size-2 rounded-full ring-2"
        />
      </div>
    </div>
  )
}

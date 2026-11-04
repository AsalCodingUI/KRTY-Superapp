"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  RiCloseLine,
  RiDeleteBinLine,
  RiLogoutBoxLine,
} from "@/shared/ui/lucide-icons"
import { useEffect, useRef, useState } from "react"
import { BeforeAfter } from "./compare"

/**
 * /ui → Tombol, "Sebelum / sesudah": the old hand-rolled classes left, the
 * variants and sizes as the app uses them now right, then every size
 * measured from the page.
 */

function useBusy() {
  const [busy, setBusy] = useState(false)
  const run = () => {
    setBusy(true)
    window.setTimeout(() => setBusy(false), 1600)
  }
  return [busy, run] as const
}

export function ButtonCompare() {
  const [busyOld, runOld] = useBusy()
  const [busyNew, runNew] = useBusy()
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label='Hapus yang tenang: ghost + text-destructive-ink di tiap halaman → variant="destructive-ghost"'
        before={
          <>
            <Button
              variant="ghost"
              className="text-destructive-ink hover:text-destructive-ink"
            >
              Hapus metode
            </Button>
            <Button variant="ghost" className="text-destructive-ink">
              <RiLogoutBoxLine data-icon="inline-start" />
              Keluar
            </Button>
          </>
        }
        after={
          <>
            <Button variant="destructive-ghost">Hapus metode</Button>
            <Button variant="destructive-ghost">
              <RiLogoutBoxLine data-icon="inline-start" />
              Keluar
            </Button>
          </>
        }
      />
      <BeforeAfter
        label="Hapus ketiga: outline + hover:bg-destructive/10 → destructive"
        before={
          <Button
            variant="outline"
            className="text-destructive-ink hover:bg-destructive/10"
          >
            <RiDeleteBinLine data-icon="inline-start" />
            Hapus acara
          </Button>
        }
        after={
          <Button variant="destructive">
            <RiDeleteBinLine data-icon="inline-start" />
            Hapus acara
          </Button>
        }
      />
      <BeforeAfter
        label="Ukuran di luar skala → size yang ada"
        before={
          <>
            <Button variant="secondary" className="h-9 px-4">
              Absen masuk
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-[13px]"
            >
              Buka project
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Hapus"
              className="text-muted-foreground size-6"
            >
              <RiDeleteBinLine />
            </Button>
            <Button variant="ghost" size="xs" className="h-5 rounded-full px-2">
              Atur tanggal
            </Button>
          </>
        }
        after={
          <>
            <Button variant="secondary">Absen masuk</Button>
            <Button variant="ghost" size="sm">
              Buka project
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Hapus"
              className="text-muted-foreground"
            >
              <RiDeleteBinLine />
            </Button>
            <Button variant="ghost" size="xs">
              Atur tanggal
            </Button>
          </>
        }
      />
      <BeforeAfter
        label="Lagi nyimpan: cuma ganti label → disabled + Spinner + label (klik)"
        before={
          <Button disabled={busyOld} onClick={runOld}>
            {busyOld ? "Menyimpan…" : "Simpan"}
          </Button>
        }
        after={
          <Button disabled={busyNew} onClick={runNew}>
            {busyNew && <Spinner data-icon="inline-start" />}
            {busyNew ? "Menyimpan…" : "Simpan"}
          </Button>
        }
      />
      <BeforeAfter
        label="Ikon saja: title= doang → aria-label + Tooltip"
        before={
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive-ink"
            title="Tolak"
          >
            <RiCloseLine />
          </Button>
        }
        after={
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="destructive-ghost"
                  size="icon"
                  aria-label="Tolak"
                />
              }
            >
              <RiCloseLine />
            </TooltipTrigger>
            <TooltipContent>Tolak</TooltipContent>
          </Tooltip>
        }
      />
      <Measured />
    </div>
  )
}

const SIZES = [
  "xs",
  "sm",
  "default",
  "lg",
  "icon-xs",
  "icon-sm",
  "icon",
  "icon-lg",
] as const

/** Every size as the browser resolves it: height, side padding, font. */
function Measured() {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const ghostRef = useRef<HTMLButtonElement>(null)
  const [rows, setRows] = useState<string[]>([])
  const [ghost, setGhost] = useState("")
  useEffect(() => {
    setRows(
      SIZES.map((_, i) => {
        const el = refs.current[i]
        if (!el) return ""
        const cs = getComputedStyle(el)
        return `${Math.round(el.getBoundingClientRect().height)}px tinggi · padding ${cs.paddingLeft} / ${cs.paddingRight} · ${cs.fontSize}`
      }),
    )
    if (ghostRef.current) {
      const cs = getComputedStyle(ghostRef.current)
      setGhost(`warna ${cs.color} · latar ${cs.backgroundColor}`)
    }
  }, [])
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">Diukur dari CSS yang jalan</h3>
      <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
        <div className="bg-background flex flex-col rounded-lg py-1">
          {SIZES.map((size, i) => (
            <div
              key={size}
              className="gutter-x grid min-h-12 grid-cols-[6rem_minmax(0,1fr)_auto] items-center gap-x-4 py-2"
            >
              <span>
                <Button
                  ref={(el) => {
                    refs.current[i] = el
                  }}
                  variant="outline"
                  size={size}
                  aria-label={size.startsWith("icon") ? "Edit" : undefined}
                >
                  {size.startsWith("icon") ? <RiDeleteBinLine /> : "Simpan"}
                </Button>
              </span>
              <code className="text-caption font-mono">{size}</code>
              <span className="text-muted-foreground text-meta text-right tabular-nums">
                {rows[i] || "…"}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button ref={ghostRef} variant="destructive-ghost">
          Hapus
        </Button>
        <span className="text-muted-foreground text-meta tabular-nums">
          destructive-ghost: {ghost || "…"}
        </span>
      </div>
    </div>
  )
}

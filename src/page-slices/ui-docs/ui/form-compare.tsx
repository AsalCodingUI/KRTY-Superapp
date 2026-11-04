"use client"

import { ChevronDown } from "@/components/icons"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
  fieldTriggerClassName,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { RiSearchLine } from "@/shared/ui/lucide-icons"
import { useEffect, useRef, useState } from "react"
import { BeforeAfter } from "./compare"

/**
 * /ui → Form, "Sebelum / sesudah": the old hand-styled fields left, the
 * shared variants right, then heights and gaps read from the live page.
 */

const OLD_GHOST =
  "hover:bg-accent text-[13px] border-transparent bg-transparent px-2.5 shadow-none hover:border-transparent"

// BriefCreateDialog's copy (no hover border, no focus border).
const OLD_COMBOBOX =
  "bg-field hover:bg-field-hover border-field-border focus-visible:ring-focus-ring flex h-8 w-full cursor-pointer items-center justify-between gap-1.5 rounded-full border px-3 text-sm outline-none focus-visible:ring-2"

function StatusSelect({
  className,
  ghost,
}: {
  className?: string
  ghost?: boolean
}) {
  return (
    <Select defaultValue="progress">
      <SelectTrigger
        size="sm"
        variant={ghost ? "ghost" : "default"}
        aria-label="Status"
        className={cn("w-40", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todo">To do</SelectItem>
        <SelectItem value="progress">Dikerjakan</SelectItem>
        <SelectItem value="done">Selesai</SelectItem>
      </SelectContent>
    </Select>
  )
}

function Combo({ className }: { className: string }) {
  return (
    <button
      type="button"
      className={cn(className, "text-muted-foreground w-48")}
    >
      <span className="truncate">Pilih klien</span>
      <ChevronDown className="text-muted-foreground size-4 shrink-0" />
    </button>
  )
}

export function FormCompare() {
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label={`Baris properti: SelectTrigger digaya ulang → variant="ghost"`}
        before={<StatusSelect className={OLD_GHOST} />}
        after={<StatusSelect ghost />}
      />
      <BeforeAfter
        label="Combobox (Popover + Command): kelas disalin → fieldTriggerClassName"
        before={<Combo className={OLD_COMBOBOX} />}
        after={<Combo className={fieldTriggerClassName} />}
      />
      <BeforeAfter
        label={`Field kecil di baris / toolbar: h-7 text-[13px] → size="sm"`}
        before={
          <>
            <Input
              aria-label="Label skala"
              placeholder="Sangat kurang"
              className="h-7 w-40 text-[13px]"
            />
            <InputGroup className="h-7 w-28">
              <InputGroupInput aria-label="Bobot" placeholder="25" />
              <InputGroupAddon align="inline-end">%</InputGroupAddon>
            </InputGroup>
          </>
        }
        after={
          <>
            <Input
              size="sm"
              aria-label="Label skala"
              placeholder="Sangat kurang"
              className="w-40"
            />
            <InputGroup size="sm" className="w-28">
              <InputGroupInput aria-label="Bobot" placeholder="25" />
              <InputGroupAddon align="inline-end">%</InputGroupAddon>
            </InputGroup>
          </>
        }
      />
      <BeforeAfter
        label="Ukuran di luar skala: h-9 / text-xs di Input → bawaan (h-8)"
        before={
          <>
            <Input
              aria-label="Tugas baru"
              placeholder="Tugas baru"
              className="h-9 w-44 text-[13px]"
            />
            <Input
              readOnly
              aria-label="Link"
              value="https://krty.id/p/3f9a"
              className="w-44 text-xs"
            />
          </>
        }
        after={
          <>
            <Input
              aria-label="Tugas baru"
              placeholder="Tugas baru"
              className="w-44"
            />
            <Input
              readOnly
              aria-label="Link"
              value="https://krty.id/p/3f9a"
              className="w-44"
            />
          </>
        }
      />
      <BeforeAfter
        label="Kotak cari: ikon absolute + pl-9 → InputGroup"
        before={
          <div className="relative w-56">
            <RiSearchLine className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              type="search"
              aria-label="Cari"
              placeholder="Cari klien"
              className="pl-9"
            />
          </div>
        }
        after={
          <InputGroup className="w-56">
            <InputGroupAddon>
              <RiSearchLine />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="Cari"
              placeholder="Cari klien"
            />
          </InputGroup>
        }
      />
      <BeforeAfter
        label={`Wajib dan error: " *" + p text-xs → required + FieldError (13px)`}
        before={
          <div className="gap-field flex w-56 flex-col">
            <Label htmlFor="cmp-title-old">Judul *</Label>
            <Input id="cmp-title-old" aria-invalid defaultValue="" />
            <p className="text-destructive-ink text-xs">Judul wajib diisi</p>
          </div>
        }
        after={
          <div className="gap-field flex w-56 flex-col">
            <Label htmlFor="cmp-title-new">Judul</Label>
            <Input id="cmp-title-new" required aria-invalid defaultValue="" />
            <FieldError>Judul wajib diisi</FieldError>
          </div>
        }
      />
      <BeforeAfter
        label={`Angka: type="number" (spinner, scroll ganti nilai) → inputMode + pembersih`}
        before={
          <Input
            type="number"
            aria-label="Bobot"
            defaultValue={40}
            className="w-24"
          />
        }
        after={<NumberField />}
      />
      <Measured />
    </div>
  )
}

/** Digits only, 0–100 (ProjectScoringView). */
function NumberField() {
  const [value, setValue] = useState(40)
  return (
    <Input
      inputMode="numeric"
      aria-label="Bobot"
      value={value}
      onChange={(e) =>
        setValue(Math.min(100, Number(e.target.value.replace(/\D/g, ""))))
      }
      className="w-24 tabular-nums"
    />
  )
}

/** Control heights, label → control gaps and the error size, read from
 *  the live page. */
function Measured() {
  const box = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState<Record<string, string>>({})
  useEffect(() => {
    const root = box.current
    if (!root) return
    const out: Record<string, string> = {}
    root.querySelectorAll<HTMLElement>("[data-measure]").forEach((el) => {
      const key = el.dataset.measure!
      if (key.startsWith("gap:")) {
        const label = el.querySelector("label")
        const control = el.querySelector(
          "[data-slot=input], [data-slot=select-trigger]",
        )
        if (label && control)
          out[key] = `${(
            control.getBoundingClientRect().top -
            label.getBoundingClientRect().bottom
          ).toFixed(1)}px`
      } else if (key.startsWith("text:")) {
        const cs = getComputedStyle(el)
        out[key] = `${cs.fontSize} / ${cs.lineHeight}`
      } else {
        out[key] = `${el.getBoundingClientRect().height.toFixed(0)}px`
      }
    })
    setRows(out)
  }, [])

  const ROWS: [string, string, string][] = [
    ["h:input", "Input", "h-8"],
    ["h:input-sm", 'Input size="sm"', "h-7"],
    ["h:group-sm", 'InputGroup size="sm"', "h-7"],
    ["h:select", "SelectTrigger", "h-8"],
    ["h:select-sm", 'SelectTrigger size="sm"', "h-7"],
    ["h:ghost", 'SelectTrigger variant="ghost" size="sm"', "h-7"],
    ["h:combo", "fieldTriggerClassName", "h-8"],
    ["gap:input", "Label → Input", "gap-field"],
    ["gap:select", "Label → SelectTrigger", "gap-field"],
    ["text:error", "FieldError", "text-meta"],
  ]

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">Diukur dari CSS yang jalan</h3>
      {/* The measured controls, real components. */}
      <div ref={box} className="flex flex-wrap items-end gap-3">
        <Input data-measure="h:input" aria-label="Input" className="w-32" />
        <Input
          data-measure="h:input-sm"
          size="sm"
          aria-label="Input sm"
          className="w-32"
        />
        <InputGroup data-measure="h:group-sm" size="sm" className="w-28">
          <InputGroupInput aria-label="InputGroup sm" />
          <InputGroupAddon align="inline-end">%</InputGroupAddon>
        </InputGroup>
        <Select defaultValue="a">
          <SelectTrigger
            data-measure="h:select"
            aria-label="Select"
            className="w-32"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Opsi A</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="a">
          <SelectTrigger
            data-measure="h:select-sm"
            size="sm"
            aria-label="Select sm"
            className="w-32"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Opsi A</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="a">
          <SelectTrigger
            data-measure="h:ghost"
            size="sm"
            variant="ghost"
            aria-label="Select ghost"
            className="w-32"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Opsi A</SelectItem>
          </SelectContent>
        </Select>
        <button
          type="button"
          data-measure="h:combo"
          className={cn(fieldTriggerClassName, "w-36")}
        >
          <span className="truncate">Combobox</span>
          <ChevronDown className="text-muted-foreground size-4 shrink-0" />
        </button>
        <div data-measure="gap:input" className="gap-field flex w-40 flex-col">
          <Label htmlFor="measure-input">Nama</Label>
          <Input id="measure-input" />
        </div>
        <div data-measure="gap:select" className="gap-field flex w-40 flex-col">
          <Label>Mata uang</Label>
          <Select defaultValue="idr">
            <SelectTrigger aria-label="Mata uang" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="idr">IDR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <FieldError data-measure="text:error">Contoh error</FieldError>
      </div>
      <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
        <div className="bg-background flex flex-col rounded-lg py-1">
          {ROWS.map(([key, name, token]) => (
            <div
              key={key}
              className="gutter-x grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-2"
            >
              <span className="flex min-w-0 flex-col">
                <code className="text-caption font-mono">{name}</code>
                <span className="text-tertiary-foreground text-meta truncate">
                  {token}
                </span>
              </span>
              <span className="text-muted-foreground text-meta tabular-nums">
                {rows[key] || "…"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

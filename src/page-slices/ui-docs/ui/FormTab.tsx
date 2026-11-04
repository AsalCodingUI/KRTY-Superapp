"use client"

import { DateField } from "@/components/date-field"
import { DateRangePicker, type DateRange } from "@/components/date-picker"
import { FileDropCanvas } from "@/components/file-drop-canvas"
import { FileField } from "@/components/file-field"
import { InlineText } from "@/components/inline-text"
import { QuarterFilter } from "@/components/quarter-filter"
import { RichTextField } from "@/components/rich-text-field"
import { SegmentedControl } from "@/components/segmented-control"
import { TimeSelect } from "@/components/time-select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { RiSearchLine } from "@/shared/ui/lucide-icons"
import { useState, type FormEvent, type ReactNode } from "react"
import {
  DocCanvas,
  DocDont,
  DocExample,
  DocGroup,
  DocIntro,
  DocRules,
} from "./doc-blocks"
import * as mock from "../model/form-mock"
import { FormCompare } from "./form-compare"

const RULES: [string, string][] = [
  [
    "Satu field",
    "Label di atas, jarak gap-field (8px). Hint di bawah: text-muted-foreground text-meta",
  ],
  [
    "Susunan",
    "Antar field gap-4 · berdampingan grid-cols-2 gap-3 · checkbox/switch + teks gap-2.5",
  ],
  [
    "Tinggi",
    'Semua h-8 (Input, Select, DatePicker, FileField, SegmentedControl); size="sm" h-7 di baris (Input, InputGroup, SelectTrigger)',
  ],
  [
    "Varian",
    'Baris properti: SelectTrigger variant="ghost". Combobox (Popover + Command): fieldTriggerClassName',
  ],
  [
    "Warna",
    "bg-field · border-field-border · fokus border-primary/50 + ring-focus-ring · error aria-invalid",
  ],
  [
    "Wajib / opsional",
    "Wajib: required + Simpan disabled, tanpa bintang. Opsional: (opsional) muted di label",
  ],
  [
    "Error",
    "Ditolak server per field: aria-invalid + FieldError. Lainnya toast.error",
  ],
  [
    "Tanggal / angka",
    'DateField / DatePicker / TimeSelect, bukan type="date". Uang: inputMode="decimal", bukan type="number"',
  ],
  [
    "Simpan",
    "Dialog: <form id> + DialogFooter (Batal outline, Simpan submit form=id). Enter = submit, Esc = tutup",
  ],
]

/** /ui → Form: each control in its states, then a whole form. */
export function FormTab() {
  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="form.md">
        Semua field pakai komponen di{" "}
        <code className="font-mono text-xs">components/ui</code> dan{" "}
        <code className="font-mono text-xs">components</code>; ukuran dan
        warnanya udah di dalamnya.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Sebelum / sesudah"
        note='Varian bersama (ghost, size="sm", fieldTriggerClassName), ukuran di luar skala dibuang, kotak cari di InputGroup, FieldError 13px. Kiri: kelas lama; kanan: yang jalan sekarang.'
      >
        <FormCompare />
      </DocGroup>

      <DocGroup
        title="State"
        note="Fokus digambar statis di sini; di app muncul waktu pakai keyboard (focus-visible)."
      >
        <StateGrid />
      </DocGroup>

      <DocGroup title="Teks">
        <DocExample
          title="Input dan InputGroup"
          source="components/ui/input.tsx · input-group.tsx"
        >
          <DocCanvas className="grid max-w-xl grid-cols-1 sm:grid-cols-2">
            <Field label="Nama" id="f-name">
              <Input id="f-name" placeholder="Brand Kit" />
            </Field>
            <Field label="Cari" id="f-search">
              <InputGroup>
                <InputGroupAddon>
                  <RiSearchLine />
                </InputGroupAddon>
                <InputGroupInput
                  id="f-search"
                  type="search"
                  placeholder="Cari klien"
                />
              </InputGroup>
            </Field>
            <Field label="Website" id="f-web">
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>https://</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="f-web"
                  inputMode="url"
                  placeholder="client.com"
                />
              </InputGroup>
            </Field>
            <AmountField />
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Textarea dan RichTextField"
          source="components/ui/textarea.tsx · rich-text-field.tsx"
        >
          <TextAreas />
        </DocExample>
        <DocExample
          title="Edit di tempat"
          source="components/inline-text.tsx"
          kind="real"
        >
          <InlineEdit />
        </DocExample>
      </DocGroup>

      <DocGroup title="Pilihan">
        <Choices />
      </DocGroup>

      <DocGroup title="Tanggal dan waktu">
        <Dates />
      </DocGroup>

      <DocGroup title="File">
        <Files />
      </DocGroup>

      <DocGroup title="Contoh form (dialog)">
        <DocExample
          title="Langganan baru"
          source="pola dari page-slices/finance/ui/SubscriptionDialog.tsx · clients/ui/ClientFormDialog.tsx"
          kind="spec"
        >
          <SampleForm />
        </DocExample>
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            <>
              <code className="font-mono text-xs">h-9</code>,{" "}
              <code className="font-mono text-xs">h-11 px-4</code>,{" "}
              <code className="font-mono text-xs">text-[13px]</code> di Input /
              SelectTrigger.
            </>,
            <>
              SelectTrigger / PopoverTrigger yang di-restyle manual jadi ghost
              atau field.
            </>,
            <>
              Ikon <code className="font-mono text-xs">absolute left-3</code> di
              atas Input <code className="font-mono text-xs">pl-9</code>: pakai
              InputGroup.
            </>,
            <>Bintang &quot; *&quot; di label.</>,
            <>gap-1.5 / gap-1 antara label dan field.</>,
            <>
              <code className="font-mono text-xs">type=&quot;number&quot;</code>{" "}
              atau{" "}
              <code className="font-mono text-xs">type=&quot;date&quot;</code>.
            </>,
          ]}
        />
      </DocGroup>
    </div>
  )
}

/** Label above, control, optional hint: the one field layout. */
function Field({
  label,
  id,
  optional,
  hint,
  children,
}: {
  label: string
  id?: string
  optional?: boolean
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="gap-field flex flex-col">
      <Label htmlFor={id}>
        {label}
        {optional && (
          <span className="text-muted-foreground font-normal">(opsional)</span>
        )}
      </Label>
      {children}
      {hint && <p className="text-muted-foreground text-meta">{hint}</p>}
    </div>
  )
}

const FOCUS = "border-primary/50 ring-2 ring-focus-ring"

function StateGrid() {
  const states = [
    { label: "Biasa", input: {}, cls: "" },
    { label: "Fokus", input: {}, cls: FOCUS },
    { label: "Error", input: { "aria-invalid": true }, cls: "" },
    { label: "Disabled", input: { disabled: true }, cls: "" },
  ] as const
  return (
    <div className="border-border overflow-x-auto rounded-xl border border-dashed p-5">
      <div className="grid w-max grid-cols-[6rem_repeat(4,12rem)] items-center gap-x-4 gap-y-4">
        <span />
        {states.map((s) => (
          <span key={s.label} className="text-muted-foreground text-meta">
            {s.label}
          </span>
        ))}
        <code className="font-mono text-xs">Input</code>
        {states.map((s) => (
          <Input
            key={s.label}
            aria-label={`Input ${s.label}`}
            placeholder="Placeholder"
            className={s.cls}
            {...s.input}
          />
        ))}
        <code className="font-mono text-xs">Select</code>
        {states.map((s) => (
          <Select key={s.label} disabled={"disabled" in s.input}>
            <SelectTrigger
              className={`w-full ${s.cls}`}
              aria-label={`Select ${s.label}`}
              aria-invalid={"aria-invalid" in s.input || undefined}
            >
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Opsi A</SelectItem>
            </SelectContent>
          </Select>
        ))}
        <code className="font-mono text-xs">Textarea</code>
        {states.map((s) => (
          <Textarea
            key={s.label}
            aria-label={`Textarea ${s.label}`}
            placeholder="Catatan"
            rows={2}
            className={s.cls}
            {...s.input}
          />
        ))}
        <code className="font-mono text-xs">Checkbox</code>
        {states.map((s) => (
          <span key={s.label} className="flex items-center gap-4">
            <Checkbox
              aria-label={`Checkbox ${s.label}`}
              className={s.cls}
              {...s.input}
            />
            <Checkbox
              defaultChecked
              aria-label={`Checkbox ${s.label} dicentang`}
              className={s.cls}
              {...s.input}
            />
          </span>
        ))}
        <code className="font-mono text-xs">Switch</code>
        {states.map((s) => (
          <span key={s.label} className="flex items-center gap-4">
            <Switch
              aria-label={`Switch ${s.label}`}
              className={s.cls}
              {...s.input}
            />
            <Switch
              defaultChecked
              aria-label={`Switch ${s.label} nyala`}
              className={s.cls}
              {...s.input}
            />
          </span>
        ))}
      </div>
      <div className="gap-field mt-5 flex max-w-xs flex-col">
        <Label htmlFor="f-email-err">Email</Label>
        <Input id="f-email-err" defaultValue="ayu@" aria-invalid />
        <FieldError>Format email belum benar.</FieldError>
      </div>
    </div>
  )
}

function AmountField() {
  const [currency, setCurrency] = useState("IDR")
  const [amount, setAmount] = useState("750000")
  return (
    <div className="gap-field flex flex-col">
      <Label htmlFor="f-amount">Nominal</Label>
      <div className="flex gap-2">
        <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
          <SelectTrigger className="w-24" aria-label="Mata uang">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mock.currencies.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id="f-amount"
          inputMode="decimal"
          className="tabular-nums"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
        />
      </div>
    </div>
  )
}

function TextAreas() {
  const [rich, setRich] = useState(mock.richText)
  return (
    <DocCanvas className="grid max-w-xl grid-cols-1 items-start sm:grid-cols-2">
      <Field label="Alamat" id="f-address" optional>
        <Textarea id="f-address" rows={2} placeholder="Jl. …" />
      </Field>
      <Field
        label="Deskripsi"
        hint="Klik buat edit; ketik - atau 1. buat daftar."
      >
        <RichTextField
          value={rich}
          onChange={setRich}
          aria-label="Deskripsi"
          className="text-sm"
        />
      </Field>
    </DocCanvas>
  )
}

function InlineEdit() {
  const [title, setTitle] = useState("Desain logo")
  return (
    <DocCanvas>
      <span className="flex min-w-64 text-lg">
        <InlineText
          value={title}
          onSave={setTitle}
          aria-label="Judul"
          required
        />
      </span>
      <span className="text-tertiary-foreground text-meta">
        Enter / blur simpan · Esc batal
      </span>
    </DocCanvas>
  )
}

function Choices() {
  const [role, setRole] = useState("design")
  const [scope, setScope] = useState<"all" | "mine">("all")
  const [quarter, setQuarter] = useState("2026-Q4")
  const [on, setOn] = useState(true)
  return (
    <>
      <DocExample
        title="Select"
        source="components/ui/select.tsx (overlay scrollbar)"
      >
        <DocCanvas className="grid max-w-xl grid-cols-1 sm:grid-cols-2">
          <Field label="Peran">
            <Select value={role} onValueChange={(v) => v && setRole(v)}>
              <SelectTrigger className="w-full" aria-label="Peran">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mock.roles.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Negara (list panjang, scroll)">
            <Select defaultValue="Indonesia">
              <SelectTrigger className="w-full" aria-label="Negara">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {mock.countries.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Ukuran sm (h-7, di baris)">
            <Select defaultValue="todo">
              <SelectTrigger size="sm" className="w-36" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To do</SelectItem>
                <SelectItem value="done">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </DocCanvas>
      </DocExample>
      <DocExample
        title="SegmentedControl dan QuarterFilter"
        source="components/segmented-control.tsx · quarter-filter.tsx"
      >
        <DocCanvas className="flex-col items-start">
          <SegmentedControl
            fitContent
            value={scope}
            onChange={setScope}
            items={[
              { value: "all", label: "Semua" },
              { value: "mine", label: "Punya saya" },
            ]}
          />
          <QuarterFilter
            value={quarter}
            onChange={setQuarter}
            years={[2026, 2025]}
          />
        </DocCanvas>
      </DocExample>
      <DocExample
        title="Checkbox, Switch, RadioGroup"
        source="components/ui/checkbox.tsx · switch.tsx · radio-group.tsx"
      >
        <DocCanvas className="grid max-w-xl grid-cols-1 items-start gap-6 sm:grid-cols-3">
          <div className="flex flex-col gap-2.5">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox defaultChecked />
              <span>Pakai e-Meterai</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox />
              <span>Simpan sebagai draft</span>
            </label>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Switch checked={on} onCheckedChange={setOn} />
            <span>Kirim email</span>
          </label>
          <RadioGroup defaultValue="full">
            {mock.schedules.map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2.5 text-sm"
              >
                <RadioGroupItem value={value} />
                <span>{label}</span>
              </label>
            ))}
          </RadioGroup>
        </DocCanvas>
      </DocExample>
      <DocExample
        title="Baris pengaturan"
        source="widgets/settings/ui/SettingsDialog.tsx (Row)"
        kind="spec"
      >
        <div className="max-w-xl">
          {mock.settings.map(([label, hint]) => (
            <div
              key={label}
              className="border-border flex min-h-16 items-center gap-4 border-b py-3 last:border-b-0"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm">{label}</span>
                <span className="text-muted-foreground text-meta leading-5">
                  {hint}
                </span>
              </div>
              <Switch defaultChecked aria-label={label} />
            </div>
          ))}
        </div>
      </DocExample>
    </>
  )
}

function Dates() {
  const [day, setDay] = useState("2026-11-20")
  const [time, setTime] = useState("09:30")
  const [range, setRange] = useState<DateRange | undefined>()
  return (
    <DocExample
      title="DateField, DateRangePicker, TimeSelect"
      source="components/date-field.tsx · date-picker.tsx · time-select.tsx"
    >
      <DocCanvas className="grid max-w-2xl grid-cols-1 items-start sm:grid-cols-3">
        <Field label="Tanggal" id="f-day">
          <DateField id="f-day" value={day} onChange={setDay} />
        </Field>
        <Field label="Periode">
          <DateRangePicker
            value={range}
            onChange={setRange}
            aria-label="Periode"
          />
        </Field>
        <Field label="Jam">
          <TimeSelect value={time} onValueChange={setTime} />
        </Field>
      </DocCanvas>
    </DocExample>
  )
}

function Files() {
  const [file, setFile] = useState<File | null>(null)
  return (
    <>
      <DocExample
        title="FileField (di form)"
        source="components/file-field.tsx"
      >
        <DocCanvas className="max-w-md">
          <div className="flex w-full flex-col gap-2">
            <Label>QR pembayaran</Label>
            <FileField accept="image/*" onChange={() => {}} />
          </div>
        </DocCanvas>
      </DocExample>
      <DocExample
        title="FileDropCanvas (dialog upload, panel kiri)"
        source="components/file-drop-canvas.tsx"
      >
        <div className="h-64 max-w-xl">
          <FileDropCanvas
            file={file}
            labels={mock.dropLabels}
            onPick={(files) => setFile(files?.[0] ?? null)}
            onClear={() => setFile(null)}
            className="h-full"
          />
        </div>
      </DocExample>
    </>
  )
}

function SampleForm() {
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    window.setTimeout(() => setSaving(false), 1400)
  }
  return (
    <div className="bg-popover flex max-w-[27.5rem] flex-col rounded-3xl shadow-(--elev-5)">
      <div className="px-5 pt-5">
        <p className="text-sm font-medium">Langganan baru</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Tagihan rutin tim, dicatat di Keuangan.
        </p>
      </div>
      <form
        id="ui-sub-form"
        onSubmit={submit}
        className="flex flex-col gap-4 px-5 pt-4 pb-1"
      >
        <Field label="Nama" id="ui-sub-name">
          <Input
            id="ui-sub-name"
            required
            placeholder="Figma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Siklus">
            <Select defaultValue="monthly">
              <SelectTrigger className="w-full" aria-label="Siklus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Bulanan</SelectItem>
                <SelectItem value="yearly">Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Mulai">
            <DateField
              value="2026-11-01"
              onChange={() => {}}
              aria-label="Mulai"
            />
          </Field>
        </div>
        <Field
          label="Catatan"
          id="ui-sub-notes"
          optional
          hint="Cuma kelihatan buat tim keuangan."
        >
          <Textarea id="ui-sub-notes" rows={2} />
        </Field>
      </form>
      <div className="flex flex-col-reverse gap-2 px-5 pt-4 pb-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline">
          Batal
        </Button>
        <Button
          type="submit"
          form="ui-sub-form"
          disabled={saving || !name.trim()}
        >
          {saving && <Spinner data-icon="inline-start" />}
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </div>
  )
}

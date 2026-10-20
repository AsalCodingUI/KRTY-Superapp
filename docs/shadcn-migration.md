# Migrasi UI ke shadcn

Branch: `feat/shadcn`. Preset: `b1HXxFoPL` (style `radix-rhea`, base Radix, icon `lucide`).
Tujuan: semua UI memakai shadcn (`@/components/ui/*`) + komposit di `@/components/*`.
`src/shared/ui/*` (kit lama, tailwind-variants) akan **dihapus** setelah semua pemakaian pindah —
kecuali `src/shared/ui/lucide-icons.tsx` (re-export ikon, tetap dipakai apa adanya).

## Aturan umum

1. Import primitive dari file masing-masing: `import { Button } from "@/components/ui/button"`.
   Jangan import dari `@/shared/ui` lagi (selain `@/shared/ui/lucide-icons`).
2. **Jangan edit** file di `src/components/ui/*` (hasil generator shadcn). Kalau butuh varian baru, tanya dulu.
3. **Kerapatan (spacing) tetap seperti sekarang.** Kit lama memakai tinggi kontrol 28px:
   - Button: `size="sm"` (h-7). Ikon-only: `size="icon-sm"` (size-7). `icon-xs` lama → `icon-sm`.
   - Input / SelectTrigger: `size="sm"` di SelectTrigger, dan `className="h-7"` di `Input` bila sebelumnya 28px.
   - Jangan ubah padding/gap/margin layout halaman — hanya ganti komponennya.
4. Warna: hanya token semantik shadcn — `background, foreground, card, popover, primary, secondary,
   muted(-foreground), accent, destructive, border, input, ring, chart-1..5`, plus tambahan
   `success`, `warning`, `info` (dan `-foreground`). Kelas warna lama sudah di-codemod; kalau masih
   menemukan `*-surface-*`, `*-foreground-secondary`, `border-neutral-*` dsb, ganti sesuai tabel di bawah.
5. Gunakan `cn` dari `@/lib/utils` untuk menggabung class (bukan `cx`/`tv` dari kit lama).
6. Tetap TypeScript strict: `npx tsc --noEmit -p .` tidak boleh menambah error di file yang kamu sentuh.

## Pemetaan primitive

| Lama (`@/shared/ui`) | Baru | Catatan |
|---|---|---|
| `Button variant="primary"` | `Button` (default) | `size` default/sm/xs → `"sm"` |
| `variant="secondary"` | `variant="outline"` | |
| `variant="tertiary"` / `"ghost"` | `variant="ghost"` | |
| `variant="tertiaryInverse"` | `variant="ghost"` + `className="text-primary-foreground hover:bg-white/10"` | |
| `variant="destructive"` | `variant="destructive"` | |
| `isLoading`, `loadingText` | `disabled={isLoading}` + `{isLoading && <Spinner data-icon="inline-start" />}` + teks | `Spinner` dari `@/components/ui/spinner` |
| `Badge` default/`zinc` | `variant="secondary"` | `size` dihapus (md/lg → tambah `className` bila perlu) |
| `info` / `success` / `warning` / `error` | `info` / `success` / `warning` / `destructive` | |
| `start` / `continue` / `stop` | `success` / `info` / `destructive` + `className="font-semibold uppercase"` | |
| `Card` (div `rounded-lg border p-4`) | `Card` + `CardContent` … atau `Card className="p-4 gap-0"` jika isinya bebas | pertahankan padding 16px |
| `TextInput` | `Input`; ikon/prefix/suffix → `InputGroup` + `InputGroupAddon`; `label`/`errorMessage`/`helperText` → `Field`, `FieldLabel`, `FieldError`, `FieldDescription` | `error` → `aria-invalid` |
| `Textarea`, `Label`, `Checkbox`, `Switch`, `Slider`, `RadioGroup` | nama sama di `@/components/ui/<nama>` | Slider: `value`/`onValueChange` tetap array |
| `Select*` | nama sama | `SelectTrigger size="sm"` |
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`, `DialogClose` | nama sama | |
| `DialogBody` | `<div className="…">` (pertahankan padding lama) | |
| `DialogCloseButton` | hapus — `DialogContent` sudah punya tombol close (`showCloseButton`) | |
| `Drawer*` (panel samping) | `Sheet*` (`SheetContent side="right"`) | `DrawerBody` → `<div className="flex-1 overflow-y-auto px-4">` |
| `Tabs*`, `Accordion*`, `Popover*`, `DropdownMenu*` | nama sama | `DropdownMenuSubMenuContent` → `DropdownMenuSubContent` |
| `Tooltip content="…"` (satu komponen) | `<Tooltip><TooltipTrigger asChild>…</TooltipTrigger><TooltipContent>…</TooltipContent></Tooltip>` | |
| `Skeleton` | `Skeleton` | |
| `Spinner size="sm/md/lg"` | `Spinner className="size-4 / size-8 / size-12"` | |
| `ProgressBar value` | `Progress value` | |
| `Divider` | `Separator` | |
| `Avatar src initials size color` | `Avatar` + `AvatarImage` + `AvatarFallback` | ukuran via `className="size-7"` dst |
| `Table`, `TableBody`, `TableRow`, `TableCell` | nama sama | |
| **`TableHead`** (= `<thead>`) | **`TableHeader`** | hati-hati, nama tertukar |
| **`TableHeaderCell`** (= `<th>`) | **`TableHead`** | |
| `TableRoot` | hapus (Table shadcn sudah membungkus overflow) | |
| `ToastProvider` | sudah diganti `Toaster` di `app/layout.tsx` | `toast()` tetap dari `sonner` |

## Komposit (`@/components/*`) — API sama dengan versi lama

| Lama | Import baru |
|---|---|
| `EmptyState` | `import { EmptyState } from "@/components/empty-state"` |
| `ConfirmDialog`, `useConfirmDialog` | `@/components/confirm-dialog` |
| `TableSection` | `@/components/table-section` |
| `DataTable`, `DataTableColumnHeader`, `DataTablePagination`, `DataTableViewOptions`, `DataTableRowActions`, `DataTableFilterbar`, `DataTableBulkEditor` | `@/components/data-table` |
| `QuarterFilter`, `QuarterFilterValue` (type) | `@/components/quarter-filter` |
| `DatePicker`, `DateRangePicker` | `@/components/date-picker` |
| `TimeSelect` | `@/components/time-select` |
| `SegmentedControl` | `@/components/segmented-control` |
| `TabNavigation`, `TabNavigationLink` | `@/components/tab-navigation` |
| `AvatarGroup`, `AvatarOverflow` | `@/components/avatar-group` |
| `CategoryBar` | `@/components/charts/category-bar` |
| `RadarChart` | `@/components/charts/radar-chart` |
| `QueryProvider` | `@/components/providers/query-provider` (default export) |

## Tabel warna lama → token

| Lama | Baru |
|---|---|
| `foreground-primary`, `content` | `foreground` |
| `foreground-secondary`, `content-subtle` | `muted-foreground` |
| `foreground-tertiary`, `content-muted` | `muted-foreground/70` |
| `foreground-disable` | `muted-foreground/50` |
| `foreground-on-color` | `primary-foreground` |
| `*-brand*` | `primary` (`-light` → `primary/10` bg, `primary/30` border) |
| `*-danger*` | `destructive` (`-light`/`-subtle` → `/10` bg, `/30` border) |
| `*-success*`, `*-warning*` | `success`, `warning` (sama polanya) |
| `surface`, `surface-neutral-primary` | `card` |
| `surface-neutral-secondary` | `muted` |
| `surface-state-neutral-light-hover`, `hover` | `accent` |
| `border-neutral-*`, `divide-neutral-*` | `border-border`, `divide-border` |
| `chart-4/5/6` (kategori ungu/pink/cyan) | `purple-*`, `pink-*`, `cyan-*` Tailwind |

## Fase 2 — Base UI (`components.json` style `base-rhea`, paket `@base-ui/react`)

Semua primitive di `src/components/ui/*` sekarang memakai **Base UI**, bukan Radix. Perbedaan API yang sering muncul:

| Radix (lama) | Base UI (baru) |
|---|---|
| `<XTrigger asChild><Button/></XTrigger>` | `<XTrigger render={<Button />} />` (anak dari elemen lama dipindah jadi children elemen di `render`, atau tetap jadi children trigger bila trigger sendiri sudah elemen yang benar) |
| `<Button asChild><Link href="/x">…</Link></Button>` | `<Button render={<Link href="/x" />}>…</Button>` (`nativeButton={false}` bila render bukan `<button>`) |
| `Select onValueChange={(v: string) => …}` | callback menerima `string \| null` → `onValueChange={(v) => v !== null && setX(v)}` atau `setX(v ?? "")` |
| `Select` multiple / generic | `value`/`defaultValue` bertipe `T \| null` |
| `Checkbox onCheckedChange={(c: boolean \| "indeterminate") => …}` | `(checked: boolean) => …`; prop `indeterminate` terpisah |
| `Slider value={[n]} onValueChange={(v: number[]) => …}` | `value` bisa `number \| readonly number[]` → normalisasi `Array.isArray(v) ? v[0] : v` |
| `Accordion type="single" collapsible defaultValue="a"` | `Accordion defaultValue={["a"]}` (selalu array; multiple via `multiple`) |
| `PopoverContent onOpenAutoFocus={(e) => e.preventDefault()}` | hapus; gunakan `initialFocus={false}` pada `PopoverContent`/Popup bila tersedia |
| `onPointerDownOutside` | hapus atau pakai `onOpenChange(open, details)` |
| `PopoverAnchor` | tidak ada — pakai `PopoverTrigger` atau posisikan via `anchor` prop pada Positioner |
| `DialogClose asChild` | `<DialogClose render={<Button variant="outline" />}>Batal</DialogClose>` |

Baca tipe komponen di `src/components/ui/<nama>.tsx` dan `node_modules/@base-ui/react` bila ragu. Jangan edit `src/components/ui/*`.

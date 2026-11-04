"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { ImageLightbox } from "@/components/image-lightbox"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { FilePreview } from "@/page-slices/projects/ui/workspace/FilePreview"
import { RowMenu } from "@/page-slices/projects/ui/workspace/row-menu"
import { ContextTarget, openAppSearch } from "@/shared/context-menu"
import {
  RiDeleteBinLine,
  RiFileCopyLine,
  RiMoreFill,
  RiPencilLine,
  RiSearchLine,
} from "@/shared/ui/lucide-icons"
import { Copy, Pencil, Trash2 } from "lucide-react"
import dynamic from "next/dynamic"
import { useState } from "react"
import { toast } from "sonner"
import * as mock from "../model/overlay-mock"
import {
  DocCanvas,
  DocDont,
  DocExample,
  DocGroup,
  DocIntro,
  DocRules,
} from "./doc-blocks"

// The viewer pulls pdf.js, docx and the editor: loaded on first open, as in
// the app (ProjectLibrary, PortalDocuments).
const FileViewer = dynamic(
  () => import("@/components/file-viewer").then((m) => m.FileViewer),
  { ssr: false },
)

/** True from the first time `open` is true onwards (mount once, keep). */
function useMountOnce(open: boolean) {
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  return mounted
}

const RULES: [string, string][] = [
  [
    "Struktur dialog",
    "DialogHeader (judul 15px) → isi (scroll-pane, satu-satunya yang scroll) → DialogFooter. Satu permukaan, tanpa garis",
  ],
  [
    "Ukuran",
    "Default 440px · form sm:max-w-[35rem] · detail sm:max-w-2xl · dokumen/viewer bare + sm:max-w-5xl",
  ],
  [
    "Tombol footer",
    "Batal (outline) dulu, aksi utama terakhir; hapus = variant destructive",
  ],
  [
    "Konfirmasi",
    "Hapus / buang = ConfirmDialog variant destructive; di menu klik kanan cukup confirm: true",
  ],
  [
    "Sheet kanan",
    "Melayang 8px di dalam halaman, tanpa gelap di belakang, sm:max-w-md, header bar + isi scroll-pane",
  ],
  [
    "Popover / menu",
    "Popover w-72 p-4 rounded-2xl; menu min-w-44, item hapus paling bawah setelah separator",
  ],
  ["Tooltip", "Cuma nama tombol ikon; satu TooltipProvider global"],
  [
    "HP",
    "Di bawah 640px semua Dialog jadi sheet dari bawah (bisa ditarik); AlertDialog tanpa tarik",
  ],
  [
    "Ringan",
    "Dialog berat = next/dynamic, dipasang pas pertama dibuka lalu dibiarkan; tanpa blur di overlay",
  ],
  [
    "URL",
    "Dialog yang bisa dibagikan simpan di URL: ?task= ?report= ?settings= (linkKey), tutup = hapus param",
  ],
]

/** /ui → Overlay: every kind of popup, live, on mock content. */
export function OverlayTab() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [unsavedOpen, setUnsavedOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const viewerMounted = useMountOnce(viewerIndex !== null)
  const [pinned, setPinned] = useState(true)
  const done = (what: string) => () => {
    toast.success(what)
  }

  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="overlay.md">
        Semua yang muncul di atas halaman: dialog, konfirmasi, sheet, popover,
        menu, klik kanan, tooltip, pencarian, lightbox dan viewer file.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Dialog"
        note="Header, isi, footer diatur DialogSections; ukuran cuma lewat sm:max-w-*."
      >
        <DocExample
          title="Ukuran dialog"
          source="components/ui/dialog.tsx · dialog-sections.tsx"
        >
          <DocCanvas>
            <SampleDialog label="Default (440px)" />
            <SampleDialog label="Form (35rem)" className="sm:max-w-[35rem]" />
            <SampleDialog label="Detail (2xl)" className="sm:max-w-2xl" long />
            <DocumentDialog />
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Konfirmasi hapus"
          source="components/confirm-dialog.tsx"
        >
          <DocCanvas>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              <RiDeleteBinLine data-icon="inline-start" />
              Hapus komentar
            </Button>
            <Button variant="outline" onClick={() => setUnsavedOpen(true)}>
              Tutup dengan perubahan
            </Button>
          </DocCanvas>
        </DocExample>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Hapus komentar ini?"
          confirmText="Hapus"
          variant="destructive"
          onConfirm={() =>
            new Promise<void>((resolve) =>
              setTimeout(() => {
                toast.success("Komentar dihapus (contoh)")
                resolve()
              }, 700),
            )
          }
        />
        <AlertDialog open={unsavedOpen} onOpenChange={setUnsavedOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Ada perubahan yang belum disimpan
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setUnsavedOpen(false)}>
                Batal
              </Button>
              <Button variant="outline" onClick={() => setUnsavedOpen(false)}>
                Buang
              </Button>
              <Button onClick={() => setUnsavedOpen(false)}>Simpan</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DocGroup>

      <DocGroup
        title="Sheet kanan"
        note="Melayang di dalam halaman, halaman tetap kelihatan (tanpa gelap)."
      >
        <DocExample
          title="Detail di sheet"
          source="components/ui/sheet.tsx · widgets/profile/ui/ProfileSheet.tsx"
        >
          <DocCanvas>
            <Sheet>
              <SheetTrigger render={<Button variant="outline" />}>
                Buka sheet
              </SheetTrigger>
              <SheetContent className="w-full gap-0 sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Brand Kit — Sinar Makmur</SheetTitle>
                </SheetHeader>
                <div className="scroll-pane pane-px-5 flex min-h-0 flex-1 flex-col gap-8 pt-5 pb-6">
                  <dl className="flex flex-col gap-3 text-sm">
                    {mock.sheetFacts.map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-muted-foreground text-sm">
                    Isi sheet scroll sendiri (scroll-pane pane-px-5); header dan
                    footer tetap.
                  </p>
                </div>
                <SheetFooter>
                  <Button variant="outline">Tutup project</Button>
                  <Button>Buka project</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Popover, menu, tooltip">
        <DocExample title="Popover" source="components/ui/popover.tsx">
          <DocCanvas>
            <Popover>
              <PopoverTrigger render={<Button variant="outline" />}>
                Info periode
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>Q4 2026</PopoverTitle>
                  <PopoverDescription>
                    Penilaian dikunci 31 Desember. Setelah itu skor nggak bisa
                    diubah.
                  </PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Menu dari tombol, menu baris"
          source="components/ui/dropdown-menu.tsx · projects/ui/workspace/row-menu.tsx"
        >
          <DocCanvas>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="icon" aria-label="Aksi" />
                }
              >
                <RiMoreFill />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuLabel>Project</DropdownMenuLabel>
                <DropdownMenuItem onClick={done("Ubah (contoh)")}>
                  <RiPencilLine />
                  Ubah
                </DropdownMenuItem>
                <DropdownMenuItem onClick={done("Disalin (contoh)")}>
                  <RiFileCopyLine />
                  Duplikat
                </DropdownMenuItem>
                <DropdownMenuCheckboxItem
                  checked={pinned}
                  onCheckedChange={setPinned}
                >
                  Sematkan
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={done("Dihapus (contoh)")}
                >
                  <RiDeleteBinLine />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="group/row border-border flex h-12 w-72 items-center justify-between rounded-lg border px-3 text-sm">
              Arahkan ke baris ini
              <RowMenu
                label="Aksi baris"
                items={[
                  { label: "Ubah", onSelect: done("Ubah (contoh)") },
                  {
                    label: "Hapus",
                    destructive: true,
                    separatorBefore: true,
                    onSelect: done("Dihapus (contoh)"),
                  },
                ]}
              />
            </div>
          </DocCanvas>
        </DocExample>
        <DocExample title="Tooltip" source="components/ui/tooltip.tsx">
          <DocCanvas>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="Ubah" />
                }
              >
                <RiPencilLine />
              </TooltipTrigger>
              <TooltipContent>Ubah</TooltipContent>
            </Tooltip>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup
        title="Klik kanan"
        note="Klik kanan kotak di bawah (atau Shift+F10 saat fokus)."
      >
        <DocExample
          title="ContextTarget"
          source="shared/context-menu (lihat index.ts) · projects/ui/ProjectMenu.tsx"
        >
          <DocCanvas>
            <ContextTarget
              type="ui-docs-sample"
              id="mock-project"
              label="Brand Kit — Sinar Makmur"
              items={() => [
                {
                  id: "edit",
                  label: "Ubah",
                  icon: Pencil,
                  onSelect: done("Ubah (contoh)"),
                },
                {
                  id: "copy",
                  label: "Duplikat",
                  icon: Copy,
                  shortcut: "Mod+D",
                  onSelect: done("Disalin (contoh)"),
                },
                {
                  id: "del",
                  label: "Hapus",
                  icon: Trash2,
                  destructive: true,
                  confirm: true,
                  onSelect: done("Dihapus (contoh)"),
                },
              ]}
            >
              <div
                tabIndex={0}
                className="bg-muted dark:bg-muted/40 focus-visible:ring-focus-ring flex h-24 w-72 items-center justify-center rounded-xl text-sm outline-none focus-visible:ring-2"
              >
                Klik kanan di sini
              </div>
            </ContextTarget>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Pencarian">
        <DocExample
          title="⌘K"
          source="widgets/global-search/ui/GlobalSearch.tsx · openAppSearch()"
        >
          <DocCanvas>
            <Button variant="outline" onClick={() => openAppSearch()}>
              <RiSearchLine data-icon="inline-start" />
              Buka pencarian
            </Button>
            <Button variant="outline" onClick={() => openAppSearch("cuti")}>
              Cari “cuti”
            </Button>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Gambar dan file">
        <DocExample title="Lightbox" source="components/image-lightbox.tsx">
          <DocCanvas>
            {mock.lightboxImages.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => setLightbox(i)}
                className="cursor-zoom-in overflow-hidden rounded-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} className="h-20 w-auto" />
              </button>
            ))}
          </DocCanvas>
        </DocExample>
        <ImageLightbox
          images={mock.lightboxImages}
          index={lightbox}
          onIndex={setLightbox}
        />
        <DocExample
          title="Viewer file (lazy)"
          source="components/file-viewer.tsx (next/dynamic)"
        >
          <DocCanvas>
            <Button variant="outline" onClick={() => setViewerIndex(0)}>
              Buka file
            </Button>
          </DocCanvas>
        </DocExample>
        {viewerMounted && (
          <FileViewer
            items={mock.viewerItems}
            index={viewerIndex}
            onIndexChange={setViewerIndex}
            onClose={() => setViewerIndex(null)}
          />
        )}
        <DocExample
          title="Thumbnail file"
          source="page-slices/projects/ui/workspace/FilePreview.tsx"
        >
          <DocCanvas>
            {mock.previewFiles.map((f) => (
              <FilePreview
                key={f.name}
                file={f}
                url={f.url}
                className="aspect-[4/3] w-48 rounded-xl"
              />
            ))}
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            "DialogContent dengan p-6 / header bergaris sendiri, atau isi tanpa scroll-pane",
            "Lebar baru (sm:max-w-[600px], sm:max-w-lg): pilih dari tabel ukuran",
            "window.confirm() atau dialog konfirmasi buatan sendiri",
            "Dialog berat di-import langsung ke halaman",
            "backdrop-blur di overlay, gelap di belakang sheet kanan",
            "TooltipProvider kedua, atau title= untuk menamai tombol ikon",
            "Primitive @base-ui/react langsung di halaman",
          ]}
        />
      </DocGroup>
    </div>
  )
}

/** A form dialog at a given width (mock fields). */
function SampleDialog({
  label,
  className,
  long = false,
}: {
  label: string
  className?: string
  long?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        {label}
      </DialogTrigger>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>Ajukan cuti</DialogTitle>
          <DialogDescription>Atasan kamu dapat notifikasi.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`${label}-reason`}>Alasan</FieldLabel>
            <Input id={`${label}-reason`} placeholder="Liburan keluarga" />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${label}-days`}>Jumlah hari</FieldLabel>
            <Input id={`${label}-days`} type="number" defaultValue={2} />
          </Field>
          {long &&
            Array.from({ length: 8 }, (_, i) => (
              <p key={i} className="text-muted-foreground text-sm">
                Baris isi {i + 1}: isi yang panjang scroll di bagian tengah,
                header dan footer tetap di tempat.
              </p>
            ))}
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={() => setOpen(false)}>Kirim</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The document-dialog shell (report, note, policy, file viewer). */
function DocumentDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Dokumen (5xl, bare)
      </DialogTrigger>
      <DialogContent
        bare
        className="flex h-[min(56rem,92svh)] w-full flex-col overflow-hidden p-0 sm:max-w-5xl"
      >
        <header className="flex h-14 shrink-0 items-center gap-2 border-b pr-14 pl-5">
          <DialogTitle className="truncate text-sm font-medium">
            Laporan mingguan — 26 Oktober 2026
          </DialogTitle>
        </header>
        <div className="scroll-pane pane-px-10 flex min-h-0 flex-1 flex-col gap-4 py-8">
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i} className="text-foreground/90 text-[15px] leading-7">
              Paragraf {i + 1}. Dialog dokumen bare menyusun isinya sendiri:
              header 56px dengan garis bawah, isi scroll-pane, tanpa footer.
            </p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

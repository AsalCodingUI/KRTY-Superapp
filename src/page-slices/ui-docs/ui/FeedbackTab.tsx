"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { EmptyValue, orEmpty } from "@/components/empty-value"
import { GroupedList } from "@/components/grouped-list"
import { PanelEmpty } from "@/components/panel"
import { StatusPage } from "@/components/status-page"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { playNotificationSound } from "@/shared/lib/notification-sound"
import {
  RiArrowLeftLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiFileTextLine,
  RiNotification3Line,
  RiSearchLine,
} from "@/shared/ui/lucide-icons"
import { useState } from "react"
import { toast } from "sonner"
import * as mock from "../model/feedback-mock"
import {
  DocCanvas,
  DocDont,
  DocExample,
  DocGroup,
  DocIntro,
  DocRules,
} from "./doc-blocks"

const RULES: [string, string][] = [
  [
    "Toast",
    'Dari i18n, santai, tanpa titik. Sukses: "Klien dihapus". Gagal: "Gagal menyimpan, coba lagi". Bukan error.message',
  ],
  [
    "Kapan toast",
    "Hasil yang nggak kelihatan langsung (simpan di belakang, salin, kirim). Bukan tiap autosave",
  ],
  [
    "Kosong",
    "EmptyState: outer (garis putus) sendirian, inner di dalam list / panel / dialog",
  ],
  ["Nilai kosong", "EmptyValue / orEmpty(), bukan - atau 0"],
  [
    "Hapus",
    "ConfirmDialog destructive dulu. Judul = pertanyaan + objek. Nggak pakai window.confirm",
  ],
  [
    "Loading",
    "Route: skeleton bentuk halaman. Bagian: Spinner size-6 di tengah (py-16)",
  ],
  [
    "Tombol pending",
    'disabled + Spinner data-icon="inline-start", label tetap',
  ],
  [
    "Optimistic",
    "Patch cache dulu, balikin kalau gagal + toast, lalu refetch (useTaskWriter)",
  ],
  ["Belum dibaca", "Titik diam bg-primary size-2, bukan merah, bukan ping"],
  ["Suara", "Cuma notifikasi baru, lewat playNotificationSound"],
]

/**
 * /ui → Feedback: toasts, empty states, error pages, confirm before
 * deleting, loading and pending states, unread markers. Every one is the
 * real component on mock copy.
 */
export function FeedbackTab() {
  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="feedback.md">
        Cara aplikasi ngasih tahu apa yang terjadi: toast, kosong, error,
        konfirmasi, loading, dan tanda belum dibaca.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Toast"
        note="Satu Toaster di kanan bawah, selalu gelap. Pencet buat nyoba."
      >
        <ToastDemo />
      </DocGroup>

      <DocGroup title="Kosong">
        <div className="grid gap-8 md:grid-cols-2">
          <DocExample
            title='EmptyState placement="outer"'
            source="components/empty-state.tsx"
          >
            <EmptyState
              icon={<RiFileTextLine />}
              title={mock.empty.outerTitle}
              description={mock.empty.outerDescription}
              action={{ label: mock.empty.outerAction, onClick: () => {} }}
            />
          </DocExample>
          <DocExample
            title='EmptyState placement="inner" (di dalam list)'
            source="components/empty-state.tsx"
          >
            <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
              <div className="bg-background rounded-lg">
                <EmptyState
                  placement="inner"
                  icon={<RiCheckboxCircleLine />}
                  title={mock.empty.innerTitle}
                  description={mock.empty.innerDescription}
                />
              </div>
            </div>
          </DocExample>
          <DocExample
            title="Hasil filter kosong (beda pesan)"
            source="components/empty-state.tsx"
          >
            <EmptyState
              placement="inner"
              icon={<RiSearchLine />}
              title={mock.empty.filteredTitle}
              description={mock.empty.filteredDescription}
            />
          </DocExample>
          <DocExample
            title="PanelEmpty (panel kecil)"
            source="components/panel.tsx"
          >
            <div className="border-border flex min-h-40 rounded-xl border">
              <PanelEmpty
                icon={<RiNotification3Line />}
                title="Belum ada notifikasi"
                description="Yang baru muncul di sini."
              />
            </div>
          </DocExample>
        </div>
        <DocExample title="EmptyValue" source="components/empty-value.tsx">
          <div className="stat-strip">
            {mock.stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <span className="text-muted-foreground text-[13px]">
                  {s.label}
                </span>
                <span className="text-heading text-2xl font-medium tabular-nums">
                  {orEmpty(s.value)}
                </span>
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-[13px]">
                Di sel tabel
              </span>
              <span className="text-sm">
                <EmptyValue />
              </span>
            </div>
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup
        title="Error dan 404"
        note="error.tsx pakai ErrorView, not-found.tsx pakai NotFoundView; dua-duanya StatusPage."
      >
        <DocExample
          title="StatusPage"
          source="components/status-page.tsx · error-view.tsx · not-found-view.tsx"
        >
          <div className="border-border overflow-hidden rounded-xl border">
            <StatusPage
              className="min-h-0 py-10"
              code={mock.status.code}
              title={mock.status.title}
              description={mock.status.description}
              detail={mock.status.detail}
              actions={
                <>
                  <Button variant="outline">
                    <RiArrowLeftLine data-icon="inline-start" />
                    Kembali
                  </Button>
                  <Button>Ke dashboard</Button>
                </>
              }
            />
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup
        title="Konfirmasi sebelum hapus"
        note="Dialognya nunggu onConfirm selesai (spinner), baru nutup."
      >
        <ConfirmDemo />
      </DocGroup>

      <DocGroup title="Loading">
        <div className="grid gap-8 md:grid-cols-2">
          <DocExample title="Spinner" source="components/ui/spinner.tsx">
            <DocCanvas>
              <Spinner className="size-3.5" />
              <Spinner />
              <Spinner className="size-6" />
              <span className="text-muted-foreground text-[13px]">
                inline 3.5 / 4 · bagian 6
              </span>
            </DocCanvas>
          </DocExample>
          <DocExample
            title="Bagian yang lagi dimuat"
            source="flex justify-center py-16"
          >
            <div className="border-border rounded-xl border border-dashed">
              <div className="flex justify-center py-16">
                <Spinner className="size-6" />
              </div>
            </div>
          </DocExample>
        </div>
        <DocExample
          title="Skeleton route (bentuk halaman)"
          source="components/ui/skeleton.tsx · app/(main)/*/loading.tsx"
        >
          <ListSkeleton />
        </DocExample>
        <PendingDemo />
      </DocGroup>

      <DocGroup title="Belum dibaca dan jumlah">
        <div className="grid gap-8 md:grid-cols-2">
          <DocExample
            title="Titik dan angka"
            source="components/nav-main.tsx (NavDot, NavBadge)"
            kind="spec"
          >
            <DocCanvas>
              <span className="flex items-center gap-2 text-sm">
                Tugas saya
                <span aria-hidden className="bg-primary size-2 rounded-full" />
              </span>
              <span className="bg-muted text-muted-foreground relative flex size-8 items-center justify-center rounded-lg">
                <RiNotification3Line className="size-4" />
                <span className="bg-primary ring-background absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2" />
              </span>
              <span className="flex items-center gap-2 text-sm">
                Approval
                <span className="bg-foreground/[0.08] text-foreground/70 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums">
                  12
                </span>
              </span>
            </DocCanvas>
          </DocExample>
          <DocExample
            title="Suara notifikasi"
            source="shared/lib/notification-sound.ts"
          >
            <DocCanvas>
              <Button
                variant="outline"
                size="sm"
                onClick={() => playNotificationSound()}
              >
                <RiNotification3Line data-icon="inline-start" />
                Putar suara pilihan
              </Button>
              <span className="text-muted-foreground text-[13px]">
                Pilihannya di Pengaturan → Notifikasi
              </span>
            </DocCanvas>
          </DocExample>
        </div>
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            'toast.success("Berhasil!"), teks langsung di kode, toast.error(error.message)',
            'Titik di akhir toast, atau tiga versi "gagal menyimpan"',
            'Blok kosong bikinan sendiri, atau - / 0 buat "belum ada data"',
            "Langsung hapus di klik pertama, atau window.confirm",
            '{saving ? "Menyimpan…" : "Simpan"} (pakai spinner, label tetap)',
            "Skeleton yang nggak mirip halamannya (tombol h-9 rounded-md)",
            'Titik merah yang ping terus buat "belum dibaca"',
          ]}
        />
      </DocGroup>
    </div>
  )
}

function ToastDemo() {
  const upload = () => {
    const id = toast.loading(mock.toasts.uploading)
    setTimeout(() => toast.success(mock.toasts.uploaded, { id }), 1400)
  }
  return (
    <DocExample
      title="sonner"
      source="components/ui/sonner.tsx · toast from sonner"
    >
      <DocCanvas>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success(mock.toasts.success)}
        >
          Sukses
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success(mock.toasts.copied)}
        >
          Disalin
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.error(mock.toasts.error)}
        >
          Gagal
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast(mock.toasts.info)}
        >
          Info
        </Button>
        <Button variant="outline" size="sm" onClick={upload}>
          Loading → selesai
        </Button>
      </DocCanvas>
    </DocExample>
  )
}

function ConfirmDemo() {
  const [open, setOpen] = useState(false)
  return (
    <DocExample
      title="ConfirmDialog destructive"
      source="components/confirm-dialog.tsx"
    >
      <DocCanvas>
        <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
          <RiDeleteBinLine data-icon="inline-start" />
          Hapus komentar
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title={mock.confirm.title}
          description={mock.confirm.description}
          confirmText={mock.confirm.confirmText}
          cancelText={mock.confirm.cancelText}
          variant="destructive"
          onConfirm={async () => {
            await new Promise((r) => setTimeout(r, 900))
            toast.success(mock.confirm.done)
          }}
        />
      </DocCanvas>
    </DocExample>
  )
}

function PendingDemo() {
  const [saving, setSaving] = useState(false)
  const save = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1500)
  }
  return (
    <DocExample
      title="Tombol pending"
      source="components/ui/button.tsx · ui/spinner.tsx"
    >
      <DocCanvas>
        <Button variant="outline" disabled={saving}>
          Batal
        </Button>
        <Button disabled={saving} onClick={save}>
          {saving && <Spinner data-icon="inline-start" />}
          Simpan
        </Button>
        <span className="text-muted-foreground text-[13px]">
          Label nggak berubah, lebar tombol nggak loncat
        </span>
      </DocCanvas>
    </DocExample>
  )
}

/** A list page's loading.tsx: title row, group pill, rows. */
function ListSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pt-6 pb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
      <GroupedList hover={false}>
        <Skeleton className="mb-0.5 h-10 w-full rounded-lg" />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="gutter-x flex min-h-14 items-center gap-3 py-2"
          >
            <Skeleton className="size-5 rounded-[5px]" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </GroupedList>
    </div>
  )
}

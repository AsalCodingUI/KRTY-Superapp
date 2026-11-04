"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { UnsavedChangesDialog } from "@/components/unsaved-changes-dialog"
import { Button } from "@/components/ui/button"
import {
  dialogWidth,
  documentDialogClassName,
  searchDialogClassName,
} from "@/components/ui/dialog-sections"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { BeforeAfter } from "./compare"

/**
 * /ui → Overlay, "Sebelum / sesudah": the old widths, heights and
 * hand-made prompts left, the shared constants and components right, then
 * the sizes read from the page.
 */

/** A width bar, 1rem = 4px, labelled with the class. */
function WidthBar({ rem, label }: { rem: number; label: string }) {
  return (
    <div className="flex w-full items-center gap-3">
      <span
        className="bg-primary/25 border-primary/40 rounded-chip h-5 shrink-0 border"
        style={{ width: rem * 4 }}
      />
      <code className="text-caption font-mono">{label}</code>
      <span className="text-tertiary-foreground text-meta ml-auto tabular-nums">
        {rem * 16}px
      </span>
    </div>
  )
}

/** A height bar, 1rem = 1.5px. */
function HeightBar({ rem, label }: { rem: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="bg-primary/25 border-primary/40 rounded-chip w-10 border"
        style={{ height: rem * 1.5 }}
      />
      <code className="text-micro font-mono">{label}</code>
    </div>
  )
}

/** A static picture of an alert dialog: title, optional text, buttons. */
function MiniPrompt({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="bg-popover shadow-dialog rounded-dialog flex w-full max-w-80 flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <span className="text-heading text-[15px] font-medium">{title}</span>
        {description && (
          <span className="text-muted-foreground text-sm">{description}</span>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-2">{children}</div>
    </div>
  )
}

export function OverlayCompare() {
  const [unsaved, setUnsaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label="Lebar dialog: 6 lebar di luar tabel → 3 dari dialogWidth"
        before={
          <div className="flex w-full flex-col gap-2">
            <WidthBar rem={24} label="sm:max-w-sm" />
            <WidthBar rem={28} label="sm:max-w-md" />
            <WidthBar rem={28} label="sm:max-w-[28rem]" />
            <WidthBar rem={32} label="sm:max-w-lg" />
            <WidthBar rem={36} label="sm:max-w-xl" />
            <WidthBar rem={56} label="sm:max-w-4xl" />
          </div>
        }
        after={
          <div className="flex w-full flex-col gap-2">
            <WidthBar rem={27.5} label="default" />
            <WidthBar rem={35} label="dialogWidth.form" />
            <WidthBar rem={42} label="dialogWidth.detail" />
          </div>
        }
      />
      <BeforeAfter
        label="Dialog dokumen: 4 tinggi di 10 file → documentDialogClassName"
        before={
          <div className="flex items-end gap-4">
            <HeightBar rem={52} label="52rem" />
            <HeightBar rem={56} label="56rem" />
            <HeightBar rem={60} label="60rem" />
            <HeightBar rem={58} label="88svh" />
          </div>
        }
        after={
          <div className="flex items-end gap-4">
            <HeightBar rem={56} label="56rem · 92svh" />
          </div>
        }
      />
      <BeforeAfter
        label="Tutup dengan perubahan: 4 AlertDialog buatan sendiri → UnsavedChangesDialog"
        before={
          <>
            <MiniPrompt title="Simpan perubahan?">
              <Button variant="outline">Batal</Button>
              <Button variant="outline">Jangan simpan</Button>
              <Button>Simpan</Button>
            </MiniPrompt>
            <MiniPrompt
              title="Simpan sebagai draf?"
              description="Ada perubahan yang belum disimpan."
            >
              <Button
                variant="ghost"
                className="text-destructive-ink hover:text-destructive-ink mr-auto"
              >
                Buang
              </Button>
              <Button variant="outline">Lanjut edit</Button>
              <Button>Simpan draf</Button>
            </MiniPrompt>
          </>
        }
        after={
          <>
            <MiniPrompt title="Simpan perubahan?">
              <Button variant="outline">Batal</Button>
              <Button variant="outline">Jangan simpan</Button>
              <Button disabled>
                <Spinner data-icon="inline-start" />
                Simpan
              </Button>
            </MiniPrompt>
            <Button variant="outline" onClick={() => setUnsaved(true)}>
              Buka yang asli
            </Button>
          </>
        }
      />
      <UnsavedChangesDialog
        open={unsaved}
        onOpenChange={setUnsaved}
        saving={saving}
        onDiscard={() => setUnsaved(false)}
        onSave={() =>
          new Promise<void>((resolve) => {
            setSaving(true)
            setTimeout(() => {
              setSaving(false)
              setUnsaved(false)
              resolve()
            }, 700)
          })
        }
      />
      <BeforeAfter
        label="Keluarkan anggota yang sudah dinilai: window.confirm → ConfirmDialog"
        before={
          <Button
            variant="outline"
            onClick={() =>
              window.confirm(
                "Rani sudah punya nilai di project ini. Mengeluarkannya akan menghapus nilainya. Lanjut?",
              )
            }
          >
            Keluarkan Rani
          </Button>
        }
        after={
          <Button variant="outline" onClick={() => setConfirm(true)}>
            Keluarkan Rani
          </Button>
        }
      />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Keluarkan Rani?"
        description="Dia sudah punya nilai di project ini. Nilainya ikut terhapus."
        confirmText="Keluarkan"
        variant="destructive"
        onConfirm={() => undefined}
      />
      <Measured />
    </div>
  )
}

// The shell's own width classes (dialogShellClassName), then each size.
const SHELL = "max-w-[calc(100%-2rem)] sm:max-w-[27.5rem]"
const SIZES = [
  ["default", SHELL],
  ["dialogWidth.form", cn(SHELL, dialogWidth.form)],
  ["dialogWidth.detail", cn(SHELL, dialogWidth.detail)],
  ["documentDialogClassName", cn(SHELL, documentDialogClassName)],
  ["searchDialogClassName (⌘K)", cn(SHELL, searchDialogClassName)],
] as const

function Measured() {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const [rows, setRows] = useState<{ w: string; h: number }[]>([])
  useEffect(() => {
    const read = () =>
      setRows(
        refs.current.map((el) => ({
          w: el ? getComputedStyle(el).maxWidth : "",
          h: el?.offsetHeight ?? 0,
        })),
      )
    read()
    window.addEventListener("resize", read)
    return () => window.removeEventListener("resize", read)
  }, [])
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">
        Diukur dari CSS yang jalan (max-width, lebar layar ≥ 640px)
      </h3>
      <div className="bg-muted dark:bg-muted/40 rounded-card p-1">
        <div className="bg-background rounded-row flex flex-col py-1">
          {SIZES.map(([name, cls], i) => (
            <div
              key={name}
              className="gutter-x grid min-h-12 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-6 py-2"
            >
              <code className="text-caption truncate font-mono">{name}</code>
              <span className="text-meta tabular-nums">
                {rows[i]?.w || "…"}
              </span>
              <span className="text-tertiary-foreground text-meta w-24 text-right tabular-nums">
                {i === 3 && rows[i] ? `tinggi ${rows[i].h}px` : ""}
              </span>
              <div
                aria-hidden
                ref={(el) => {
                  refs.current[i] = el
                }}
                className={cn(
                  cls,
                  "pointer-events-none invisible fixed top-0 left-0",
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

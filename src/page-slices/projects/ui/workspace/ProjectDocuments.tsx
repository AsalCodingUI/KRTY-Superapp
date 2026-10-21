"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { RiAddLine, RiFileTextLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { FileSignature, FileText, Files } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
  BUCKET,
  formatBytes,
  openProjectFile,
  supabase,
  uploadProjectFile,
  useDocuments,
  useInvalidate,
  useViewer,
  type DocumentRow,
} from "./data"

const KINDS = {
  proposal: { label: "Proposal", icon: FileText },
  contract: { label: "Kontrak", icon: FileSignature },
  other: { label: "Lainnya", icon: Files },
} as const

const STATUSES = {
  draft: { label: "Draft", tone: "text-muted-foreground" },
  sent: { label: "Dikirim ke klien", tone: "text-info" },
  approved: { label: "Disetujui", tone: "text-success" },
  signed: { label: "Ditandatangani", tone: "text-success" },
} as const

type Kind = keyof typeof KINDS
type Status = keyof typeof STATUSES
type Draft = { kind: Kind; title: string; status: Status; file: File | null }

/** Proposals, contracts and other files for the project, each with a status. */
export function ProjectDocuments({ projectId }: { projectId: string }) {
  const { data: documents = [], isLoading } = useDocuments(projectId)
  const viewer = useViewer()
  const invalidate = useInvalidate(projectId)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<DocumentRow | null>(null)

  const create = async () => {
    if (!draft) return
    if (!draft.title.trim()) {
      toast.error("Judul dokumen wajib diisi.")
      return
    }
    setSaving(true)
    try {
      const path = draft.file
        ? await uploadProjectFile(projectId, "documents", draft.file)
        : null
      const { error } = await supabase()
        .from("project_documents")
        .insert({
          project_id: projectId,
          kind: draft.kind,
          title: draft.title.trim(),
          status: draft.status,
          file_path: path,
          file_name: draft.file?.name ?? null,
          file_size: draft.file?.size ?? null,
          created_by: viewer.id,
        })
      if (error) throw error
      toast.success("Dokumen ditambahkan")
      setDraft(null)
      invalidate("documents")
    } catch {
      toast.error("Gagal menyimpan dokumen.")
    } finally {
      setSaving(false)
    }
  }

  const setStatus = async (doc: DocumentRow, status: Status) => {
    const { error } = await supabase()
      .from("project_documents")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", doc.id)
    if (error) toast.error("Gagal mengubah status.")
    invalidate("documents")
  }

  const open = (doc: DocumentRow) =>
    doc.file_path &&
    openProjectFile(doc.file_path).catch(() =>
      toast.error("File tidak bisa dibuka."),
    )

  const groups = [
    {
      key: "main",
      items: documents.filter((d) => d.kind !== "other"),
    },
    { key: "other", items: documents.filter((d) => d.kind === "other") },
  ]

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="flex justify-end">
        {viewer.isAdmin && (
          <Button
            onClick={() =>
              setDraft({
                kind: "proposal",
                title: "",
                status: "draft",
                file: null,
              })
            }
          >
            <RiAddLine data-icon="inline-start" />
            Dokumen baru
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6" />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          title="Belum ada dokumen"
          description="Simpan proposal, kontrak, dan file penting project di sini."
          icon={<RiFileTextLine className="size-5" />}
          placement="inner"
        />
      ) : (
        groups.map(({ key, items }) =>
          items.length === 0 ? null : (
            <section
              key={key}
              className={cn(
                "grid gap-3 md:grid-cols-2",
                key === "other" && "border-t pt-5",
              )}
            >
              {items.map((doc) => {
                const kind = KINDS[doc.kind as Kind] ?? KINDS.other
                const status = STATUSES[doc.status as Status] ?? STATUSES.draft
                return (
                  <article
                    key={doc.id}
                    className="ring-foreground/10 group/doc flex gap-4 rounded-xl p-2 ring-1"
                  >
                    <button
                      type="button"
                      onClick={() => open(doc)}
                      disabled={!doc.file_path}
                      className="bg-muted/60 text-muted-foreground enabled:hover:text-foreground flex aspect-[4/3] w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-lg text-xs"
                    >
                      <kind.icon className="size-6" />
                      {doc.file_name
                        ? formatBytes(doc.file_size)
                        : "Tanpa file"}
                    </button>
                    <div className="flex min-w-0 flex-1 flex-col py-1 pr-2">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => open(doc)}
                          disabled={!doc.file_path}
                          className="min-w-0 truncate text-left font-medium enabled:hover:underline"
                        >
                          {doc.title}
                        </button>
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {kind.label}
                        </span>
                      </div>
                      {doc.file_name && (
                        <span className="text-muted-foreground truncate text-xs">
                          {doc.file_name}
                        </span>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                        {viewer.isAdmin ? (
                          <Select
                            value={doc.status}
                            onValueChange={(v) =>
                              v && setStatus(doc, v as Status)
                            }
                          >
                            <SelectTrigger
                              className={cn(
                                "hover:bg-muted/50 -ml-2 h-7 w-auto gap-1.5 border-0 bg-transparent px-2 text-xs shadow-none",
                                status.tone,
                              )}
                            >
                              <span className="size-1.5 rounded-full bg-current" />
                              <SelectValue>
                                {(v: Status) => STATUSES[v]?.label}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(STATUSES) as Status[]).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {STATUSES[s].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span
                            className={cn(
                              "flex items-center gap-1.5 text-xs",
                              status.tone,
                            )}
                          >
                            <span className="size-1.5 rounded-full bg-current" />
                            {status.label}
                          </span>
                        )}
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(doc.updated_at), "d MMM", {
                            locale: idLocale,
                          })}
                        </span>
                      </div>
                    </div>
                    {viewer.isAdmin && (
                      <button
                        type="button"
                        onClick={() => setDeleting(doc)}
                        className="text-muted-foreground hover:text-destructive hidden self-start p-1 text-xs group-hover/doc:block"
                      >
                        Hapus
                      </button>
                    )}
                  </article>
                )
              })}
            </section>
          ),
        )
      )}

      <Dialog open={Boolean(draft)} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dokumen baru</DialogTitle>
            <DialogDescription>
              Upload proposal, kontrak, atau file lain beserta statusnya.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Jenis</Label>
                  <Select
                    value={draft.kind}
                    onValueChange={(v) =>
                      v && setDraft({ ...draft, kind: v as Kind })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{(v: Kind) => KINDS[v]?.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(KINDS) as Kind[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {KINDS[k].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Status</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(v) =>
                      v && setDraft({ ...draft, status: v as Status })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v: Status) => STATUSES[v]?.label}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUSES) as Status[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUSES[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="doc-title">Judul</Label>
                <Input
                  id="doc-title"
                  value={draft.title}
                  placeholder="mis. Proposal Rebrand"
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="doc-file">File (opsional, maks 50 MB)</Label>
                <Input
                  id="doc-file"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setDraft({
                      ...draft,
                      file,
                      title:
                        draft.title ||
                        (file ? file.name.replace(/\.[^.]+$/, "") : ""),
                    })
                  }}
                />
              </div>
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Batal
            </Button>
            <Button onClick={create} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Hapus "${deleting?.title ?? ""}"?`}
        description="Dokumen dan file-nya dihapus permanen."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        onConfirm={async () => {
          if (!deleting) return
          const db = supabase()
          if (deleting.file_path) {
            await db.storage.from(BUCKET).remove([deleting.file_path])
          }
          const { error } = await db
            .from("project_documents")
            .delete()
            .eq("id", deleting.id)
          if (error) toast.error("Gagal menghapus dokumen.")
          else toast.success("Dokumen dihapus")
          setDeleting(null)
          invalidate("documents")
        }}
      />
    </div>
  )
}

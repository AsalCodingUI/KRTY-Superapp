"use client"

import { useBreadcrumbs } from "@/components/page-breadcrumbs"
import { PageHeader } from "@/components/page-header"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow, ListRowActions } from "@/components/grouped-list"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { RiAddLine, RiFolderLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { FileImage, FileText, File as FileIcon, Upload } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"
import {
  BUCKET,
  formatBytes,
  openProjectFile,
  supabase,
  uploadProjectFile,
  useInvalidate,
  useLibrary,
  useViewer,
  type FileRow,
  type FolderRow,
} from "./data"

function iconFor(mime: string | null) {
  if (mime?.startsWith("image/")) return FileImage
  if (mime?.includes("pdf") || mime?.startsWith("text/")) return FileText
  return FileIcon
}

/** Folder tile drawn like DesignerHQ's (tab + body). */
function FolderGlyph() {
  return (
    <svg viewBox="0 0 120 84" className="w-full" aria-hidden>
      <path
        d="M8 6h34l8 8h62a8 8 0 0 1 8 8v54a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V14a8 8 0 0 1 8-8Z"
        className="fill-muted"
      />
      <rect
        y="20"
        width="120"
        height="64"
        rx="8"
        className="fill-muted-foreground/25"
      />
    </svg>
  )
}

/** Project library: folders of files in private storage. */
export function ProjectLibrary({ projectId }: { projectId: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const folderId = searchParams.get("folder")
  const { data, isLoading } = useLibrary(projectId)
  const viewer = useViewer()
  const invalidate = useInvalidate(projectId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [naming, setNaming] = useState<{
    folder?: FolderRow
    name: string
  } | null>(null)
  const [removing, setRemoving] = useState<
    { type: "file"; item: FileRow } | { type: "folder"; item: FolderRow } | null
  >(null)

  const folders = data?.folders ?? []
  const files = data?.files ?? []
  const folder = folders.find((f) => f.id === folderId) ?? null
  const inFolder = files.filter((f) =>
    folder ? f.folder_id === folder.id : !f.folder_id,
  )

  useBreadcrumbs(folder ? [{ label: folder.name }] : [])

  const go = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id) params.set("folder", id)
    else params.delete("folder")
    router.push(params.size ? `${pathname}?${params}` : pathname)
  }

  const upload = async (list: FileList | null) => {
    if (!list?.length) return
    const items = [...list]
    setUploading(items.length)
    let failed = 0
    for (const file of items) {
      try {
        const path = await uploadProjectFile(projectId, "library", file)
        const { error } = await supabase()
          .from("project_files")
          .insert({
            project_id: projectId,
            folder_id: folder?.id ?? null,
            name: file.name,
            file_path: path,
            file_size: file.size,
            mime_type: file.type || null,
            created_by: viewer.id,
          })
        if (error) throw error
      } catch {
        failed++
      }
      setUploading((n) => n - 1)
    }
    if (failed) toast.error(`${failed} file gagal diupload.`)
    else toast.success(`${items.length} file diupload`)
    if (inputRef.current) inputRef.current.value = ""
    invalidate("library")
  }

  const saveFolder = async () => {
    if (!naming) return
    const name = naming.name.trim()
    if (!name) return
    const db = supabase()
    const { error } = naming.folder
      ? await db
          .from("project_folders")
          .update({ name })
          .eq("id", naming.folder.id)
      : await db
          .from("project_folders")
          .insert({ project_id: projectId, name, created_by: viewer.id })
    if (error?.code === "23505") {
      toast.error("Folder dengan nama itu sudah ada.")
      return
    }
    if (error) {
      toast.error("Gagal menyimpan folder.")
      return
    }
    setNaming(null)
    invalidate("library")
  }

  const confirmRemove = async () => {
    if (!removing) return
    const db = supabase()
    const paths =
      removing.type === "file"
        ? [removing.item.file_path]
        : files
            .filter((f) => f.folder_id === removing.item.id)
            .map((f) => f.file_path)
    if (paths.length) await db.storage.from(BUCKET).remove(paths)
    const { error } =
      removing.type === "file"
        ? await db.from("project_files").delete().eq("id", removing.item.id)
        : await db.from("project_folders").delete().eq("id", removing.item.id)
    if (error) toast.error("Gagal menghapus.")
    else
      toast.success(
        removing.type === "file" ? "File dihapus" : "Folder dihapus",
      )
    if (removing.type === "folder" && folder?.id === removing.item.id) go(null)
    setRemoving(null)
    invalidate("library")
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        back={
          folder ? { onClick: () => go(null), label: "Library" } : undefined
        }
        title={folder ? folder.name : "Library"}
        actions={
          <>
            {!folder && (
              <Button variant="outline" onClick={() => setNaming({ name: "" })}>
                <RiAddLine data-icon="inline-start" />
                Folder
              </Button>
            )}
            <Button
              onClick={() => inputRef.current?.click()}
              disabled={uploading > 0}
            >
              {uploading > 0 ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Upload data-icon="inline-start" />
              )}
              {uploading > 0 ? `Mengupload ${uploading}…` : "Upload"}
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => upload(e.target.files)}
            />
          </>
        }
      />
      <div className="flex flex-col gap-5 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-6" />
          </div>
        ) : (
          <>
            {!folder && folders.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
                {folders.map((f) => {
                  const count = files.filter((x) => x.folder_id === f.id).length
                  return (
                    <div
                      key={f.id}
                      className="group/folder relative flex flex-col items-center gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => go(f.id)}
                        className="w-full max-w-36 transition-transform hover:-translate-y-0.5"
                      >
                        <FolderGlyph />
                      </button>
                      <span className="max-w-full truncate text-center text-sm">
                        {f.name}
                      </span>
                      <span className="text-muted-foreground -mt-1.5 text-xs">
                        {count} file
                      </span>
                      <div className="absolute top-1 right-1 hidden gap-1 group-hover/folder:flex">
                        <button
                          type="button"
                          onClick={() => setNaming({ folder: f, name: f.name })}
                          className="bg-background/80 rounded px-1.5 py-0.5 text-xs"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRemoving({ type: "folder", item: f })
                          }
                          className="bg-background/80 text-destructive rounded px-1.5 py-0.5 text-xs"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {inFolder.length > 0 ? (
              <GroupedList>
                {inFolder.map((file) => {
                  const Icon = iconFor(file.mime_type)
                  return (
                    <ListRow key={file.id}>
                      <Icon className="text-muted-foreground size-4 shrink-0" />
                      <button
                        type="button"
                        onClick={() =>
                          openProjectFile(file.file_path).catch(() =>
                            toast.error("File tidak bisa dibuka."),
                          )
                        }
                        className="min-w-0 flex-1 truncate text-left hover:underline"
                      >
                        {file.name}
                      </button>
                      <ListRowActions>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            openProjectFile(file.file_path, file.name).catch(
                              () => toast.error("Gagal mengunduh."),
                            )
                          }
                        >
                          Unduh
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            setRemoving({ type: "file", item: file })
                          }
                        >
                          Hapus
                        </Button>
                      </ListRowActions>
                      <span className="text-muted-foreground w-16 shrink-0 text-right text-xs tabular-nums">
                        {formatBytes(file.file_size)}
                      </span>
                      <span className="text-muted-foreground w-16 shrink-0 text-right text-xs">
                        {format(new Date(file.created_at), "d MMM", {
                          locale: idLocale,
                        })}
                      </span>
                    </ListRow>
                  )
                })}
              </GroupedList>
            ) : (
              (folder || folders.length === 0) && (
                <EmptyState
                  title={
                    folder ? "Folder ini masih kosong" : "Library masih kosong"
                  }
                  description={
                    folder
                      ? "Upload file ke folder ini."
                      : "Bikin folder (mis. Logo, Font, Presentasi) lalu upload file."
                  }
                  icon={<RiFolderLine className="size-5" />}
                  placement="inner"
                />
              )
            )}
          </>
        )}

        <Dialog
          open={Boolean(naming)}
          onOpenChange={(o) => !o && setNaming(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {naming?.folder ? "Ubah nama folder" : "Folder baru"}
              </DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              value={naming?.name ?? ""}
              placeholder="mis. Logo"
              onChange={(e) =>
                naming && setNaming({ ...naming, name: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && saveFolder()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setNaming(null)}>
                Batal
              </Button>
              <Button onClick={saveFolder}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={Boolean(removing)}
          onOpenChange={(o) => !o && setRemoving(null)}
          title={
            removing?.type === "folder"
              ? `Hapus folder "${removing.item.name}"?`
              : `Hapus "${removing?.item.name ?? ""}"?`
          }
          description={
            removing?.type === "folder"
              ? "Folder dan semua file di dalamnya dihapus permanen."
              : "File dihapus permanen."
          }
          confirmText="Hapus"
          cancelText="Batal"
          variant="destructive"
          onConfirm={confirmRemove}
        />
      </div>
    </div>
  )
}

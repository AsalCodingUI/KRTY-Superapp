"use client"

import { useCanonicalParam } from "@/shared/hooks/useCanonicalParam"
import { findByLinkKey, linkKey, replaceUrl } from "@/shared/lib/url-params"
import { PageHeader } from "@/components/page-header"
import { useBreadcrumbs } from "@/components/page-breadcrumbs"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  listHeaderClassName,
  ListRow,
} from "@/components/grouped-list"
import { ViewToggle, useViewMode } from "@/components/view-toggle"
import { FilePreview } from "./FilePreview"
import type { ViewerItem } from "@/components/file-viewer"
import { FILE_DRAG_TYPE, useFileDrop } from "@/shared/hooks/useFileDrop"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { TAB_ENTER } from "@/shared/hooks/useTabSwitched"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { RiAddLine, RiFolderLine, RiLockLine } from "@/shared/ui/lucide-icons"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format, type Locale } from "date-fns"
import { ChevronDown, FileText, Plus, Upload } from "@/components/icons"
import {
  CopyPlus,
  Download,
  Eye,
  FileImage,
  FilePlus,
  File as FileIcon,
  Folder,
  FolderInput,
  FolderOpen,
  FolderPlus,
  Link as LinkIcon,
  Lock,
  Pencil,
  Trash2,
} from "@/components/icons"
import {
  ContextTarget,
  copyText,
  useContextTarget,
  type CtxItem,
} from "@/shared/context-menu"
import { usePathname, useSearchParams } from "next/navigation"
import * as React from "react"
import { useRef, useState } from "react"
import { mapLimit } from "@/shared/lib/storage-names"
import { toast } from "sonner"
import { registerUndo, rowsUndo, UndoStale } from "@/shared/undo"
import {
  BUCKET,
  copyProjectFile,
  formatBytes,
  openProjectFile,
  projectFileLink,
  renameProjectFile,
  supabase,
  uploadProjectFile,
  useInvalidate,
  useLibrary,
  useViewer,
  useWorkspace,
  type FileRow,
  type FolderRow,
} from "./data"
import dynamic from "next/dynamic"
import { isNote, NoteDialog } from "./NoteDialog"
import { compressImage } from "@/shared/lib/compress-image"
import { FolderIcon, RowMenu, Section, type RowMenuItem } from "./row-menu"

// Viewer (PDF / office renderers) loads in its own chunk.
const FileViewer = dynamic(
  () => import("@/components/file-viewer").then((m) => m.FileViewer),
  { ssr: false },
)

function iconFor(mime: string | null) {
  if (mime?.startsWith("image/")) return FileImage
  if (mime?.includes("pdf") || mime?.startsWith("text/")) return FileText
  return FileIcon
}

/** Pictures (incl. SVG, GIF), video (mp4, webm…) and Markdown notes belong
 *  in the library; other documents in the Documents tab. */
function isAsset(file: File) {
  return (
    /^(image|video)\//.test(file.type) ||
    /\.(svg|webm|gif|webp|avif|mp4|mov)$/i.test(file.name) ||
    isNote(file.name)
  )
}

/**
 * What follows the pointer while a file is dragged onto a folder: a small
 * chip with its thumbnail and name, not a copy of the whole card. Removed
 * right after the browser snapshots it.
 */
function fileDragImage(source: HTMLElement, name: string) {
  const chip = document.createElement("div")
  chip.className = "lib-drag-preview"
  const picture = source.querySelector("img")
  if (picture) {
    const thumb = document.createElement("img")
    thumb.src = picture.currentSrc || picture.src
    chip.append(thumb)
  }
  const label = document.createElement("span")
  label.textContent = name
  chip.append(label)
  document.body.append(chip)
  requestAnimationFrame(() => chip.remove())
  return chip
}

/** "Internal": a folder kept from the client when the project is shared. */
function InternalTag() {
  const t = useT("projects")
  return (
    <Badge variant="secondary" title={t("libInternalFolderHint")}>
      <RiLockLine data-icon="inline-start" />
      {t("libInternalTag")}
    </Badge>
  )
}

/** Select value for "no folder" (Select needs a non-empty value). */
const ROOT_FOLDER = "__root"

/** Shared columns for the header and every folder / file row. */
const LIB_GRID =
  "grid grid-cols-[minmax(0,1fr)_6rem_2rem] items-center gap-x-4 sm:grid-cols-[minmax(0,1fr)_6rem_5rem_2rem]"

/**
 * Grid view: folders as yellow icons with their count (plus "new folder"),
 * then files as preview cards (picture, video frame, PDF / text page, or a
 * soft "no preview" tint), name and size · date under each.
 */
function LibraryGrid({
  folders,
  files,
  allFiles,
  dateLocale,
  onOpenFolder,
  onNewFolder,
  onRenameFolder,
  onRemove,
  fileMenu,
  onOpenFile,
  onDropOnFolder,
  fileCtx,
  folderCtx,
}: {
  folders: FolderRow[]
  files: FileRow[]
  allFiles: FileRow[]
  dateLocale: Locale
  onOpenFolder: (id: string) => void
  onNewFolder?: () => void
  onRenameFolder: (folder: FolderRow) => void
  /** ⋯ items for a file (open, rename, move, download, delete). */
  fileMenu: (file: FileRow) => RowMenuItem[]
  onOpenFile: (file: FileRow) => void
  /** A file card was dropped on a folder tile. */
  onDropOnFolder: (fileId: string, folder: FolderRow) => void
  /** Right-click: wraps a file card / folder tile in its menu target. */
  fileCtx: (
    file: FileRow,
    row: React.ReactElement<Record<string, unknown>>,
  ) => React.ReactElement
  folderCtx: (
    folder: FolderRow,
    row: React.ReactElement<Record<string, unknown>>,
  ) => React.ReactElement
  onRemove: (
    target:
      | { type: "file"; item: FileRow }
      | { type: "folder"; item: FolderRow },
  ) => void
}) {
  const t = useT("projects")
  const tc = useT("common")
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  // The file being dragged, dimmed in place.
  const [dragging, setDragging] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-8">
      {(folders.length > 0 || onNewFolder) && (
        <Section title={t("libFolders")}>
          <div className="grid grid-cols-1 gap-2 pb-1 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((f) => {
              const count = allFiles.filter((x) => x.folder_id === f.id).length
              return folderCtx(
                f,
                <div
                  key={f.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenFolder(f.id)}
                  onKeyDown={(e) => e.key === "Enter" && onOpenFolder(f.id)}
                  onDragOver={(e) => {
                    if (!e.dataTransfer.types.includes(FILE_DRAG_TYPE)) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "move"
                    setDropTarget(f.id)
                  }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData(FILE_DRAG_TYPE)
                    setDropTarget(null)
                    if (id) {
                      e.preventDefault()
                      onDropOnFolder(id, f)
                    }
                  }}
                  className={cn(
                    "group/row hover:bg-accent focus-visible:ring-focus-ring nest-rounded-xl nest-p-2 flex cursor-pointer items-center gap-3 transition-colors outline-none focus-visible:ring-2",
                    dropTarget === f.id &&
                      "bg-primary/10 ring-primary/40 ring-2 ring-inset",
                  )}
                >
                  <FolderIcon className="h-8 w-10 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm" title={f.name}>
                      {f.name}
                    </span>
                    <span className="text-tertiary-foreground text-meta flex items-center gap-1.5">
                      {count
                        ? t("libFileCount", { n: count })
                        : t("libFolderEmptyShort")}
                      {f.is_internal && <InternalTag />}
                    </span>
                  </span>
                  <RowMenu
                    label={f.name}
                    items={[
                      {
                        label: t("actionEdit"),
                        onSelect: () => onRenameFolder(f),
                      },
                      {
                        label: tc("delete"),
                        destructive: true,
                        onSelect: () => onRemove({ type: "folder", item: f }),
                      },
                    ]}
                  />
                </div>,
              )
            })}
            {onNewFolder && (
              <button
                type="button"
                onClick={onNewFolder}
                className="hover:bg-accent text-muted-foreground hover:text-foreground nest-rounded-xl nest-p-2 flex items-center gap-3 text-left text-sm transition-colors"
              >
                <span className="border-field-border-hover rounded-nested grid h-8 w-10 shrink-0 place-items-center border border-dashed">
                  <Plus className="size-4" />
                </span>
                {t("libNewFolder")}
              </button>
            )}
          </div>
        </Section>
      )}

      {files.length > 0 && (
        <Section title={t("libFiles")}>
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 pb-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map((file) => {
              const open = () => onOpenFile(file)
              return fileCtx(
                file,
                <div
                  key={file.id}
                  role="button"
                  tabIndex={0}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(FILE_DRAG_TYPE, file.id)
                    e.dataTransfer.effectAllowed = "move"
                    e.dataTransfer.setDragImage(
                      fileDragImage(e.currentTarget, file.name),
                      16,
                      16,
                    )
                    setDragging(file.id)
                  }}
                  onDragEnd={() => setDragging(null)}
                  onClick={open}
                  onKeyDown={(e) => e.key === "Enter" && open()}
                  className={cn(
                    "group/row focus-visible:ring-focus-ring flex min-w-0 cursor-pointer flex-col gap-2 rounded-xl transition-opacity outline-none focus-visible:ring-2",
                    dragging === file.id && "opacity-40",
                  )}
                >
                  <FilePreview
                    file={file}
                    className="ring-border/60 rounded-xl ring-1 transition-[filter] duration-150 group-hover/row:brightness-95"
                  />
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-tertiary-foreground text-meta tabular-nums">
                        {formatBytes(file.file_size)} ·{" "}
                        {format(new Date(file.created_at), "d MMM yyyy", {
                          locale: dateLocale,
                        })}
                      </span>
                    </div>
                    <RowMenu label={file.name} items={fileMenu(file)} />
                  </div>
                </div>,
              )
            })}
          </div>
        </Section>
      )}
    </div>
  )
}
/** Project library: folders of files in private storage. */
export function ProjectLibrary({ projectId }: { projectId: string }) {
  const t = useT("projects")
  const tc = useT("common")
  const tm = useT("ctxmenu")
  const tu = useT("undo")
  const dateLocale = useDateLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const folderId = searchParams.get("folder")
  const { data, isLoading } = useLibrary(projectId)
  const viewer = useViewer()
  const invalidate = useInvalidate(projectId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [view, setView] = useViewMode("project-library", "grid")
  const [naming, setNaming] = useState<{
    folder?: FolderRow
    name: string
    /** Kept from the client when the project is shared. */
    internal: boolean
  } | null>(null)
  const [removing, setRemoving] = useState<
    { type: "file"; item: FileRow } | { type: "folder"; item: FolderRow } | null
  >(null)
  const [viewing, setViewing] = useState<number | null>(null)
  // A Markdown note open in the note dialog (file null = writing a new
  // one, in `folderId` when given, else the open folder).
  const [note, setNote] = useState<{
    file: FileRow | null
    folderId?: string | null
  } | null>(null)
  const [renaming, setRenaming] = useState<{
    file: FileRow
    name: string
  } | null>(null)
  const [moving, setMoving] = useState<{ file: FileRow; to: string } | null>(
    null,
  )
  const { data: workspace } = useWorkspace(projectId)
  const projectName = workspace?.project?.name ?? "project"

  const folders = data?.folders ?? []
  const files = data?.files ?? []
  const folder = findByLinkKey(folders, folderId) ?? null
  useCanonicalParam(
    "folder",
    folderId,
    folder && linkKey(folder.name, folder.id),
  )
  const inFolder = files.filter((f) =>
    folder ? f.folder_id === folder.id : !f.folder_id,
  )

  useBreadcrumbs(folder ? [{ label: folder.name }] : [])

  const go = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    const target = id ? folders.find((f) => f.id === id) : null
    if (id) params.set("folder", target ? linkKey(target.name, id) : id)
    else params.delete("folder")
    // Client-only (the route doesn't filter by it); a history entry, so
    // Back goes up a folder.
    replaceUrl(params.size ? `${pathname}?${params}` : pathname, true)
  }

  // "Upload resolusi asli" skips the compression for that one pick.
  const keepOriginal = useRef(false)
  // "Upload ke folder ini" from a folder's right-click menu: that folder
  // instead of the open one, for that one pick.
  const uploadFolder = useRef<string | undefined>(undefined)
  const pickFiles = (options: { original?: boolean; folderId?: string }) => {
    keepOriginal.current = Boolean(options.original)
    uploadFolder.current = options.folderId
    inputRef.current?.click()
  }

  const upload = async (list: FileList | null) => {
    if (!list?.length) return
    const original = keepOriginal.current
    keepOriginal.current = false
    const targetFolder = uploadFolder.current ?? folder?.id ?? null
    uploadFolder.current = undefined
    // The library is for assets (pictures, SVG, video); documents live in
    // the Documents tab.
    const all = [...list]
    const assets = all.filter(isAsset)
    if (assets.length < all.length) toast.error(t("libAssetsOnly"))
    if (!assets.length) {
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    setUploading(assets.length)
    // Pictures are compressed first (unless kept original).
    const items = original
      ? assets
      : await Promise.all(assets.map((asset) => compressImage(asset)))
    // Three uploads at a time, then one insert for all of them.
    const uploads = await mapLimit(items, 3, async (file) => {
      try {
        return await uploadProjectFile(projectId, projectName, "library", file)
      } finally {
        // The count stays at 1 until the rows are saved.
        setUploading((n) => Math.max(1, n - 1))
      }
    })
    const rows = items.flatMap((file, i) => {
      const result = uploads[i]
      return result.status === "fulfilled"
        ? [
            {
              project_id: projectId,
              folder_id: targetFolder,
              name: file.name,
              file_path: result.value,
              file_size: file.size,
              mime_type: file.type || null,
              created_by: viewer.id,
            },
          ]
        : []
    })
    let failed = items.length - rows.length
    if (rows.length) {
      const db = supabase()
      const { error } = await db.from("project_files").insert(rows)
      // One bad row fails the batch: retry one by one to count per file.
      if (error) {
        const single = await Promise.all(
          rows.map((row) => db.from("project_files").insert(row)),
        )
        failed += single.filter((r) => r.error).length
      }
    }
    setUploading(0)
    if (failed) toast.error(t("libUploadFailed", { n: failed }))
    else toast.success(t("libUploaded", { n: items.length }))
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
          .update({ name, is_internal: naming.internal })
          .eq("id", naming.folder.id)
      : await db.from("project_folders").insert({
          project_id: projectId,
          name,
          is_internal: naming.internal,
          created_by: viewer.id,
        })
    if (error?.code === "23505") {
      toast.error(t("errFolderExists"))
      return
    }
    if (error) {
      toast.error(t("errSaveFolder"))
      return
    }
    if (naming.folder && naming.folder.name !== name)
      registerUndo(
        rowsUndo({
          label: tu("libraryRename", { name }),
          table: "project_folders",
          rows: [
            {
              id: naming.folder.id,
              before: { name: naming.folder.name },
              after: { name },
            },
          ],
          done: () => invalidate("library"),
        }),
      )
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
    if (error) toast.error(t("errDelete"))
    else
      toast.success(
        removing.type === "file" ? t("fileDeleted") : t("folderDeleted"),
      )
    if (removing.type === "folder" && folder?.id === removing.item.id) go(null)
    setViewing(null)
    setRemoving(null)
    invalidate("library")
  }

  /** Rename shows the new name and moves the stored file to match it. */
  const saveRename = async () => {
    if (!renaming) return
    const name = renaming.name.trim()
    if (!name || name === renaming.file.name) return setRenaming(null)
    let path = renaming.file.file_path
    try {
      path = await renameProjectFile(path, name)
    } catch {
      // Storage rename failed: still show the new name.
    }
    const { error } = await supabase()
      .from("project_files")
      .update({ name, file_path: path })
      .eq("id", renaming.file.id)
    if (error) return void toast.error(t("errRename"))
    toast.success(t("libRenamed"))
    registerFileRenameUndo(renaming.file.id, renaming.file.name, name, path)
    setRenaming(null)
    invalidate("library")
  }

  /** ⌘Z for a rename: the old name (and a stored file named after it). */
  const registerFileRenameUndo = (
    id: string,
    from: string,
    to: string,
    path: string,
  ) => {
    let at = path
    const go = async (expected: string, next: string) => {
      const db = supabase()
      const { data, error } = await db
        .from("project_files")
        .select("name, file_path")
        .eq("id", id)
        .maybeSingle()
      if (error) throw error
      if (!data || data.name !== expected || data.file_path !== at)
        throw new UndoStale()
      let nextPath = at
      try {
        nextPath = await renameProjectFile(at, next)
      } catch {
        // Storage rename failed: still show the name.
      }
      const { error: saveError } = await db
        .from("project_files")
        .update({ name: next, file_path: nextPath })
        .eq("id", id)
      if (saveError) throw saveError
      at = nextPath
      await invalidate("library")
    }
    registerUndo({
      label: tu("libraryRename", { name: to }),
      undo: () => go(to, from),
      redo: () => go(from, to),
    })
  }

  const moveFile = async (fileId: string, folderId: string | null) => {
    const file = files.find((f) => f.id === fileId)
    if (!file || file.folder_id === folderId) return
    const { error } = await supabase()
      .from("project_files")
      .update({ folder_id: folderId })
      .eq("id", fileId)
    if (error) return void toast.error(t("errMove"))
    toast.success(
      t("libMoved", {
        folder:
          folders.find((f) => f.id === folderId)?.name ?? t("sectionLibrary"),
      }),
    )
    invalidate("library")
    registerUndo(
      rowsUndo({
        label: tu("libraryMove", { name: file.name }),
        table: "project_files",
        rows: [
          {
            id: fileId,
            before: { folder_id: file.folder_id },
            after: { folder_id: folderId },
          },
        ],
        done: () => invalidate("library"),
      }),
    )
  }

  const signed = async (path: string, download?: string) => {
    const { data: link, error } = await supabase()
      .storage.from(BUCKET)
      .createSignedUrl(path, 60 * 60, download ? { download } : undefined)
    if (error || !link) throw error ?? new Error("no url")
    return link.signedUrl
  }
  const viewerItems: ViewerItem[] = inFolder.map((file) => ({
    key: file.id,
    name: file.name,
    mime: file.mime_type,
    meta: `${formatBytes(file.file_size)} · ${format(new Date(file.created_at), "d MMM yyyy", { locale: dateLocale })}`,
    getUrl: () => signed(file.file_path),
    getDownloadUrl: () => signed(file.file_path, file.name),
  }))
  const openFile = (file: FileRow) =>
    isNote(file.name)
      ? setNote({ file })
      : setViewing(inFolder.findIndex((f) => f.id === file.id))

  const fileMenu = (file: FileRow): RowMenuItem[] => [
    { label: t("libOpen"), onSelect: () => openFile(file) },
    {
      label: t("libRename"),
      onSelect: () => setRenaming({ file, name: file.name }),
    },
    ...(folders.length
      ? [
          {
            label: t("libMove"),
            onSelect: () =>
              setMoving({ file, to: file.folder_id ?? ROOT_FOLDER }),
          },
        ]
      : []),
    {
      label: t("libDownload"),
      onSelect: () =>
        openProjectFile(file.file_path, file.name).catch(() =>
          toast.error(t("errDownload")),
        ),
    },
    {
      label: tc("delete"),
      destructive: true,
      separatorBefore: true,
      onSelect: () => setRemoving({ type: "file", item: file }),
    },
  ]

  /** "Logo final.png" → "Logo final (salinan).png". */
  const copyName = (name: string) => {
    const dot = name.lastIndexOf(".")
    return dot > 0
      ? `${t("ctxCopyOf", { name: name.slice(0, dot) })}${name.slice(dot)}`
      : t("ctxCopyOf", { name })
  }

  /** A copy of the file (stored next to it) in the same folder. */
  const duplicateFile = async (file: FileRow) => {
    const name = copyName(file.name)
    try {
      const path = await copyProjectFile(file.file_path, name)
      const db = supabase()
      const { error } = await db.from("project_files").insert({
        project_id: projectId,
        folder_id: file.folder_id,
        name,
        file_path: path,
        file_size: file.file_size,
        mime_type: file.mime_type,
        created_by: viewer.id,
      })
      if (error) {
        await db.storage.from(BUCKET).remove([path])
        throw error
      }
      toast.success(t("ctxDuplicated"))
      invalidate("library")
    } catch {
      toast.error(t("ctxErrDuplicate"))
    }
  }

  const setInternal = async (f: FolderRow, internal: boolean) => {
    const { error } = await supabase()
      .from("project_folders")
      .update({ is_internal: internal })
      .eq("id", f.id)
    if (error) return void toast.error(t("errSaveFolder"))
    toast.success(internal ? t("ctxInternalOn") : t("ctxInternalOff"))
    invalidate("library")
  }

  const folderHref = (f: FolderRow) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("folder", linkKey(f.name, f.id))
    return `${pathname}?${params}`
  }

  /** Right-click on a file card / row: the ⋯ actions and a few more. */
  const fileCtx = (
    file: FileRow,
    row: React.ReactElement<Record<string, unknown>>,
  ) => (
    <ContextTarget
      key={file.id}
      type="project-file"
      id={file.id}
      label={file.name}
      // Its own preview covers the picture inside the card.
      suppress={["image", "video", "button"]}
      items={(): CtxItem[] => [
        {
          id: "open",
          label: isNote(file.name) ? t("libOpen") : t("ctxPreview"),
          icon: isNote(file.name) ? FileText : Eye,
          shortcut: "Enter",
          onSelect: () => openFile(file),
        },
        {
          id: "download",
          label: t("libDownload"),
          icon: Download,
          onSelect: () =>
            openProjectFile(file.file_path, file.name).catch(() =>
              toast.error(t("errDownload")),
            ),
        },
        {
          id: "copy-link",
          label: tm("copyLink"),
          icon: LinkIcon,
          onSelect: async () => {
            if (await copyText(projectFileLink(file.file_path)))
              toast.success(tm("linkCopied"))
          },
        },
        {
          id: "rename",
          label: t("libRename"),
          icon: Pencil,
          onSelect: () => setRenaming({ file, name: file.name }),
        },
        {
          id: "move",
          label: t("ctxMoveToFolder"),
          icon: FolderInput,
          hidden: folders.length === 0,
          submenu: [
            { id: ROOT_FOLDER, name: t("libRoot") },
            ...folders.map((f) => ({ id: f.id, name: f.name })),
          ].map((f) => ({
            id: f.id,
            label: f.name,
            role: "radio" as const,
            checked: (file.folder_id ?? ROOT_FOLDER) === f.id,
            onSelect: () =>
              moveFile(file.id, f.id === ROOT_FOLDER ? null : f.id),
          })),
        },
        {
          id: "duplicate",
          label: tm("duplicate"),
          icon: CopyPlus,
          onSelect: () => duplicateFile(file),
        },
        {
          id: "delete",
          label: tc("delete"),
          icon: Trash2,
          destructive: true,
          // The delete dialog asks first.
          onSelect: () => setRemoving({ type: "file", item: file }),
        },
      ]}
    >
      {row}
    </ContextTarget>
  )

  /** Right-click on a folder tile / row. Folders don't nest. */
  const folderCtx = (
    f: FolderRow,
    row: React.ReactElement<Record<string, unknown>>,
  ) => (
    <ContextTarget
      key={f.id}
      type="project-folder"
      id={f.id}
      label={f.name}
      href={folderHref(f)}
      suppress={["button"]}
      items={(): CtxItem[] => [
        {
          id: "upload-here",
          label: t("ctxUploadHere"),
          icon: Upload,
          disabled: uploading > 0,
          onSelect: () => pickFiles({ folderId: f.id }),
        },
        {
          id: "note-here",
          label: t("ctxNoteHere"),
          icon: FilePlus,
          onSelect: () => setNote({ file: null, folderId: f.id }),
        },
        {
          id: "rename",
          label: t("libRenameFolder"),
          icon: Pencil,
          onSelect: () =>
            setNaming({ folder: f, name: f.name, internal: f.is_internal }),
        },
        {
          id: "internal",
          label: t("libInternalFolder"),
          icon: Lock,
          role: "checkbox",
          checked: f.is_internal,
          onSelect: () => setInternal(f, !f.is_internal),
        },
        {
          id: "delete",
          label: tc("delete"),
          icon: Trash2,
          destructive: true,
          onSelect: () => setRemoving({ type: "folder", item: f }),
        },
      ]}
    >
      {row}
    </ContextTarget>
  )

  // A drop is always a normal upload (an "original" pick may have been
  // cancelled and left the flag on).
  const drop = useFileDrop((list) => {
    keepOriginal.current = false
    uploadFolder.current = undefined
    return upload(list)
  }, uploading === 0)

  // Right-click on the page itself (not a file's or folder's menu).
  const rootRef = useRef<HTMLDivElement>(null)
  useContextTarget(
    rootRef,
    (ctx): CtxItem[] =>
      // A file's or folder's own target sits in between.
      ctx.target.closest("[data-ctx-key]")
        ? []
        : [
            {
              id: "upload",
              label: folder ? t("ctxUploadHere") : t("libUpload"),
              icon: Upload,
              disabled: uploading > 0,
              onSelect: () => pickFiles({}),
            },
            {
              id: "upload-original",
              label: t("libUploadOriginal"),
              icon: Upload,
              disabled: uploading > 0,
              onSelect: () => pickFiles({ original: true }),
            },
            {
              id: "new-folder",
              label: t("libNewFolder"),
              icon: FolderPlus,
              hidden: Boolean(folder),
              onSelect: () => setNaming({ name: "", internal: false }),
            },
            {
              id: "new-note",
              label: t("libNoteNew"),
              icon: FilePlus,
              onSelect: () => setNote({ file: null }),
            },
            {
              id: "back",
              label: t("sectionLibrary"),
              icon: FolderOpen,
              hidden: !folder,
              onSelect: () => go(null),
            },
          ],
    {
      type: "project-library",
      label: folder ? folder.name : t("sectionLibrary"),
    },
  )

  return (
    <div ref={rootRef} className="relative flex flex-col" {...drop.bind}>
      {drop.dragging && (
        <div className="bg-primary/5 border-primary/40 pointer-events-none fixed inset-0 z-40 m-3 flex items-center justify-center rounded-2xl border-2 border-dashed">
          <span className="bg-background shadow-popover flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <Upload className="size-4" />
            {tc("dropToUpload")}
          </span>
        </div>
      )}
      <PageHeader
        back={
          folder
            ? { onClick: () => go(null), label: t("sectionLibrary") }
            : undefined
        }
        title={
          folder ? (
            <span className="flex items-center gap-2">
              {folder.name}
              {folder.is_internal && <InternalTag />}
            </span>
          ) : (
            t("sectionLibrary")
          )
        }
        actions={
          <>
            <ViewToggle
              value={view}
              onValueChange={setView}
              modes={["grid", "list"]}
            />
            {!folder && (
              <Button
                variant="outline"
                onClick={() => setNaming({ name: "", internal: false })}
              >
                <RiAddLine data-icon="inline-start" />
                {t("libFolder")}
              </Button>
            )}
            <Button variant="outline" onClick={() => setNote({ file: null })}>
              <FileText data-icon="inline-start" />
              {t("libNoteButton")}
            </Button>
            <ButtonGroup>
              <Button onClick={() => pickFiles({})} disabled={uploading > 0}>
                {uploading > 0 ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Upload data-icon="inline-start" />
                )}
                {uploading > 0
                  ? t("libUploading", { n: uploading })
                  : t("libUpload")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="icon"
                      aria-label={t("libUploadOptions")}
                      disabled={uploading > 0}
                    />
                  }
                >
                  <ChevronDown />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56">
                  <DropdownMenuItem
                    onClick={() => pickFiles({ original: true })}
                  >
                    {t("libUploadOriginal")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              accept="image/*,video/*,.md,text/markdown"
              onChange={(e) => upload(e.target.files)}
            />
          </>
        }
      />
      {/* Re-keyed on grid ↔ list so the swap settles in. */}
      <div key={view} className={cn(TAB_ENTER, "flex flex-col gap-5 pb-4")}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-6" />
          </div>
        ) : (
          <>
            {view === "grid" &&
            ((!folder && folders.length > 0) || inFolder.length > 0) ? (
              <LibraryGrid
                folders={folder ? [] : folders}
                files={inFolder}
                allFiles={files}
                dateLocale={dateLocale}
                onOpenFolder={go}
                onNewFolder={
                  folder
                    ? undefined
                    : () => setNaming({ name: "", internal: false })
                }
                onRenameFolder={(f) =>
                  setNaming({
                    folder: f,
                    name: f.name,
                    internal: f.is_internal,
                  })
                }
                onRemove={setRemoving}
                fileMenu={fileMenu}
                onOpenFile={openFile}
                onDropOnFolder={(id, f) => moveFile(id, f.id)}
                fileCtx={fileCtx}
                folderCtx={folderCtx}
              />
            ) : (!folder && folders.length > 0) || inFolder.length > 0 ? (
              // One aligned list: folders first, then files; actions in ⋯.
              <GroupedList>
                <div className={cn(LIB_GRID, listHeaderClassName)}>
                  <span>{t("formName")}</span>
                  <span className="text-right">{t("libSizeColumn")}</span>
                  <span className="hidden text-right sm:block">
                    {t("colCreated")}
                  </span>
                  <span />
                </div>
                {!folder &&
                  folders.map((f) => {
                    const count = files.filter(
                      (x) => x.folder_id === f.id,
                    ).length
                    return folderCtx(
                      f,
                      <ListRow
                        key={f.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => go(f.id)}
                        onKeyDown={(e) => e.key === "Enter" && go(f.id)}
                        onDragOver={(e) => {
                          if (!e.dataTransfer.types.includes(FILE_DRAG_TYPE))
                            return
                          e.preventDefault()
                          e.dataTransfer.dropEffect = "move"
                        }}
                        onDrop={(e) => {
                          const id = e.dataTransfer.getData(FILE_DRAG_TYPE)
                          if (id) {
                            e.preventDefault()
                            moveFile(id, f.id)
                          }
                        }}
                        className={cn(LIB_GRID, "cursor-pointer")}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <Folder className="text-muted-foreground size-4 shrink-0 fill-current/15" />
                          <span className="truncate" title={f.name}>
                            {f.name}
                          </span>
                          {f.is_internal && <InternalTag />}
                        </span>
                        <span className="text-muted-foreground text-right tabular-nums">
                          {t("libFileCount", { n: count })}
                        </span>
                        <span className="text-muted-foreground hidden text-right tabular-nums sm:block">
                          {format(new Date(f.created_at), "d MMM", {
                            locale: dateLocale,
                          })}
                        </span>
                        <RowMenu
                          label={f.name}
                          items={[
                            {
                              label: t("actionEdit"),
                              onSelect: () =>
                                setNaming({
                                  folder: f,
                                  name: f.name,
                                  internal: f.is_internal,
                                }),
                            },
                            {
                              label: tc("delete"),
                              destructive: true,
                              onSelect: () =>
                                setRemoving({ type: "folder", item: f }),
                            },
                          ]}
                        />
                      </ListRow>,
                    )
                  })}
                {inFolder.map((file) => {
                  const Icon = iconFor(file.mime_type)
                  const open = () => openFile(file)
                  return fileCtx(
                    file,
                    <ListRow
                      key={file.id}
                      role="button"
                      tabIndex={0}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(FILE_DRAG_TYPE, file.id)
                        e.dataTransfer.effectAllowed = "move"
                        e.dataTransfer.setDragImage(
                          fileDragImage(e.currentTarget, file.name),
                          16,
                          16,
                        )
                      }}
                      onClick={open}
                      onKeyDown={(e) => e.key === "Enter" && open()}
                      className={cn(LIB_GRID, "cursor-pointer")}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Icon className="text-muted-foreground size-4 shrink-0" />
                        <span className="truncate" title={file.name}>
                          {file.name}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-right tabular-nums">
                        {formatBytes(file.file_size)}
                      </span>
                      <span className="text-muted-foreground hidden text-right tabular-nums sm:block">
                        {format(new Date(file.created_at), "d MMM", {
                          locale: dateLocale,
                        })}
                      </span>
                      <RowMenu label={file.name} items={fileMenu(file)} />
                    </ListRow>,
                  )
                })}
              </GroupedList>
            ) : (
              <EmptyState
                title={folder ? t("libFolderEmpty") : t("libEmpty")}
                description={folder ? undefined : t("libEmptyDescription")}
                icon={<RiFolderLine className="size-5" />}
                placement="inner"
              />
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
                {naming?.folder ? t("libRenameFolder") : t("libNewFolder")}
              </DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              value={naming?.name ?? ""}
              placeholder={t("libFolderPlaceholder")}
              onChange={(e) =>
                naming && setNaming({ ...naming, name: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && saveFolder()}
            />
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <RiLockLine className="text-muted-foreground size-3.5" />
                  {t("libInternalFolder")}
                </span>
                <span className="text-muted-foreground text-xs">
                  {t("libInternalFolderHint")}
                </span>
              </span>
              <Switch
                checked={naming?.internal ?? false}
                onCheckedChange={(on) =>
                  naming && setNaming({ ...naming, internal: on })
                }
              />
            </label>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNaming(null)}>
                {tc("cancel")}
              </Button>
              <Button onClick={saveFolder}>{tc("save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(renaming)}
          onOpenChange={(o) => !o && setRenaming(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("libRenameTitle")}</DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              aria-label={tc("fileName")}
              value={renaming?.name ?? ""}
              onFocus={(e) => {
                // Select the name without its extension, like Finder.
                const dot = e.target.value.lastIndexOf(".")
                e.target.setSelectionRange(
                  0,
                  dot > 0 ? dot : e.target.value.length,
                )
              }}
              onChange={(e) =>
                renaming && setRenaming({ ...renaming, name: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && saveRename()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenaming(null)}>
                {tc("cancel")}
              </Button>
              <Button onClick={saveRename}>{tc("save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(moving)}
          onOpenChange={(o) => !o && setMoving(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("libMoveTitle", { name: moving?.file.name ?? "" })}
              </DialogTitle>
            </DialogHeader>
            <Select
              value={moving?.to ?? ROOT_FOLDER}
              onValueChange={(v) =>
                v && moving && setMoving({ ...moving, to: v })
              }
            >
              <SelectTrigger className="w-full" aria-label={t("libMoveTo")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROOT_FOLDER}>{t("libRoot")}</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMoving(null)}>
                {tc("cancel")}
              </Button>
              <Button
                onClick={async () => {
                  if (!moving) return
                  await moveFile(
                    moving.file.id,
                    moving.to === ROOT_FOLDER ? null : moving.to,
                  )
                  setMoving(null)
                }}
              >
                {t("libMove").replace("…", "")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <NoteDialog
          open={Boolean(note)}
          onOpenChange={(o) => !o && setNote(null)}
          file={note?.file ?? null}
          projectId={projectId}
          projectName={projectName}
          folderId={
            note?.folderId !== undefined ? note.folderId : (folder?.id ?? null)
          }
          viewerId={viewer.id}
          onSaved={() => invalidate("library")}
        />

        <FileViewer
          items={viewerItems}
          index={viewing}
          onIndexChange={setViewing}
          onClose={() => setViewing(null)}
          actions={(item) => {
            const file = inFolder.find((f) => f.id === item.key)
            if (!file) return null
            return (
              <RowMenu
                alwaysVisible
                label={file.name}
                items={fileMenu(file).filter((m) => m.label !== t("libOpen"))}
              />
            )
          }}
        />

        <ConfirmDialog
          open={Boolean(removing)}
          onOpenChange={(o) => !o && setRemoving(null)}
          title={
            removing?.type === "folder"
              ? t("libDeleteFolderTitle", { name: removing.item.name })
              : t("deleteNamedTitle", { name: removing?.item.name ?? "" })
          }
          description={
            removing?.type === "folder"
              ? t("libDeleteFolderDescription")
              : t("libDeleteFileDescription")
          }
          confirmText={tc("delete")}
          cancelText={tc("cancel")}
          variant="destructive"
          onConfirm={confirmRemove}
        />
      </div>
    </div>
  )
}

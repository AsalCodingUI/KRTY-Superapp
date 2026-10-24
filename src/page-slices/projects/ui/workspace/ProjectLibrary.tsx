"use client"

import { PageHeader } from "@/components/page-header"
import { useBreadcrumbs } from "@/components/page-breadcrumbs"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { Collapse } from "@/components/ui/collapse"
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
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { RiAddLine, RiFolderLine, RiMoreFill } from "@/shared/ui/lucide-icons"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format, type Locale } from "date-fns"
import { Check, ChevronDown, FileText, Plus, Upload } from "@/components/icons"
import { FileImage, File as FileIcon, Folder } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { useRef, useState } from "react"
import { mapLimit } from "@/shared/lib/storage-names"
import { toast } from "sonner"
import {
  BUCKET,
  formatBytes,
  openProjectFile,
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

/** Folder tile drawn like DesignerHQ's (tab + body). */
/** Pictures (incl. SVG, GIF) and video (mp4, webm…) belong in the library. */
function isAsset(file: File) {
  return (
    /^(image|video)\//.test(file.type) ||
    /\.(svg|webm|gif|webp|avif|mp4|mov)$/i.test(file.name)
  )
}

/** Select value for "no folder" (Select needs a non-empty value). */
const ROOT_FOLDER = "__root"

/** Shared columns for the header and every folder / file row. */
const LIB_GRID =
  "grid grid-cols-[minmax(0,1fr)_6rem_2rem] items-center gap-x-4 sm:grid-cols-[minmax(0,1fr)_6rem_5rem_2rem]"

/** Yellow folder (VEED style): back tab + front body. */
function FolderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 32" className={className} aria-hidden="true">
      <path
        d="M3 4.5A2.5 2.5 0 0 1 5.5 2h9.2a2.5 2.5 0 0 1 1.9.9l2 2.3H34.5A2.5 2.5 0 0 1 37 7.7V12H3z"
        fill="#F5B83D"
      />
      <rect x="3" y="8" width="34" height="22" rx="3" fill="#FCD15A" />
      <rect x="3" y="8" width="34" height="2" rx="1" fill="#FFE08A" />
    </svg>
  )
}

/** A collapsible section title ("▾ Folder"), like the reference. */
export function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-foreground flex w-fit items-center gap-1.5 text-sm"
      >
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 transition-transform duration-200 ease-out",
            !open && "-rotate-90",
          )}
        />
        {title}
      </button>
      <Collapse open={open}>{children}</Collapse>
    </section>
  )
}

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
  onRemove: (
    target:
      | { type: "file"; item: FileRow }
      | { type: "folder"; item: FolderRow },
  ) => void
}) {
  const t = useT("projects")
  const tc = useT("common")
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-8">
      {(folders.length > 0 || onNewFolder) && (
        <Section title={t("libFolders")}>
          <div className="grid grid-cols-1 gap-2 pb-1 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((f) => {
              const count = allFiles.filter((x) => x.folder_id === f.id).length
              return (
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
                    "group/row hover:bg-muted/60 focus-visible:ring-focus-ring nest-rounded-xl nest-p-2 flex cursor-pointer items-center gap-3 transition-colors outline-none focus-visible:ring-2",
                    dropTarget === f.id &&
                      "bg-primary/10 ring-primary/40 ring-2",
                  )}
                >
                  <FolderIcon className="h-8 w-10 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm" title={f.name}>
                      {f.name}
                    </span>
                    <span className="text-tertiary-foreground text-[13px]">
                      {count
                        ? t("libFileCount", { n: count })
                        : t("libFolderEmptyShort")}
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
                </div>
              )
            })}
            {onNewFolder && (
              <button
                type="button"
                onClick={onNewFolder}
                className="hover:bg-muted/60 text-muted-foreground hover:text-foreground nest-rounded-xl nest-p-2 flex items-center gap-3 text-left text-sm transition-colors"
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
              return (
                <div
                  key={file.id}
                  role="button"
                  tabIndex={0}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(FILE_DRAG_TYPE, file.id)
                    e.dataTransfer.effectAllowed = "move"
                  }}
                  onClick={open}
                  onKeyDown={(e) => e.key === "Enter" && open()}
                  className="group/row focus-visible:ring-focus-ring flex min-w-0 cursor-pointer flex-col gap-2 rounded-xl outline-none focus-visible:ring-2"
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
                      <span className="text-tertiary-foreground text-[13px] tabular-nums">
                        {formatBytes(file.file_size)} ·{" "}
                        {format(new Date(file.created_at), "d MMM yyyy", {
                          locale: dateLocale,
                        })}
                      </span>
                    </div>
                    <RowMenu label={file.name} items={fileMenu(file)} />
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}
    </div>
  )
}

/** A row's actions in one quiet ⋯ menu (doesn't trigger the row click). */
export type RowMenuItem = {
  label: string
  onSelect: () => void
  destructive?: boolean
  /** Shows a tick (e.g. the current status). */
  checked?: boolean
  /** Draws a divider above this item. */
  separatorBefore?: boolean
}

export function RowMenu({
  label,
  items,
  alwaysVisible = false,
}: {
  label: string
  items: RowMenuItem[]
  /** Show the ⋯ button without hovering a row (e.g. in a header). */
  alwaysVisible?: boolean
}) {
  return (
    <span className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              className={cn(
                "text-muted-foreground",
                !alwaysVisible &&
                  "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100",
              )}
            />
          }
        >
          <RiMoreFill />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          {items.map((item) => (
            <React.Fragment key={item.label}>
              {item.separatorBefore && <DropdownMenuSeparator />}
              <DropdownMenuItem
                variant={item.destructive ? "destructive" : "default"}
                onClick={item.onSelect}
              >
                <span className="flex-1">{item.label}</span>
                {item.checked && <Check className="size-4" />}
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )
}

/** Project library: folders of files in private storage. */
export function ProjectLibrary({ projectId }: { projectId: string }) {
  const t = useT("projects")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const router = useRouter()
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
  } | null>(null)
  const [removing, setRemoving] = useState<
    { type: "file"; item: FileRow } | { type: "folder"; item: FolderRow } | null
  >(null)
  const [viewing, setViewing] = useState<number | null>(null)
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
    // The library is for assets (pictures, SVG, video); documents live in
    // the Documents tab.
    const all = [...list]
    const items = all.filter(isAsset)
    if (items.length < all.length) toast.error(t("libAssetsOnly"))
    if (!items.length) {
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    setUploading(items.length)
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
              folder_id: folder?.id ?? null,
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
          .update({ name })
          .eq("id", naming.folder.id)
      : await db
          .from("project_folders")
          .insert({ project_id: projectId, name, created_by: viewer.id })
    if (error?.code === "23505") {
      toast.error(t("errFolderExists"))
      return
    }
    if (error) {
      toast.error(t("errSaveFolder"))
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
    setRenaming(null)
    invalidate("library")
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
    setViewing(inFolder.findIndex((f) => f.id === file.id))

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

  const drop = useFileDrop((list) => upload(list), uploading === 0)

  return (
    <div className="relative flex flex-col" {...drop.bind}>
      {drop.dragging && (
        <div className="bg-primary/5 border-primary/40 pointer-events-none fixed inset-0 z-40 m-3 flex items-center justify-center rounded-2xl border-2 border-dashed backdrop-blur-[1px]">
          <span className="bg-background flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-(--elev-4)">
            <Upload className="size-4" />
            {tc("dropToUpload")}
          </span>
        </div>
      )}
      <PageHeader
        className="pt-6 pb-4"
        back={
          folder
            ? { onClick: () => go(null), label: t("sectionLibrary") }
            : undefined
        }
        title={folder ? folder.name : t("sectionLibrary")}
        actions={
          <>
            <ViewToggle
              value={view}
              onValueChange={setView}
              modes={["grid", "list"]}
            />
            {!folder && (
              <Button variant="outline" onClick={() => setNaming({ name: "" })}>
                <RiAddLine data-icon="inline-start" />
                {t("libFolder")}
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
              {uploading > 0
                ? t("libUploading", { n: uploading })
                : t("libUpload")}
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              accept="image/*,video/*"
              onChange={(e) => upload(e.target.files)}
            />
          </>
        }
      />
      {/* Re-keyed on grid ↔ list so the swap settles in. */}
      <div
        key={view}
        className="animate-tab-enter flex flex-col gap-5 pb-4 motion-reduce:animate-none"
      >
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
                onNewFolder={folder ? undefined : () => setNaming({ name: "" })}
                onRenameFolder={(f) => setNaming({ folder: f, name: f.name })}
                onRemove={setRemoving}
                fileMenu={fileMenu}
                onOpenFile={openFile}
                onDropOnFolder={(id, f) => moveFile(id, f.id)}
              />
            ) : (!folder && folders.length > 0) || inFolder.length > 0 ? (
              // One aligned list: folders first, then files; actions in ⋯.
              <GroupedList>
                <div
                  className={cn(
                    LIB_GRID,
                    "gutter-x text-muted-foreground border-border h-9 border-b text-[13px]",
                  )}
                >
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
                    return (
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
                                setNaming({ folder: f, name: f.name }),
                            },
                            {
                              label: tc("delete"),
                              destructive: true,
                              onSelect: () =>
                                setRemoving({ type: "folder", item: f }),
                            },
                          ]}
                        />
                      </ListRow>
                    )
                  })}
                {inFolder.map((file) => {
                  const Icon = iconFor(file.mime_type)
                  const open = () => openFile(file)
                  return (
                    <ListRow
                      key={file.id}
                      role="button"
                      tabIndex={0}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(FILE_DRAG_TYPE, file.id)
                        e.dataTransfer.effectAllowed = "move"
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
                    </ListRow>
                  )
                })}
              </GroupedList>
            ) : (
              <EmptyState
                title={folder ? t("libFolderEmpty") : t("libEmpty")}
                description={
                  folder
                    ? t("libFolderEmptyDescription")
                    : t("libEmptyDescription")
                }
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

"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { MarkdownDocEditor } from "@/page-slices/policies/ui/doc-editor"
import { useT } from "@/shared/i18n/client"
import { RiCloseLine } from "@/shared/ui/lucide-icons"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  BUCKET,
  renameProjectFile,
  supabase,
  uploadInternalAsset,
  uploadProjectFile,
  type FileRow,
} from "./data"

/** Markdown notes (meeting notes and the like) live in the library as .md. */
export const isNote = (name: string) => /\.(md|markdown)$/i.test(name)

const NOTE_MIME = "text/markdown"

/** "Notulen 28 Okt.md" ↔ "Notulen 28 Okt". */
const titleOf = (name: string) => name.replace(/\.(md|markdown)$/i, "")
const fileNameOf = (title: string) => `${title.replace(/[\\/]/g, "-")}.md`

/**
 * A note in the project library, in the same editor as the rules: title on
 * top, toolbar, "/" blocks. Saved as an .md file in the current folder;
 * closing with unsaved changes asks first.
 */
export function NoteDialog({
  open,
  onOpenChange,
  file,
  projectId,
  projectName,
  folderId,
  viewerId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The note to open; none for a new one. */
  file: FileRow | null
  projectId: string
  projectName: string
  folderId: string | null
  viewerId: string | null
  onSaved: () => void
}) {
  const t = useT("projects")
  const tc = useT("common")
  // The note being edited: the given file, or the new one once saved.
  const [current, setCurrent] = useState<FileRow | null>(null)
  const [title, setTitle] = useState("")
  const [loaded, setLoaded] = useState<string | null>(null)
  const body = useRef("")
  const [saved, setSaved] = useState({ title: "", body: "" })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const closeRef = useRef(onOpenChange)
  closeRef.current = onOpenChange

  useEffect(() => {
    if (!open) return
    setCurrent(file)
    setTitle(file ? titleOf(file.name) : "")
    setDirty(false)
    setLoaded(file ? null : "")
    body.current = ""
    setSaved({ title: file ? titleOf(file.name) : "", body: "" })
    if (!file) return
    let alive = true
    supabase()
      .storage.from(BUCKET)
      .download(file.file_path)
      .then(async ({ data, error }: { data: Blob | null; error: unknown }) => {
        if (error || !data) throw error ?? new Error("no file")
        const text = await data.text()
        if (!alive) return
        body.current = text
        setSaved({ title: titleOf(file.name), body: text })
        setLoaded(text)
      })
      .catch(() => {
        if (!alive) return
        toast.error(t("errLoadNote"))
        closeRef.current(false)
      })
    return () => {
      alive = false
    }
  }, [open, file, t])

  const markDirty = (nextTitle: string, nextBody: string) =>
    setDirty(
      nextTitle.trim() !== saved.title ||
        nextBody.trimEnd() !== saved.body.trimEnd(),
    )

  const save = async () => {
    const name = title.trim()
    if (!name || saving) return false
    setSaving(true)
    const text = body.current
    const blob = new File([text], fileNameOf(name), { type: NOTE_MIME })
    try {
      const db = supabase()
      if (current) {
        let path = current.file_path
        const { error } = await db.storage
          .from(BUCKET)
          .upload(path, blob, { upsert: true, contentType: NOTE_MIME })
        if (error) throw error
        if (blob.name !== current.name) {
          path = await renameProjectFile(path, blob.name).catch(() => path)
        }
        const { data, error: rowError } = await db
          .from("project_files")
          .update({ name: blob.name, file_path: path, file_size: blob.size })
          .eq("id", current.id)
          .select("*")
          .single()
        if (rowError) throw rowError
        setCurrent(data as FileRow)
      } else {
        const path = await uploadProjectFile(
          projectId,
          projectName,
          "library",
          blob,
        )
        const { data, error } = await db
          .from("project_files")
          .insert({
            project_id: projectId,
            folder_id: folderId,
            name: blob.name,
            file_path: path,
            file_size: blob.size,
            mime_type: NOTE_MIME,
            created_by: viewerId,
          })
          .select("*")
          .single()
        if (error) {
          await db.storage.from(BUCKET).remove([path])
          throw error
        }
        setCurrent(data as FileRow)
      }
      setSaved({ title: name, body: text })
      setDirty(false)
      toast.success(t("libNoteSaved"))
      onSaved()
      return true
    } catch {
      toast.error(t("errSaveNote"))
      return false
    } finally {
      setSaving(false)
    }
  }

  const requestClose = () =>
    dirty ? setConfirmClose(true) : onOpenChange(false)

  return (
    <Dialog
      open={open}
      // The editor's own Esc (the "/" menu, the link field) stops there,
      // so an Esc that gets here means "close" (with the unsaved check).
      onOpenChange={(o) => {
        if (!o) requestClose()
      }}
    >
      <DialogContent
        bare
        showCloseButton={false}
        className="flex h-[min(56rem,92svh)] w-full flex-col overflow-hidden p-0 sm:max-w-5xl"
      >
        <header className="border-border flex shrink-0 items-center gap-3 border-b px-4 py-3">
          <DialogTitle className="sr-only">
            {current ? titleOf(current.name) : t("libNoteNew")}
          </DialogTitle>
          <input
            value={title}
            autoFocus={!file}
            maxLength={120}
            placeholder={t("libNoteTitlePlaceholder")}
            aria-label={t("libNoteTitle")}
            onChange={(e) => {
              setTitle(e.target.value)
              markDirty(e.target.value, body.current)
            }}
            className="text-heading placeholder:text-muted-foreground/60 min-w-0 flex-1 border-0 bg-transparent text-lg font-medium shadow-none ring-0 outline-none focus:ring-0 focus-visible:ring-0"
          />
          <Button
            size="sm"
            onClick={save}
            disabled={!title.trim() || saving || (!dirty && Boolean(current))}
          >
            {saving && <Spinner data-icon="inline-start" />}
            {tc("save")}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={tc("close")}
            onClick={requestClose}
          >
            <RiCloseLine />
          </Button>
        </header>

        {loaded === null ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="size-6" />
          </div>
        ) : (
          <MarkdownDocEditor
            key={file?.id ?? "new"}
            value={loaded}
            ariaLabel={t("libNoteBody")}
            className="flex-1"
            onChange={(markdown) => {
              body.current = markdown
              markDirty(title, markdown)
            }}
            // Library notes are internal: pictures and attachments stay
            // private (signed-in project members only).
            onUploadImage={(file, original) =>
              uploadInternalAsset(projectId, projectName, file, original)
            }
            onUploadFile={(file) =>
              uploadInternalAsset(projectId, projectName, file)
            }
          />
        )}

        <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("libNoteUnsaved")}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setConfirmClose(false)}>
                {tc("cancel")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmClose(false)
                  onOpenChange(false)
                }}
              >
                {t("libNoteDiscard")}
              </Button>
              <Button
                disabled={!title.trim() || saving}
                onClick={async () => {
                  if (await save()) {
                    setConfirmClose(false)
                    onOpenChange(false)
                  }
                }}
              >
                {tc("save")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}

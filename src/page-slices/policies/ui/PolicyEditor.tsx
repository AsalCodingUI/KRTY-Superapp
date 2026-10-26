"use client"

import { savePolicyDraft } from "@/app/(main)/policies/actions/policy-actions"
import { EmptyState } from "@/components/empty-state"
import { ListChip } from "@/components/grouped-list"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import {
  RiBookOpenLine,
  RiCloseLine,
  RiFileTextLine,
} from "@/shared/ui/lucide-icons"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import { useQueryClient } from "@tanstack/react-query"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format } from "date-fns"
import { Cloud, CloudOff } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  categoryLabel,
  POLICY_CATEGORIES,
  policyKeys,
  splitVersions,
  usePolicy,
  usePolicyBody,
  type PolicyDetail,
  type PolicyListItem,
} from "../model/data"
import { BlockHandle } from "./block-handle"
import { DocToolbar } from "./DocToolbar"
import { SelectionMenu } from "./SelectionMenu"
import { DOC_PROSE, docExtensions } from "./doc-editor"
import { BLOCK_ITEMS, SlashMenu, createSlashBridge } from "./slash-command"
import { PublishDialog } from "./PublishDialog"

/** The editor appends an empty trailing paragraph; ignore end whitespace. */
const sameBody = (a: string, b: string) => a.trimEnd() === b.trimEnd()

type Form = { title: string; category: string; summary: string; body: string }
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error"

const AUTOSAVE_MS = 1200

export type EditorExit = { id: string | null; published?: boolean }

/**
 * Writes a new rule (`id` null) or the draft of an existing one in a large
 * modal (Dovetail notes). Saves on its own; closing flushes the last edits.
 */
export function PolicyEditorDialog({
  id,
  onExit,
}: {
  id: string | null
  /** Called after closing or publishing, with the rule's id once it exists. */
  onExit: (exit: EditorExit) => void
}) {
  // The URL gains the new id after the first save; keep editing the same doc.
  const [initialId] = useState(id)
  const closeRef = useRef<() => void>(() => onExit({ id: initialId }))

  return (
    <Dialog
      open
      onOpenChange={(open, details) => {
        // Esc belongs to the editor (slash menu, link field); close with ×.
        if (!open && details.reason !== "escape-key") closeRef.current()
      }}
    >
      <DialogContent
        bare
        showCloseButton={false}
        className="flex h-[min(56rem,92svh)] w-full flex-col overflow-hidden p-0 sm:max-w-5xl"
      >
        <EditorLoader id={initialId} onExit={onExit} closeRef={closeRef} />
      </DialogContent>
    </Dialog>
  )
}

function EditorLoader({
  id,
  onExit,
  closeRef,
}: {
  id: string | null
  onExit: (exit: EditorExit) => void
  closeRef: React.MutableRefObject<() => void>
}) {
  const t = useT("policies")
  const tc = useT("common")
  const { profile, loading: profileLoading } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const { data: policy, isLoading } = usePolicy(id ?? "")
  const { published, latest, draft } = splitVersions(policy?.versions ?? [])
  const source = draft ?? latest
  const { data: body, isPending: bodyPending } = usePolicyBody(source)

  if ((id && (isLoading || (source && bodyPending))) || profileLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <DialogTitle className="sr-only">{t("loadingRule")}</DialogTitle>
        <Spinner className="size-6" />
      </div>
    )
  }
  if (!isAdmin || (id && !policy)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
        <EmptyState
          placement="inner"
          title={isAdmin ? t("notFound") : t("adminOnly")}
          description={
            isAdmin ? t("notFoundDeleted") : t("adminOnlyDescription")
          }
          icon={<RiFileTextLine />}
          action={{ label: tc("close"), onClick: () => onExit({ id }) }}
        />
      </div>
    )
  }

  return (
    <DocumentEditor
      id={id}
      hasPublished={published.length > 0}
      nextVersion={published.length + 1}
      updatedAt={source?.updated_at ?? null}
      author={source?.author?.full_name ?? null}
      onExit={onExit}
      closeRef={closeRef}
      initial={{
        title: source?.title ?? "",
        category: policy?.category ?? POLICY_CATEGORIES[0],
        summary: source?.summary ?? "",
        body: body ?? "",
      }}
    />
  )
}

function DocumentEditor({
  id,
  hasPublished,
  nextVersion,
  updatedAt,
  author,
  initial,
  onExit,
  closeRef,
}: {
  id: string | null
  hasPublished: boolean
  nextVersion: number
  updatedAt: string | null
  author: string | null
  initial: Form
  onExit: (exit: EditorExit) => void
  closeRef: React.MutableRefObject<() => void>
}) {
  const t = useT("policies")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  // The editor's placeholder is set up once; read the current language here.
  const tRef = useRef(t)
  tRef.current = t
  const queryClient = useQueryClient()
  const { profile } = useUserProfile()

  const [docId, setDocId] = useState(id)
  const [form, setForm] = useState<Form>(initial)
  const [saveState, setSaveState] = useState<SaveState>(id ? "saved" : "idle")
  const [savedAt, setSavedAt] = useState<string | null>(updatedAt)
  const [publishing, setPublishing] = useState(false)

  // Latest values for the save loop, without re-creating callbacks per key.
  // `formRef` is the source of truth (its body can be newer than `form`'s).
  const formRef = useRef(form)
  const docIdRef = useRef(docId)
  docIdRef.current = docId
  const saveStateRef = useRef(saveState)
  saveStateRef.current = saveState
  // The body is serialized to Markdown only when needed (autosave, save,
  // publish), not on every keystroke; `bodyStale` marks edits since then.
  const editorRef = useRef<Editor | null>(null)
  const bodyStale = useRef(false)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlight = useRef<Promise<string | null> | null>(null)
  const pending = useRef(false)
  const [slash] = useState(createSlashBridge)
  const [confirmClose, setConfirmClose] = useState(false)
  // What the server has. The editor re-serializes Markdown on load (e.g.
  // "_x_" → "*x*"), so the baseline body is taken from the editor itself;
  // opening a rule without typing must not create a draft.
  const baseline = useRef<Form>(initial)
  const isSaved = (f: Form) =>
    f.title === baseline.current.title &&
    f.category === baseline.current.category &&
    f.summary === baseline.current.summary &&
    sameBody(f.body, baseline.current.body)

  /** The form with an up-to-date body. */
  const currentForm = (): Form => {
    const e = editorRef.current
    if (bodyStale.current && e) {
      bodyStale.current = false
      formRef.current = { ...formRef.current, body: e.getMarkdown() }
    }
    return formRef.current
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: docExtensions(slash, (level) =>
      level
        ? tRef.current("headingPlaceholder", { level })
        : tRef.current("bodyPlaceholder"),
    ),
    content: initial.body,
    contentType: "markdown",
    onCreate: ({ editor: e }) => {
      editorRef.current = e
      bodyStale.current = false
      const body = e.getMarkdown()
      if (id) baseline.current = { ...baseline.current, body }
      formRef.current = { ...formRef.current, body }
      setForm(formRef.current)
      // An update fired while loading would have marked it dirty.
      setSaveState(id ? "saved" : "idle")
    },
    editorProps: {
      attributes: { class: DOC_PROSE, "aria-label": t("bodyLabel") },
    },
    onUpdate: ({ editor: e }) => {
      editorRef.current = e
      bodyStale.current = true
      if (saveStateRef.current !== "dirty") setSaveState("dirty")
      scheduleAutosave()
    },
  })
  editorRef.current = editor

  /** Applies an edit; typing back to the saved text counts as saved again. */
  function change(patch: Partial<Form>) {
    const next = { ...formRef.current, ...patch }
    formRef.current = next
    setForm(next)
    // A body edited since the last serialization is treated as unsaved; the
    // autosave check settles it.
    setSaveState(
      !bodyStale.current && isSaved(next)
        ? docIdRef.current
          ? "saved"
          : "idle"
        : "dirty",
    )
    scheduleAutosave()
  }
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    change({ [key]: value } as Partial<Form>)

  /** Saves now; overlapping calls queue one more save after the current one. */
  const save = useCallback(async (): Promise<string | null> => {
    if (inFlight.current) {
      pending.current = true
      return inFlight.current
    }
    const run = (async () => {
      setSaveState("saving")
      const snapshot = currentForm()
      const wasNew = !docIdRef.current
      const result = await savePolicyDraft(docIdRef.current, snapshot)
      if (!result.success || !result.data) {
        setSaveState("error")
        toast.error(result.success ? tRef.current("saveFailed") : result.error)
        return null
      }
      const newId = result.data.id
      if (!docIdRef.current) {
        docIdRef.current = newId
        setDocId(newId)
        // Point the URL at the saved rule so a reload reopens it.
        const params = new URLSearchParams(window.location.search)
        params.set("policy", newId)
        params.set("edit", "1")
        window.history.replaceState(null, "", `/policies?${params}`)
      }
      baseline.current = snapshot
      setSavedAt(new Date().toISOString())
      // Edits made while saving stay pending.
      const settled = !bodyStale.current && isSaved(formRef.current)
      setSaveState(settled ? "saved" : "dirty")
      if (!settled) scheduleAutosave()
      updateCache(newId, wasNew, snapshot, result.data)
      return newId
    })()
    inFlight.current = run
    const saved = await run
    inFlight.current = null
    if (pending.current) {
      pending.current = false
      return save()
    }
    return saved
    // The helpers it calls only read refs (and the stable query client).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient])

  /**
   * Puts the saved draft into the cached rule and list instead of refetching
   * them; a new rule (or an unknown result) refetches.
   */
  function updateCache(
    docId: string,
    wasNew: boolean,
    snapshot: Form,
    saved: { versionId?: string; updatedAt?: string },
  ) {
    const detailKey = policyKeys.detail(docId)
    const cached = queryClient.getQueryData<PolicyDetail | null>(detailKey)
    if (wasNew || !cached) {
      queryClient.invalidateQueries({ queryKey: policyKeys.list() })
      queryClient.invalidateQueries({ queryKey: detailKey })
      return
    }
    const category = snapshot.category.trim()
    const knownDraft = cached.versions.find((v) => v.status === "Draft")
    // A new draft we can't describe (or one replaced elsewhere): refetch.
    if (
      saved.versionId &&
      (!saved.updatedAt || (knownDraft && knownDraft.id !== saved.versionId))
    ) {
      queryClient.invalidateQueries({ queryKey: policyKeys.list() })
      queryClient.invalidateQueries({ queryKey: detailKey })
      return
    }
    const draft =
      saved.versionId && saved.updatedAt
        ? {
            id: saved.versionId,
            status: "Draft" as const,
            version_number: "draft",
            title: snapshot.title.trim(),
            summary: snapshot.summary.trim() || null,
            change_summary: knownDraft?.change_summary ?? null,
            effective_at: knownDraft?.effective_at ?? null,
            published_at: knownDraft?.published_at ?? null,
            updated_at: saved.updatedAt,
            author: { full_name: profile?.full_name ?? null },
          }
        : null
    if (draft)
      queryClient.setQueryData(
        policyKeys.body(draft.id, draft.updated_at),
        snapshot.body,
      )
    const withDraft = <V extends { id: string; status: string }>(
      versions: V[],
      pick: (d: NonNullable<typeof draft>) => V,
    ) =>
      draft
        ? [...versions.filter((v) => v.status !== "Draft"), pick(draft)]
        : versions
    queryClient.setQueryData<PolicyDetail | null>(detailKey, (old) =>
      old
        ? { ...old, category, versions: withDraft(old.versions, (d) => d) }
        : old,
    )
    queryClient.setQueryData<PolicyListItem[]>(policyKeys.list(), (old) =>
      old?.map((p) =>
        p.id === docId
          ? {
              ...p,
              category,
              versions: withDraft(p.versions ?? [], (d) => ({
                id: d.id,
                status: d.status,
                version_number: d.version_number,
                title: d.title,
                effective_at: d.effective_at,
                published_at: d.published_at,
                updated_at: d.updated_at,
              })),
            }
          : p,
      ),
    )
  }

  // Autosave once typing pauses; a rule needs a title before it is created.
  function scheduleAutosave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      autosaveTimer.current = null
      if (saveStateRef.current !== "dirty") return
      const current = currentForm()
      if (isSaved(current)) {
        setSaveState(docIdRef.current ? "saved" : "idle")
        return
      }
      if (!current.title.trim()) return
      void save()
    }, AUTOSAVE_MS)
  }
  useEffect(
    () => () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    },
    [],
  )

  useEffect(() => {
    const unsaved = saveState === "dirty" || saveState === "saving"
    if (!unsaved) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [saveState])

  // ⌘S / Ctrl+S saves right away.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (!formRef.current.title.trim()) {
          toast.error(tRef.current("titleFirst"))
          return
        }
        void save()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [save])

  const publish = async () => {
    if (!form.title.trim()) return toast.error(t("titleRequired"))
    if (!currentForm().body.trim()) return toast.error(t("bodyEmpty"))
    const saved = saveState === "saved" && docId ? docId : await save()
    if (saved) setPublishing(true)
  }

  // Unsaved edits ask first (save / discard / keep editing); a save already
  // in flight just finishes before leaving.
  const close = useCallback(async () => {
    const state = saveStateRef.current
    if (state === "dirty") {
      setConfirmClose(true)
      return
    }
    if (state === "saving") await inFlight.current
    onExit({ id: docIdRef.current })
  }, [onExit])
  closeRef.current = () => void close()

  const saveAndClose = async () => {
    if (!formRef.current.title.trim()) {
      toast.error(t("titleFirstToSave"))
      return
    }
    const saved = await save()
    if (!saved) return
    setConfirmClose(false)
    onExit({ id: saved })
  }

  const shownAuthor = profile?.full_name ?? author ?? "Admin"
  const title = form.title.trim() || t("untitled")

  return (
    <>
      <header className="border-border flex h-14 shrink-0 items-center gap-2 border-b pr-3 pl-5">
        <RiBookOpenLine className="text-muted-foreground size-4 shrink-0" />
        <DialogTitle className="flex min-w-0 items-center gap-1.5 text-sm font-normal">
          <span className="text-muted-foreground shrink-0">{t("title")}</span>
          <span className="text-muted-foreground/60">/</span>
          <span className="truncate font-medium">{title}</span>
        </DialogTitle>
        <ListChip className="ml-1 shrink-0">
          {hasPublished ? t("changeDraft") : t("draft")}
        </ListChip>
        <SaveStatus state={saveState} />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Select
            value={form.category}
            onValueChange={(v) => v && set("category", v)}
          >
            <SelectTrigger
              size="sm"
              className="w-40"
              aria-label={t("category")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {[...new Set([...POLICY_CATEGORIES, form.category])].map((c) => (
                <SelectItem key={c} value={c}>
                  {categoryLabel(t, c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={publish} disabled={saveState === "saving"}>
            {t("publish")}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={tc("close")}
            className="text-muted-foreground"
            onClick={() => void close()}
          >
            <RiCloseLine />
          </Button>
        </div>
      </header>

      <div className="border-border flex h-12 shrink-0 items-center overflow-x-auto border-b px-3">
        {editor && <DocToolbar editor={editor} />}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-8 pt-12 pb-32 sm:px-16">
          <textarea
            rows={1}
            maxLength={160}
            autoFocus={!id}
            placeholder={t("titlePlaceholder")}
            aria-label={t("titlePlaceholder")}
            value={form.title}
            onChange={(e) => set("title", e.target.value.replace(/\n/g, " "))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (!editor) return
                // Synchronous, so keys typed right after land in the body.
                editor.commands.setTextSelection(1)
                editor.view.focus()
              }
            }}
            className="text-heading placeholder:text-muted-foreground/50 field-sizing-content w-full resize-none border-0 bg-transparent p-0 text-4xl leading-tight font-semibold tracking-tight shadow-none outline-none focus:ring-0"
          />

          <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span>
              {t("lastEdited")}{" "}
              {savedAt
                ? format(new Date(savedAt), "d MMM yyyy, HH:mm", {
                    locale: dateLocale,
                  })
                : t("notSavedYet")}
            </span>
            <span className="flex items-center gap-2">
              {t("by")}
              <Avatar className="size-5">
                <AvatarFallback className="text-[9px]">
                  {shownAuthor.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-foreground">{shownAuthor}</span>
            </span>
          </div>

          <input
            maxLength={300}
            placeholder={t("summaryPlaceholder")}
            aria-label={t("summaryLabel")}
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
            className="text-muted-foreground placeholder:text-muted-foreground/50 mt-3 w-full border-0 bg-transparent p-0 text-[15px] shadow-none outline-none focus:ring-0"
          />

          <Separator className="my-8" />

          <div className="relative">
            <EditorContent editor={editor} />
            {editor && <BlockHandle editor={editor} />}
          </div>

          {/* A blank rule offers the common blocks, like a fresh doc. */}
          {editor?.isEmpty && (
            <div className="mt-2 flex flex-wrap gap-2">
              {BLOCK_ITEMS.filter((b) =>
                [
                  "h2",
                  "bullet",
                  "ordered",
                  "table",
                  "quote",
                  "divider",
                ].includes(b.id),
              ).map((b) => (
                <Button
                  key={b.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => b.run(editor)}
                >
                  <b.icon data-icon="inline-start" />
                  {t(b.title)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {editor && <SelectionMenu editor={editor} />}
      <SlashMenu bridge={slash} />

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("saveChangesTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("saveChangesDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setConfirmClose(false)}>
              {tc("cancel")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmClose(false)
                onExit({ id: docIdRef.current })
              }}
            >
              {t("dontSave")}
            </Button>
            <Button onClick={saveAndClose} disabled={saveState === "saving"}>
              {saveState === "saving" && <Spinner data-icon="inline-start" />}
              {tc("save")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {docId && (
        <PublishDialog
          policyId={docId}
          title={form.title}
          nextVersion={nextVersion}
          open={publishing}
          onOpenChange={setPublishing}
          onPublished={() => {
            queryClient.invalidateQueries({ queryKey: policyKeys.all })
            onExit({ id: docId, published: true })
          }}
        />
      )}
    </>
  )
}

function SaveStatus({ state }: { state: SaveState }) {
  const t = useT("policies")
  if (state === "idle") return null
  const label =
    state === "saving"
      ? t("statusSaving")
      : state === "dirty"
        ? t("statusDirty")
        : state === "error"
          ? t("statusError")
          : t("statusSaved")
  const Icon = state === "error" ? CloudOff : Cloud
  return (
    <span
      className={cn(
        "text-muted-foreground hidden shrink-0 items-center gap-1.5 text-xs sm:flex",
        state === "error" && "text-destructive",
      )}
      aria-live="polite"
    >
      {state === "saving" ? (
        <Spinner className="size-3.5" />
      ) : (
        <Icon className="size-3.5" />
      )}
      {label}
    </span>
  )
}

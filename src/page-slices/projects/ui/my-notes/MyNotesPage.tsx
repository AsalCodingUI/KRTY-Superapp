"use client"

import { useNewParam } from "@/shared/hooks/useNewParam"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyValue } from "@/components/empty-value"
import { RichTextField } from "@/components/rich-text-field"
import { EmptyState } from "@/components/empty-state"
import { pageFillHeightClassName } from "@/components/page-sheet"
import { surfaceClassName } from "@/components/panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiPushpinLine,
  RiSearchLine,
  RiStickyNoteLine,
} from "@/shared/ui/lucide-icons"
import { format, isToday } from "date-fns"
import { ContextTarget, copyText, type CtxItem } from "@/shared/context-menu"
import { Copy, CopyPlus, FileText, Pin, Trash2 } from "@/components/icons"
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { toast } from "sonner"
import {
  useNoteWriter,
  useNotes,
  type Note,
  type NotePatch,
  type NoteTodo,
} from "./notes-data"

// Borderless fields, as in the task dialog (the base styles give inputs a
// border and padding, so both are cleared).
const FIELD_TITLE =
  "font-heading placeholder:text-muted-foreground field-sizing-content w-full resize-none border-0 bg-transparent p-0 text-xl leading-snug font-normal tracking-tight outline-none focus:ring-0! focus:ring-offset-0!"
const FIELD_INLINE =
  "min-w-0 flex-1 border-0 bg-transparent p-0 text-meta outline-none focus:ring-0! focus:ring-offset-0!"

const newTodo = (): NoteTodo => ({
  id: crypto.randomUUID(),
  text: "",
  done: false,
})

/** "3/5" when the note has to-dos. */
function progress(todos: NoteTodo[]) {
  return todos.length
    ? `${todos.filter((t) => t.done).length}/${todos.length}`
    : null
}

/**
 * Catatan saya: the viewer's own notes and to-do lists. The list sits on
 * the left; the open note is edited in a panel docked on the right that
 * never closes (the list narrows to make room). Edits save as you type.
 */
export function MyNotesPage() {
  const t = useT("projects")
  const tm = useT("ctxmenu")
  const dateLocale = useDateLocale()
  // Whose notes: the person being viewed (so "Lihat sebagai" shows theirs,
  // read-only; RLS lets only super admins read others'). Wait for the
  // session, or the admin's own notes flash in first.
  const {
    profile,
    isImpersonating: readOnly,
    loading: sessionLoading,
  } = useUserProfile()
  const ownerId = sessionLoading ? null : (profile?.id ?? null)
  const { data: notes = [], isLoading } = useNotes(ownerId)
  const writer = useNoteWriter(ownerId, () => toast.error(t("notesErrSave")))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [deleting, setDeleting] = useState<Note | null>(null)
  // A note just made gets the cursor in its title; opening one doesn't.
  const [freshId, setFreshId] = useState<string | null>(null)

  // Keep a note open: the chosen one, else the first.
  const selected =
    notes.find((n) => n.id === selectedId) ?? (selectedId ? null : notes[0])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return notes
    return notes.filter((n) =>
      [n.title, n.body, ...n.todos.map((td) => td.text)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [notes, query])

  // isPending only disables the button after a render, so a fast double
  // click still made two notes.
  const creating = useRef(false)
  const createNote = () => {
    if (creating.current) return
    creating.current = true
    writer.create.mutate(undefined, {
      onSuccess: (note) => {
        setSelectedId(note.id)
        setFreshId(note.id)
      },
      onSettled: () => {
        creating.current = false
      },
    })
  }

  // The sidebar's + menu: Catatan baru.
  useNewParam(createNote, !readOnly)

  /** A copy of the note (title, text, to-dos), opened. */
  const duplicateNote = (note: Note) => {
    if (creating.current) return
    creating.current = true
    writer.create.mutate(undefined, {
      onSuccess: (copy) => {
        writer.update.mutate({
          id: copy.id,
          patch: {
            title: note.title ? t("ctxCopyOf", { name: note.title }) : "",
            body: note.body,
            todos: note.todos.map((td) => ({ ...td, id: crypto.randomUUID() })),
          },
        })
        setSelectedId(copy.id)
        toast.success(t("ctxDuplicated"))
      },
      onSettled: () => {
        creating.current = false
      },
    })
  }

  /** The note as plain text: title, to-dos as a checklist, then the text. */
  const noteText = (note: Note) =>
    [
      note.title,
      note.todos
        .filter((td) => td.text.trim())
        .map((td) => `${td.done ? "[x]" : "[ ]"} ${td.text}`)
        .join("\n"),
      note.body,
    ]
      .filter((part) => part.trim())
      .join("\n\n")

  const noteItems = (note: Note): CtxItem[] => [
    {
      id: "open",
      label: t("libOpen"),
      icon: FileText,
      shortcut: "Enter",
      hidden: note.id === selected?.id,
      onSelect: () => setSelectedId(note.id),
    },
    {
      id: "pin",
      label: t("notesPin"),
      icon: Pin,
      role: "checkbox",
      checked: note.pinned,
      hidden: readOnly,
      onSelect: () =>
        writer.update.mutate({ id: note.id, patch: { pinned: !note.pinned } }),
    },
    {
      id: "duplicate",
      label: tm("duplicate"),
      icon: CopyPlus,
      hidden: readOnly,
      onSelect: () => duplicateNote(note),
    },
    {
      id: "copy-text",
      label: t("ctxCopyText"),
      icon: Copy,
      onSelect: async () => {
        if (await copyText(noteText(note))) toast.success(tm("copied"))
      },
    },
    {
      id: "delete",
      label: t("notesDelete"),
      icon: Trash2,
      destructive: true,
      hidden: readOnly,
      // The delete dialog asks first.
      onSelect: () => setDeleting(note),
    },
  ]

  const when = (iso: string) =>
    isToday(new Date(iso))
      ? format(new Date(iso), "HH:mm")
      : format(new Date(iso), "d MMM", { locale: dateLocale })

  if (sessionLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }
  return (
    // Two panes filling the sheet (Gumloop-style): the list on the left,
    // a hairline between, the open note in a bordered card on the right.
    // Each pane scrolls on its own; the page doesn't. Below lg they stack.
    <div
      className={cn(
        "flex min-h-[520px] gap-6 pt-6 max-lg:h-auto max-lg:flex-col",
        pageFillHeightClassName,
      )}
    >
      <div className="border-border flex min-h-0 w-full shrink-0 flex-col gap-3 lg:w-72 lg:border-r lg:pr-6">
        {/* The title row: the page's name, + Catatan baru (or read-only). */}
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h1 className="text-heading text-title truncate font-medium">
            {t("myNotesTitle")}
          </h1>
          {readOnly ? (
            <Badge variant="secondary">
              <RiEyeLine data-icon="inline-start" />
              {t("notesReadOnly")}
            </Badge>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={t("notesNew")}
                    onClick={createNote}
                    disabled={writer.create.isPending}
                  />
                }
              >
                <RiAddLine />
              </TooltipTrigger>
              <TooltipContent>{t("notesNew")}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <InputGroup className="w-full">
          <InputGroupAddon>
            <RiSearchLine />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder={t("notesSearch")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>

        {/* The notes: title, then a preview and when it was edited. */}
        <div className="scroll-fade -mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1 pb-1">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner className="size-6" />
            </div>
          ) : notes.length === 0 ? (
            <EmptyState
              placement="inner"
              title={t("notesEmptyTitle")}
              description={t("notesEmptyDesc")}
              icon={<RiStickyNoteLine className="size-5" />}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              placement="inner"
              title={t("notesNoMatch")}
              icon={<RiSearchLine className="size-5" />}
            />
          ) : (
            filtered.map((note) => {
              const done = progress(note.todos)
              const preview =
                note.body.split("\n").find((l) => l.trim()) ??
                note.todos.find((td) => td.text.trim())?.text ??
                ""
              const active = note.id === selected?.id
              return (
                <ContextTarget
                  key={note.id}
                  type="personal-note"
                  id={note.id}
                  label={note.title || t("notesUntitled")}
                  items={() => noteItems(note)}
                >
                  <button
                    type="button"
                    aria-current={active || undefined}
                    onClick={() => setSelectedId(note.id)}
                    className={cn(
                      "focus-visible:ring-focus-ring flex w-full min-w-0 flex-col gap-0.5 rounded-lg px-3 py-2 text-left outline-none focus-visible:ring-2",
                      active ? "bg-muted" : "hover:bg-muted/60",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-1.5 text-sm">
                      {note.pinned && (
                        <RiPushpinLine
                          aria-label={t("notesPinned")}
                          className="text-muted-foreground size-3.5 shrink-0"
                        />
                      )}
                      <span
                        className={cn(
                          "truncate",
                          active && "font-medium",
                          note.title
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {note.title || t("notesUntitled")}
                      </span>
                    </span>
                    <span className="text-tertiary-foreground text-meta flex min-w-0 items-center gap-1.5 tabular-nums">
                      <span className="shrink-0">{when(note.updated_at)}</span>
                      {done && <span className="shrink-0">· {done}</span>}
                      {preview && <span className="truncate">· {preview}</span>}
                    </span>
                  </button>
                </ContextTarget>
              )
            })
          )}
        </div>
      </div>

      {/* The open note: a bordered card with its own bar (saved state,
          the note's name, pin and delete) over the editor. */}
      <section
        aria-label={t("myNotesTitle")}
        className={cn(
          surfaceClassName,
          "flex min-h-96 min-w-0 flex-1 flex-col overflow-hidden text-sm",
        )}
      >
        {selected ? (
          <NoteEditor
            key={selected.id}
            note={selected}
            autoFocus={selected.id === freshId}
            readOnly={readOnly}
            onPatch={(patch) =>
              writer.update.mutate({ id: selected.id, patch })
            }
            onDelete={() => setDeleting(selected)}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
            <EmptyState
              placement="inner"
              title={t("notesPickTitle")}
              icon={<RiStickyNoteLine className="size-5" />}
            />
            {!readOnly && (
              <Button variant="outline" onClick={createNote}>
                <RiAddLine data-icon="inline-start" />
                {t("notesNew")}
              </Button>
            )}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("notesDeleteTitle")}
        description={t("notesDeleteDesc")}
        confirmText={t("notesDelete")}
        variant="destructive"
        onConfirm={() => {
          if (!deleting) return
          writer.remove.mutate(deleting.id)
          if (deleting.id === selected?.id) setSelectedId(null)
          setDeleting(null)
        }}
      />
    </div>
  )
}

/**
 * One note in the docked panel: title, to-dos, then free text. Typing is
 * saved after a short pause; ticking a to-do saves at once.
 */
function NoteEditor({
  note,
  autoFocus,
  readOnly,
  onPatch,
  onDelete,
}: {
  note: Note
  autoFocus: boolean
  /** Viewing someone else's note ("Lihat sebagai"): nothing is editable. */
  readOnly: boolean
  onPatch: (patch: NotePatch) => void
  onDelete: () => void
}) {
  const t = useT("projects")
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [todos, setTodos] = useState(note.todos)
  const [draft, setDraft] = useState("")
  const [pending, setPending] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef<NotePatch>({})
  const focusId = useRef<string | null>(null)

  const flush = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (Object.keys(latest.current).length) onPatch(latest.current)
    latest.current = {}
    setPending(false)
  }
  const save = (patch: NotePatch, now = false) => {
    latest.current = { ...latest.current, ...patch }
    setPending(true)
    if (timer.current) clearTimeout(timer.current)
    if (now) flush()
    else timer.current = setTimeout(flush, 600)
  }
  // Leaving the note (another one, or the page) saves what's left.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => flush(), [])

  const setTodo = (id: string, patch: Partial<NoteTodo>, now = false) => {
    const next = todos.map((td) => (td.id === id ? { ...td, ...patch } : td))
    setTodos(next)
    save({ todos: next }, now)
  }
  const removeTodo = (id: string) => {
    const index = todos.findIndex((td) => td.id === id)
    const next = todos.filter((td) => td.id !== id)
    setTodos(next)
    save({ todos: next }, true)
    focusId.current = next[Math.max(0, index - 1)]?.id ?? null
  }
  const insertTodoAfter = (id: string) => {
    const index = todos.findIndex((td) => td.id === id)
    const item = newTodo()
    const next = [...todos.slice(0, index + 1), item, ...todos.slice(index + 1)]
    setTodos(next)
    save({ todos: next })
    focusId.current = item.id
  }
  const addDraft = () => {
    if (!draft.trim()) return
    const next = [{ ...newTodo(), text: draft.trim() }, ...todos]
    setTodos(next)
    setDraft("")
    save({ todos: next }, true)
  }

  const done = todos.filter((td) => td.done).length

  return (
    <>
      <SheetBar
        title={title || t("notesUntitled")}
        status={readOnly ? null : pending ? t("notesSaving") : t("notesSaved")}
      >
        {/* Read-only is already badged over the list. */}
        {readOnly ? null : (
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-pressed={note.pinned}
                    aria-label={note.pinned ? t("notesUnpin") : t("notesPin")}
                    className={cn(
                      note.pinned
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => onPatch({ pinned: !note.pinned })}
                  />
                }
              >
                <RiPushpinLine fill={note.pinned ? "currentColor" : "none"} />
              </TooltipTrigger>
              <TooltipContent>
                {note.pinned ? t("notesUnpin") : t("notesPin")}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("notesDelete")}
                    className="text-muted-foreground hover:text-destructive-ink"
                    onClick={onDelete}
                  />
                }
              >
                <RiDeleteBinLine />
              </TooltipTrigger>
              <TooltipContent>{t("notesDelete")}</TooltipContent>
            </Tooltip>
          </>
        )}
      </SheetBar>

      {/* Same fields as the task dialog: title, free text, then the
          checklist like its subtasks. */}
      {/* A readable measure, centred in the card (a document view). */}
      <div className="scroll-pane pane-px-5 flex min-h-0 flex-1 flex-col gap-6 pt-6 pb-8 *:mx-auto *:w-full *:max-w-2xl">
        <div className="flex flex-col gap-1.5">
          <textarea
            rows={1}
            value={title}
            autoFocus={autoFocus}
            readOnly={readOnly}
            placeholder={t("notesTitlePlaceholder")}
            aria-label={t("notesTitlePlaceholder")}
            onChange={(e) => {
              setTitle(e.target.value.replace(/\n/g, " "))
              save({ title: e.target.value.replace(/\n/g, " ") })
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault()
            }}
            className={FIELD_TITLE}
          />
          <RichTextField
            value={body}
            readOnly={readOnly}
            placeholder={t("notesBodyPlaceholder")}
            aria-label={t("notesBody")}
            onChange={(value) => {
              setBody(value)
              save({ body: value })
            }}
            className="text-foreground/90 text-meta min-h-12 leading-relaxed"
          />
        </div>

        <section className="flex flex-col gap-1">
          <h3 className="text-muted-foreground text-meta flex items-center gap-2 pb-1">
            {t("notesTodo")}
            {todos.length > 0 && (
              <span className="tabular-nums">
                {done}/{todos.length}
              </span>
            )}
          </h3>
          {todos.length > 0 && (
            <div
              className="bg-muted mb-1.5 h-1 overflow-hidden rounded-full"
              aria-hidden
            >
              <div
                className="bar-grow bg-success h-full rounded-full"
                style={
                  {
                    "--bar": `${(done / todos.length) * 100}%`,
                  } as CSSProperties
                }
              />
            </div>
          )}
          {/* New to-dos are added (and land) at the top. */}
          {readOnly ? (
            todos.length === 0 && (
              <p className="text-muted-foreground text-meta">
                <EmptyValue />
              </p>
            )
          ) : (
            <div className="flex items-center gap-2.5">
              <RiAddLine className="text-muted-foreground size-4 shrink-0" />
              <Input
                value={draft}
                placeholder={t("notesAddTodo")}
                aria-label={t("notesAddTodo")}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addDraft()
                  }
                }}
                onBlur={addDraft}
                className="flex-1"
              />
            </div>
          )}
          {todos.map((td) => (
            <div
              key={td.id}
              className="group/todo text-meta flex min-h-9 items-center gap-2.5"
            >
              <Checkbox
                checked={td.done}
                disabled={readOnly}
                onCheckedChange={(checked) =>
                  setTodo(td.id, { done: checked === true }, true)
                }
                aria-label={td.text || t("notesTodo")}
              />
              <input
                ref={(el) => {
                  if (el && focusId.current === td.id) {
                    el.focus()
                    focusId.current = null
                  }
                }}
                value={td.text}
                readOnly={readOnly}
                aria-label={t("notesTodo")}
                onChange={(e) => setTodo(td.id, { text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    insertTodoAfter(td.id)
                  } else if (e.key === "Backspace" && !td.text) {
                    e.preventDefault()
                    removeTodo(td.id)
                  }
                }}
                className={cn(
                  FIELD_INLINE,
                  td.done && "text-muted-foreground line-through",
                )}
              />
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("notesRemoveTodo")}
                  onClick={() => removeTodo(td.id)}
                  className="text-muted-foreground hover:text-destructive-ink opacity-0 group-hover/todo:opacity-100 focus-visible:opacity-100"
                >
                  <RiDeleteBinLine />
                </Button>
              )}
            </div>
          ))}
        </section>
      </div>
    </>
  )
}

/** The card's top bar (Gumloop's file bar): the save state on the left,
 *  the note's name centred and quiet, the actions on the right. */
function SheetBar({
  title,
  status,
  children,
}: {
  title: string
  status?: string | null
  children?: React.ReactNode
}) {
  return (
    <div className="border-border grid h-11 shrink-0 grid-cols-[1fr_minmax(0,2fr)_1fr] items-center gap-2 border-b px-3">
      <span className="text-tertiary-foreground truncate text-xs">
        {status}
      </span>
      <h2 className="text-muted-foreground text-meta truncate text-center">
        {title}
      </h2>
      <div className="flex items-center justify-end gap-0.5">{children}</div>
    </div>
  )
}

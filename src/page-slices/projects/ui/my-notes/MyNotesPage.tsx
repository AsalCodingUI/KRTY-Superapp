"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyValue } from "@/components/empty-value"
import { RichTextField } from "@/components/rich-text-field"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { PageHeader } from "@/components/page-header"
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
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  useNoteWriter,
  useNotes,
  type Note,
  type NotePatch,
  type NoteTodo,
} from "./notes-data"

const ROW_GRID = "grid grid-cols-[minmax(0,1fr)_4rem_5rem] items-center gap-x-4"

// Borderless fields, as in the task dialog (the base styles give inputs a
// border and padding, so both are cleared).
const FIELD_TITLE =
  "font-heading placeholder:text-muted-foreground field-sizing-content w-full resize-none border-0 bg-transparent p-0 text-xl leading-snug font-normal tracking-tight outline-none focus:ring-0! focus:ring-offset-0!"
const FIELD_INLINE =
  "min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] outline-none focus:ring-0! focus:ring-offset-0!"

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
    // From lg up the whole page makes room for the docked sheet on the
    // right, leaving the same gap before it as the page gutter on the left.
    <div className="flex flex-col pb-4 lg:pr-[27.75rem]">
      <PageHeader
        className="pt-6 pb-4"
        title={t("myNotesTitle")}
        actions={
          readOnly ? (
            <Badge variant="secondary">
              <RiEyeLine data-icon="inline-start" />
              {t("notesReadOnly")}
            </Badge>
          ) : (
            <Button onClick={createNote} disabled={writer.create.isPending}>
              <RiAddLine data-icon="inline-start" />
              {t("notesNew")}
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-6">
        {/* List: same toolbar and rows as Tugas saya. */}
        <div className="flex min-w-0 flex-col">
          <div className="pb-3">
            <InputGroup className="w-full sm:w-[260px]">
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
          </div>

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
            <GroupedList>
              <div
                className={cn(
                  ROW_GRID,
                  "text-muted-foreground border-border gutter-x border-b py-2 text-[13px]",
                )}
              >
                <span>{t("notesColNote")}</span>
                <span className="text-right">{t("notesTodo")}</span>
                <span className="text-right">{t("notesColEdited")}</span>
              </div>
              {filtered.map((note) => {
                const done = progress(note.todos)
                const preview =
                  note.body.split("\n").find((l) => l.trim()) ??
                  note.todos.find((td) => td.text.trim())?.text ??
                  ""
                const active = note.id === selected?.id
                return (
                  <ListRow
                    key={note.id}
                    role="button"
                    tabIndex={0}
                    aria-current={active || undefined}
                    onClick={() => setSelectedId(note.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setSelectedId(note.id)
                      }
                    }}
                    className={cn(
                      ROW_GRID,
                      "min-h-14 cursor-pointer py-2 outline-none",
                      // Selected: the hover highlight's shape (rounded,
                      // 2px off the dividers), kept on.
                      active &&
                        "*:relative before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-0.5 before:rounded-lg before:bg-(--row-selected)",
                    )}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="flex min-w-0 items-center gap-1.5">
                        {note.pinned && (
                          <RiPushpinLine
                            aria-label={t("notesPinned")}
                            className="text-muted-foreground size-3.5 shrink-0"
                          />
                        )}
                        <span
                          className={cn(
                            "truncate",
                            note.title
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {note.title || t("notesUntitled")}
                        </span>
                      </span>
                      {preview && (
                        <span className="text-tertiary-foreground truncate text-[13px]">
                          {preview}
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground text-right text-[13px] tabular-nums">
                      {done ?? <EmptyValue />}
                    </span>
                    <span className="text-muted-foreground text-right text-[13px] tabular-nums">
                      {when(note.updated_at)}
                    </span>
                  </ListRow>
                )
              })}
            </GroupedList>
          )}
        </div>

        {/* The open note in a sheet that's always there: the same panel as
            the right-hand sheets (notifications, project scores), docked
            instead of modal and without a close button. Below lg it sits
            under the list as a card. */}
        <aside
          data-slot="side-panel"
          aria-label={t("myNotesTitle")}
          className="bg-popover text-popover-foreground border-field-border dark:border-border lg:rounded-nested flex min-h-96 flex-col overflow-hidden rounded-3xl border bg-clip-padding text-sm lg:fixed lg:top-[calc(var(--app-topbar-height,0px)+var(--app-banner-height,0px)+0.5rem)] lg:right-5 lg:bottom-5 lg:z-30 lg:w-md lg:border-0 lg:shadow-(--elev-5) lg:[--nest-p:0.5rem] lg:[--nest-r:var(--radius-3xl)]"
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
            <>
              <SheetBar title={t("notesSheetTitle")} />
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
            </>
          )}
        </aside>
      </div>

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
      <SheetBar title={t("notesSheetTitle")}>
        {/* Read-only is already badged in the page header. */}
        {readOnly ? null : (
          <>
            <span className="text-tertiary-foreground mr-1 text-xs">
              {pending ? t("notesSaving") : t("notesSaved")}
            </span>
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
                    className="text-muted-foreground hover:text-destructive"
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
      <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-5 pt-5 pb-6 [scrollbar-gutter:stable]">
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
            className="text-foreground/90 min-h-12 text-[13.5px] leading-relaxed"
          />
        </div>

        <section className="flex flex-col gap-1">
          <h3 className="text-muted-foreground flex items-center gap-2 pb-1 text-[13px]">
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
                className="bg-success h-full rounded-full transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ width: `${(done / todos.length) * 100}%` }}
              />
            </div>
          )}
          {/* New to-dos are added (and land) at the top. */}
          {readOnly ? (
            todos.length === 0 && (
              <p className="text-muted-foreground text-[13px]">
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
                className="h-8 flex-1 text-[13px]"
              />
            </div>
          )}
          {todos.map((td) => (
            <div
              key={td.id}
              className="group/todo flex min-h-9 items-center gap-2.5 text-[13px]"
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
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover/todo:opacity-100 focus-visible:opacity-100"
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

/** The sheet's top bar: a title on the left, actions on the right (same
 *  bar as SheetHeader, outside a modal sheet). */
function SheetBar({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="border-border flex min-h-[3.25rem] shrink-0 items-center gap-1 border-b pr-3 pl-5">
      <h2 className="font-heading text-heading text-[15px] font-medium">
        {title}
      </h2>
      <div className="ml-auto flex items-center gap-0.5">{children}</div>
    </div>
  )
}

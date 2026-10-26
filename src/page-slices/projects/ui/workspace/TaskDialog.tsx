"use client"

import { MarkdownDocEditor } from "@/page-slices/policies/ui/doc-editor"
import dynamic from "next/dynamic"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyValue } from "@/components/empty-value"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  RiAddLine,
  RiArrowUpLine,
  RiCalendarLine,
  RiDeleteBinLine,
} from "@/shared/ui/lucide-icons"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { useQueryClient } from "@tanstack/react-query"
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  isToday,
} from "date-fns"
import { AnimatePresence, m, useReducedMotion } from "motion/react"
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  supabase,
  uploadInternalAsset,
  useWorkspace,
  type TaskRow,
  type TeamMember,
} from "./data"
import { StatusDot } from "./TaskBoard"
import {
  STATUS_LABEL,
  TASK_STATUSES,
  commentKeys,
  statusOf,
  useTaskComments,
  type CommentAuthor,
  type TaskStatus,
} from "./task-data"
import { dueLabel, initials } from "./task-utils"

// Month grid (react-day-picker) loads when the due-date popover first opens.
const Calendar = dynamic(
  () => import("@/components/ui/calendar").then((m) => m.Calendar),
  {
    ssr: false,
    loading: () => <div className="h-[296px] w-[252px]" aria-busy />,
  },
)

const NONE = "__none__"
const EASE = [0.23, 1, 0.32, 1] as const

/**
 * A task opened from the board or list: title, status, PIC, due date,
 * description, subtasks, and the comment thread with @mentions.
 */
export function TaskDialog({
  task,
  open,
  onOpenChange,
  projectId,
  subtasks,
  team,
  viewerId,
  onPatch,
  onStatus,
  onAddSub,
  onRemove,
}: {
  /** Stays set while the dialog animates closed. */
  task: TaskRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  subtasks: TaskRow[]
  team: TeamMember[]
  viewerId: string | null
  onPatch: (id: string, patch: Partial<TaskRow>) => void
  onStatus: (task: TaskRow, status: TaskStatus) => void
  onAddSub: (title: string, parentId: string) => Promise<boolean>
  onRemove: (id: string) => void
}) {
  const t = useT("projects")
  return (
    <Dialog open={open && Boolean(task)} onOpenChange={onOpenChange}>
      <DialogContent
        bare
        className="h-[min(46rem,calc(100svh-4rem))] overflow-hidden max-md:overflow-y-auto sm:max-w-[60rem] md:grid-cols-[minmax(0,1fr)_19rem]"
      >
        {task && (
          <>
            <DialogTitle className="sr-only">{task.title}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("sectionTasks")}
            </DialogDescription>
            <TaskBody
              key={task.id}
              task={task}
              projectId={projectId}
              subtasks={subtasks}
              team={team}
              viewerId={viewerId}
              onPatch={onPatch}
              onStatus={onStatus}
              onAddSub={onAddSub}
              onRemove={onRemove}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TitleField({
  task,
  onSave,
}: {
  task: TaskRow
  onSave: (title: string) => void
}) {
  const t = useT("projects")
  const [title, setTitle] = useState(task.title)
  const save = () => {
    const value = title.trim()
    if (value && value !== task.title) onSave(value)
    else setTitle(task.title)
  }
  return (
    <textarea
      rows={1}
      value={title}
      aria-label={t("taskTitleLabel")}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          e.currentTarget.blur()
        }
        if (e.key === "Escape" && title !== task.title) {
          e.stopPropagation()
          setTitle(task.title)
        }
      }}
      className="font-heading placeholder:text-muted-foreground field-sizing-content w-full resize-none border-0 bg-transparent p-0 text-xl leading-snug font-normal tracking-tight outline-none focus:ring-0! focus:ring-offset-0!"
    />
  )
}

function TaskBody({
  task,
  projectId,
  subtasks,
  team,
  viewerId,
  onPatch,
  onStatus,
  onAddSub,
  onRemove,
}: {
  task: TaskRow
  projectId: string
  subtasks: TaskRow[]
  team: TeamMember[]
  viewerId: string | null
  onPatch: (id: string, patch: Partial<TaskRow>) => void
  onStatus: (task: TaskRow, status: TaskStatus) => void
  onAddSub: (title: string, parentId: string) => Promise<boolean>
  onRemove: (id: string) => void
}) {
  const t = useT("projects")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const [description, setDescription] = useState(task.description ?? "")
  const { data: workspace } = useWorkspace(projectId)
  const projectName = workspace?.project?.name ?? "project"
  const [subTitle, setSubTitle] = useState("")
  const [dateOpen, setDateOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // One subtask per Enter, even when it's pressed again before the save lands.
  const addingSub = useRef(false)
  const addSub = async () => {
    if (addingSub.current || !subTitle.trim()) return
    addingSub.current = true
    const ok = await onAddSub(subTitle, task.id)
    addingSub.current = false
    if (ok) setSubTitle("")
  }
  const status = statusOf(task)
  const assignee = team.find((m) => m.id === task.assignee_id)
  const due = task.due_date ? new Date(`${task.due_date}T00:00:00`) : null
  const overdue =
    due && !task.done && differenceInCalendarDays(due, new Date()) < 0
  const doneSubs = subtasks.filter((s) => s.done).length

  const saveDescription = () => {
    const value = description.trim() || null
    if (value !== (task.description ?? null))
      onPatch(task.id, { description: value })
  }

  const thread = useThread(task.id, projectId, team)
  const scrollRef = useRef<HTMLDivElement>(null)
  // A new comment lands at the bottom of the thread; bring it into view.
  const post = async (text: string, mentions: string[]) => {
    const ok = await thread.post(text, mentions)
    if (ok)
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        }),
      )
    return ok
  }

  return (
    <>
      {/* Main column: content scrolls, the comment box stays at the bottom. */}
      <div className="flex min-h-0 flex-col">
        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-6 pt-6 pb-6 md:px-8 md:pt-7"
        >
          <div className="flex flex-col gap-1.5">
            <TitleField
              task={task}
              onSave={(title) => onPatch(task.id, { title })}
            />
            {/* The documents editor, inline: "/" blocks, handles, images. */}
            <MarkdownDocEditor
              key={task.id}
              compact
              value={description}
              placeholder={t("taskDescriptionPlaceholder")}
              ariaLabel={t("taskDescription")}
              onChange={setDescription}
              onBlur={saveDescription}
              // Task descriptions are internal: their pictures and
              // attachments stay private.
              onUploadImage={(file, original) =>
                uploadInternalAsset(projectId, projectName, file, original)
              }
              onUploadFile={(file) =>
                uploadInternalAsset(projectId, projectName, file)
              }
              className="text-foreground/90"
            />
          </div>

          <section className="flex flex-col gap-1">
            <h3 className="text-muted-foreground flex items-center gap-2 pb-1 text-[13px]">
              {t("taskSubtasks")}
              {subtasks.length > 0 && (
                <span className="tabular-nums">
                  {doneSubs}/{subtasks.length}
                </span>
              )}
            </h3>
            {subtasks.length > 0 && (
              <div
                className="bg-muted mb-1.5 h-1 overflow-hidden rounded-full"
                aria-hidden
              >
                <div
                  className="bg-success h-full rounded-full transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                  style={{ width: `${(doneSubs / subtasks.length) * 100}%` }}
                />
              </div>
            )}
            {/* New subtasks are added (and land) at the top. */}
            <div className="flex items-center gap-2.5">
              <RiAddLine className="text-muted-foreground size-4 shrink-0" />
              <Input
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addSub()
                }}
                placeholder={t("addSubtask")}
                aria-label={t("addSubtask")}
                className="h-8 flex-1 text-[13px]"
              />
            </div>
            {subtasks.map((sub) => (
              <div
                key={sub.id}
                className="group/sub flex min-h-9 items-center gap-2.5 text-[13px]"
              >
                <Checkbox
                  checked={sub.done}
                  onCheckedChange={() =>
                    onStatus(sub, sub.done ? "todo" : "done")
                  }
                  aria-label={sub.done ? t("markUndone") : t("markDone")}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    sub.done && "text-muted-foreground line-through",
                  )}
                >
                  {sub.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("deleteSubtask")}
                  onClick={() => onRemove(sub.id)}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover/sub:opacity-100 focus-visible:opacity-100"
                >
                  <RiDeleteBinLine />
                </Button>
              </div>
            ))}
          </section>

          <CommentList thread={thread} viewerId={viewerId} />
        </div>

        <div className="border-border border-t">
          <Composer team={team} onPost={post} />
        </div>
      </div>

      <aside className="border-border bg-muted/40 dark:bg-foreground/[0.02] flex flex-col gap-4 border-t px-4 pt-5 pb-5 md:border-t-0 md:border-l md:pt-14">
        <dl className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5 text-[13px]">
          <dt className="text-muted-foreground">{t("taskStatus")}</dt>
          <dd>
            <Select
              value={status}
              onValueChange={(v) => v && onStatus(task, v as TaskStatus)}
            >
              <SelectTrigger
                size="sm"
                className="hover:bg-accent w-full border-transparent bg-transparent px-2.5 text-[13px] shadow-none hover:border-transparent"
              >
                <SelectValue>
                  {(v: TaskStatus) => (
                    <span className="flex items-center gap-2">
                      <Lead>
                        <StatusDot status={v} />
                      </Lead>
                      {t(STATUS_LABEL[v])}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-2">
                      <StatusDot status={s} />
                      {t(STATUS_LABEL[s])}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </dd>

          <dt className="text-muted-foreground">{t("colPic")}</dt>
          <dd>
            <Select
              value={task.assignee_id ?? NONE}
              onValueChange={(v) =>
                v && onPatch(task.id, { assignee_id: v === NONE ? null : v })
              }
            >
              <SelectTrigger
                size="sm"
                className="hover:bg-accent w-full border-transparent bg-transparent px-2.5 text-[13px] shadow-none hover:border-transparent"
              >
                <SelectValue>
                  {() =>
                    assignee ? (
                      <span className="flex min-w-0 items-center gap-2">
                        <Lead>
                          <PersonAvatar person={assignee} />
                        </Lead>
                        <span className="truncate">{assignee.full_name}</span>
                      </span>
                    ) : (
                      <EmptyValue />
                    )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("noPic")}</SelectItem>
                {team.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </dd>

          <dt className="text-muted-foreground">{t("factsDeadline")}</dt>
          <dd>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2 px-2.5 text-[13px] font-normal",
                      due
                        ? overdue
                          ? "text-destructive"
                          : isToday(due) && !task.done
                            ? "text-warning"
                            : "text-foreground"
                        : "text-muted-foreground",
                    )}
                  />
                }
              >
                <Lead>
                  <RiCalendarLine className="size-3.5" />
                </Lead>
                {task.due_date ? (
                  dueLabel(task.due_date, dateLocale, {
                    today: tc("today"),
                    tomorrow: t("tomorrow"),
                  })
                ) : (
                  <EmptyValue />
                )}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={due ?? undefined}
                  defaultMonth={due ?? undefined}
                  locale={dateLocale}
                  onSelect={(date) => {
                    onPatch(task.id, {
                      due_date: date ? format(date, "yyyy-MM-dd") : null,
                    })
                    setDateOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </dd>
        </dl>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          className="text-muted-foreground hover:text-destructive mt-auto self-start px-2.5 text-[13px] font-normal"
        >
          <RiDeleteBinLine data-icon="inline-start" />
          {t("deleteTask")}
        </Button>
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={t("deleteNamedTitle", { name: task.title })}
          description={t("deleteTaskDescription")}
          confirmText={tc("delete")}
          cancelText={tc("cancel")}
          variant="destructive"
          onConfirm={() => {
            setConfirmDelete(false)
            onRemove(task.id)
          }}
        />
      </aside>
    </>
  )
}

/** A fixed 20px slot so the dot, avatar and calendar line up in one column. */
function Lead({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-5 shrink-0 place-items-center">{children}</span>
  )
}

function PersonAvatar({
  person,
  className,
}: {
  person: { full_name: string | null; avatar_url: string | null }
  className?: string
}) {
  return (
    <Avatar className={cn("size-5", className)}>
      <AvatarImage src={person.avatar_url || undefined} alt="" />
      <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-medium">
        {initials(person.full_name)}
      </AvatarFallback>
    </Avatar>
  )
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** The body with each "@Name" of a mentioned person highlighted. */
function CommentBody({
  body,
  mentions,
  people,
}: {
  body: string
  mentions: string[]
  people: Record<string, CommentAuthor>
}) {
  const names = mentions
    .map((id) => people[id]?.full_name)
    .filter((n): n is string => Boolean(n))
    .sort((a, b) => b.length - a.length)
  if (!names.length) return <>{body}</>
  const pattern = new RegExp(`(@(?:${names.map(escapeRegExp).join("|")}))`)
  return (
    <>
      {body.split(pattern).map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className="bg-info-subtle text-info dark:text-blue-11 rounded-full px-1 font-medium"
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}

type Thread = ReturnType<typeof useThread>

/** Comments of one task, with the authors and post/remove actions. */
function useThread(taskId: string, projectId: string, team: TeamMember[]) {
  const t = useT("projects")
  const queryClient = useQueryClient()
  const { data, isLoading } = useTaskComments(taskId)
  const comments = data?.comments ?? []

  // Team first; anyone else (a stakeholder) from the thread's own lookup.
  const people = useMemo(() => {
    const map: Record<string, CommentAuthor> = { ...(data?.people ?? {}) }
    for (const member of team) map[member.id] = member
    return map
  }, [data?.people, team])

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: commentKeys.thread(taskId) }),
      queryClient.invalidateQueries({
        queryKey: commentKeys.counts(projectId),
      }),
    ])

  const post = async (body: string, mentions: string[]) => {
    const { error } = await supabase()
      .from("project_task_comments")
      // The author is whoever is signed in (the column defaults to
      // auth.uid()). Sending the viewed-as id while impersonating would fail
      // RLS: you can't post as someone else.
      .insert({ task_id: taskId, body, mentions })
    if (error) {
      toast.error(t("errComment"))
      return false
    }
    await refresh()
    return true
  }

  const remove = async (id: string) => {
    const { error } = await supabase()
      .from("project_task_comments")
      .delete()
      .eq("id", id)
    if (error) toast.error(t("errDeleteComment"))
    refresh()
  }

  return { comments, people, isLoading, post, remove }
}

function CommentList({
  thread,
  viewerId,
}: {
  thread: Thread
  viewerId: string | null
}) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const reduce = useReducedMotion()
  const { comments, people, isLoading, remove } = thread

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-muted-foreground flex items-center gap-2 text-[13px]">
        {t("taskComments")}
        {comments.length > 0 && (
          <span className="tabular-nums">{comments.length}</span>
        )}
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner className="size-4" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">
          {t("commentsEmpty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {comments.map((comment) => {
              const author = people[comment.author_id]
              return (
                <m.li
                  key={comment.id}
                  layout={reduce ? false : "position"}
                  initial={reduce ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="group/comment flex gap-2.5 text-[13px]"
                >
                  <PersonAvatar
                    person={author ?? { full_name: null, avatar_url: null }}
                    className="mt-0.5 size-6"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">
                        {author?.full_name ?? t("someone")}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </span>
                      {comment.author_id === viewerId && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={t("deleteComment")}
                          onClick={() => remove(comment.id)}
                          className="text-muted-foreground hover:text-destructive ml-auto opacity-0 group-hover/comment:opacity-100 focus-visible:opacity-100"
                        >
                          <RiDeleteBinLine />
                        </Button>
                      )}
                    </div>
                    <p className="text-foreground/90 break-words whitespace-pre-wrap">
                      <CommentBody
                        body={comment.body}
                        mentions={comment.mentions}
                        people={people}
                      />
                    </p>
                  </div>
                </m.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  )
}

/** The same typography for the textarea and the layer drawn behind it. */
const COMPOSER_TEXT =
  "min-h-12 max-h-40 px-6 pt-4 pb-1 text-[13px] leading-5 whitespace-pre-wrap break-words md:px-8"

type Span = { start: number; end: number; kind: "tag" | "query" }

/**
 * Comment box with @mention autocomplete over the project team. Picking a
 * person writes "@Full Name" and remembers the id; on send only the people
 * whose "@Name" is still in the text are stored as mentions.
 *
 * The textarea's own text is transparent: a layer behind it draws the same
 * text with each mention as a tag, so tags look like chips while editing
 * stays a plain textarea. Backspace/Delete remove a tag as one piece, and
 * the people list opens right above the "@" being typed.
 */
function Composer({
  team,
  onPost,
}: {
  team: TeamMember[]
  onPost: (body: string, mentions: string[]) => Promise<boolean>
}) {
  const t = useT("projects")
  const reduce = useReducedMotion()
  const listId = useId()
  const ref = useRef<HTMLTextAreaElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const queryRef = useRef<HTMLSpanElement>(null)
  const [text, setText] = useState("")
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [query, setQuery] = useState<{ q: string; start: number } | null>(null)
  const [highlight, setHighlight] = useState(0)
  const [sending, setSending] = useState(false)
  const [anchor, setAnchor] = useState<{ left: number; bottom: number } | null>(
    null,
  )

  const options = query
    ? team
        .filter((m) =>
          (m.full_name ?? "").toLowerCase().includes(query.q.toLowerCase()),
        )
        .slice(0, 6)
    : []

  // Picked "@Name"s still in the text, plus the "@que" being typed.
  const spans = useMemo(() => {
    const out: Span[] = []
    const names = [...new Set(Object.values(picked))]
      .filter(Boolean)
      .sort((x, y) => y.length - x.length)
    if (names.length) {
      const re = new RegExp(`@(?:${names.map(escapeRegExp).join("|")})`, "g")
      for (const hit of text.matchAll(re))
        out.push({
          start: hit.index,
          end: hit.index + hit[0].length,
          kind: "tag",
        })
    }
    if (query) {
      const end = query.start + 1 + query.q.length
      if (!out.some((r) => query.start < r.end && end > r.start))
        out.push({ start: query.start, end, kind: "query" })
    }
    return out.sort((x, y) => x.start - y.start)
  }, [text, picked, query])

  // Place the list just above the "@" (inside the field's own box).
  useLayoutEffect(() => {
    const span = queryRef.current
    const wrap = wrapRef.current
    if (!query || !span || !wrap) return setAnchor(null)
    const box = wrap.getBoundingClientRect()
    const at = span.getBoundingClientRect()
    setAnchor({
      left: Math.max(8, Math.min(at.left - box.left - 8, box.width - 264)),
      bottom: box.bottom - at.top + 6,
    })
  }, [query, text])

  // "@" at the start or after whitespace, then the word typed so far.
  const detect = (value: string, caret: number) => {
    const match = /(^|\s)@([^\s@]*)$/.exec(value.slice(0, caret))
    if (match) {
      setQuery({ q: match[2], start: caret - match[2].length - 1 })
      setHighlight(0)
    } else setQuery(null)
  }

  const choose = (member: TeamMember) => {
    if (!query || !ref.current) return
    const name = member.full_name ?? ""
    const caret = ref.current.selectionStart
    const next = `${text.slice(0, query.start)}@${name} ${text.slice(caret)}`
    const at = query.start + name.length + 2
    setText(next)
    setPicked((p) => ({ ...p, [member.id]: name }))
    setQuery(null)
    requestAnimationFrame(() => {
      ref.current?.focus()
      ref.current?.setSelectionRange(at, at)
    })
  }

  // A tag goes as a whole: Backspace right after it, Delete right before it.
  const removeTag = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    const caret = el.selectionStart
    if (caret !== el.selectionEnd) return false
    const back = e.key === "Backspace"
    const hit = spans.find(
      (r) =>
        r.kind === "tag" &&
        (back
          ? caret > r.start && caret <= r.end
          : caret >= r.start && caret < r.end),
    )
    if (!hit) return false
    e.preventDefault()
    setText(text.slice(0, hit.start) + text.slice(hit.end))
    setQuery(null)
    requestAnimationFrame(() => el.setSelectionRange(hit.start, hit.start))
    return true
  }

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    const mentions = Object.entries(picked)
      .filter(([, name]) => body.includes(`@${name}`))
      .map(([id]) => id)
    setSending(true)
    const ok = await onPost(body, mentions)
    setSending(false)
    if (ok) {
      setText("")
      setPicked({})
    }
  }

  // The text again, with tags and the live "@query" wrapped for styling.
  const layer: React.ReactNode[] = []
  let at = 0
  for (const r of spans) {
    if (r.start > at) layer.push(text.slice(at, r.start))
    layer.push(
      <span
        key={r.start}
        ref={r.kind === "query" ? queryRef : undefined}
        className={cn(
          // No padding: the text must keep the textarea's exact metrics.
          // The fill reaches 1px to the sides and 2px up/down, so tags in a
          // row still show a small gap.
          "text-info dark:text-blue-11 rounded-[5px]",
          r.kind === "tag"
            ? "bg-info-subtle shadow-[0_0_0_1px_var(--color-info-subtle),0_1px_0_1px_var(--color-info-subtle),0_-1px_0_1px_var(--color-info-subtle)]"
            : "bg-info-subtle/50 shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-info-subtle)_50%,transparent)]",
        )}
      >
        {text.slice(r.start, r.end)}
      </span>,
    )
    at = r.end
  }
  // A trailing newline needs a character after it to take up its line.
  layer.push(`${text.slice(at)}\u200b`)

  const open = query !== null
  return (
    // Spans the whole column under a hairline: the footer is the field.
    <div ref={wrapRef} className="relative flex flex-col">
      <div className="relative">
        <div
          ref={backRef}
          aria-hidden
          className={cn(
            COMPOSER_TEXT,
            "text-foreground pointer-events-none absolute inset-0 overflow-y-auto",
          )}
        >
          {layer}
        </div>
        <Textarea
          ref={ref}
          value={text}
          placeholder={t("commentPlaceholder")}
          aria-label={t("commentPlaceholder")}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && options[highlight]
              ? `${listId}-${options[highlight].id}`
              : undefined
          }
          onChange={(e) => {
            setText(e.target.value)
            detect(e.target.value, e.target.selectionStart)
          }}
          onSelect={(e) =>
            detect(e.currentTarget.value, e.currentTarget.selectionStart)
          }
          onScroll={(e) => {
            if (backRef.current)
              backRef.current.scrollTop = e.currentTarget.scrollTop
          }}
          onBlur={() => setQuery(null)}
          onKeyDown={(e) => {
            if (open && options.length) {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault()
                const step = e.key === "ArrowDown" ? 1 : -1
                setHighlight(
                  (h) => (h + step + options.length) % options.length,
                )
                return
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault()
                choose(options[highlight])
                return
              }
            }
            if (open && e.key === "Escape") {
              // Close the list, not the dialog.
              e.stopPropagation()
              setQuery(null)
              return
            }
            if (
              (e.key === "Backspace" || e.key === "Delete") &&
              !e.metaKey &&
              !e.altKey &&
              removeTag(e)
            )
              return
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              send()
            }
          }}
          className={cn(
            COMPOSER_TEXT,
            "caret-foreground selection:bg-primary/20 relative rounded-none border-0 bg-transparent text-transparent shadow-none hover:bg-transparent focus:ring-0! focus:ring-offset-0! focus-visible:ring-0 md:text-[13px]",
          )}
        />
      </div>

      <AnimatePresence>
        {open && anchor && (
          <m.ul
            id={listId}
            role="listbox"
            aria-label={t("colPic")}
            initial={reduce ? false : { opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: EASE }}
            style={{ left: anchor.left, bottom: anchor.bottom }}
            className="bg-popover text-popover-foreground nest-rounded-2xl nest-p-2 absolute z-10 flex w-64 origin-bottom-left flex-col text-sm shadow-(--elev-4)"
          >
            {options.length === 0 ? (
              <li className="text-muted-foreground px-2 py-1.5">
                {t("mentionNoMatch")}
              </li>
            ) : (
              options.map((member, i) => (
                <li
                  key={member.id}
                  id={`${listId}-${member.id}`}
                  role="option"
                  aria-selected={i === highlight}
                  // Keep focus in the textarea.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(member)}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    // Like a menu item; the avatar sits 6px from the top and left.
                    "rounded-nested flex min-h-8 cursor-pointer items-center gap-2 p-1.5 pr-2",
                    i === highlight && "bg-accent",
                  )}
                >
                  <PersonAvatar person={member} />
                  <span className="truncate">{member.full_name}</span>
                  {member.job_title && (
                    <span className="text-muted-foreground ml-auto truncate text-xs">
                      {member.job_title}
                    </span>
                  )}
                </li>
              ))
            )}
          </m.ul>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-end gap-2 px-4 pb-3 md:px-6">
        <span className="text-muted-foreground text-xs">
          {t("commentHint")}
        </span>
        <Button
          size="icon-sm"
          aria-label={t("commentSend")}
          title={t("commentSend")}
          disabled={!text.trim() || sending}
          onClick={send}
        >
          {sending ? <Spinner /> : <RiArrowUpLine />}
        </Button>
      </div>
    </div>
  )
}

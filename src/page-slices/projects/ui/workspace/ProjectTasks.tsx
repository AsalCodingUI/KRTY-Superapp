"use client"

import dynamic from "next/dynamic"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PageHeader } from "@/components/page-header"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { EmptyState } from "@/components/empty-state"
import { EmptyValue } from "@/components/empty-value"
import { ViewToggle, useViewMode } from "@/components/view-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import {
  RiAddLine,
  RiArrowRightSLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiMessage3Line,
} from "@/shared/ui/lucide-icons"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { differenceInCalendarDays, format, isToday } from "date-fns"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  supabase,
  useInvalidate,
  useTasks,
  useViewer,
  useWorkspace,
  type TaskRow,
  type TeamMember,
} from "./data"
import { TaskBoard } from "./TaskBoard"
import { TaskDialog } from "./TaskDialog"
import {
  byPosition,
  positionBetween,
  topPosition,
  statusOf,
  statusPatch,
  useCommentCounts,
  useTaskWriter,
  type TaskStatus,
} from "./task-data"
import { dueLabel } from "./task-utils"

// Month grid (react-day-picker) loads when the due-date popover first opens.
const Calendar = dynamic(
  () => import("@/components/ui/calendar").then((m) => m.Calendar),
  {
    ssr: false,
    loading: () => <div className="h-[296px] w-[252px]" aria-busy />,
  },
)

type Filter = "all" | "todo" | "done"
const NONE = "__none__"

/**
 * Project tasks: a Trello-style board (default) or the DesignerHQ-style
 * table, both opening a task in a dialog with subtasks and comments.
 */
export function ProjectTasks({ projectId }: { projectId: string }) {
  const t = useT("projects")
  const tc = useT("common")
  const { data: workspace } = useWorkspace(projectId)
  const { data: tasks = [], isLoading } = useTasks(projectId)
  const { data: commentCounts = {} } = useCommentCounts(projectId)
  const viewer = useViewer()
  const invalidate = useInvalidate(projectId)
  const writer = useTaskWriter(projectId, () => toast.error(t("errSaveTask")))
  const [view, setView] = useViewMode("project-tasks", "kanban")
  const board = view !== "list"
  const [filter, setFilter] = useState<Filter>("todo")
  const [mine, setMine] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addSignal, setAddSignal] = useState(0)
  const [newTitle, setNewTitle] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  // The open task; kept while the dialog animates closed.
  const [openId, setOpenId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<TaskRow | null>(null)

  const phases = workspace?.phases ?? []
  const team = workspace?.team ?? []
  const activePhase = phases.find((p) => p.status === "active")

  const top = tasks.filter((t) => !t.parent_id)
  const subsOf = useMemo(() => {
    const map = new Map<string, TaskRow[]>()
    for (const t of [...tasks].sort(byPosition)) {
      if (!t.parent_id) continue
      map.set(t.parent_id, [...(map.get(t.parent_id) ?? []), t])
    }
    return map
  }, [tasks])

  // The open task lives in the URL (?task=<id>): a notification or a copied
  // link opens it, and closing the task clears it again.
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const linked = searchParams.get("task")
  const setTaskParam = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id) params.set("task", id)
    else params.delete("task")
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    })
  }

  const openTask = (id: string) => {
    setOpenId(id)
    setDialogOpen(true)
    if (linked !== id) setTaskParam(id)
  }
  const setTaskDialogOpen = (open: boolean) => {
    setDialogOpen(open)
    if (!open && linked) setTaskParam(null)
  }

  useEffect(() => {
    if (!linked || !tasks.length) return
    if (dialogOpen && openId === linked) return
    const task = tasks.find((t) => t.id === linked)
    // A subtask opens inside its parent.
    if (task) {
      setOpenId(task.parent_id ?? task.id)
      setDialogOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linked, tasks])

  const counts = {
    all: top.length,
    todo: top.filter((t) => !t.done).length,
    done: top.filter((t) => t.done).length,
  }
  const mineFilter = (t: TaskRow) => !mine || t.assignee_id === viewer.id
  const boardTasks = useMemo(
    () => top.filter(mineFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, mine, viewer.id],
  )
  const visible = top
    .filter((t) =>
      filter === "all" ? true : filter === "done" ? t.done : !t.done,
    )
    .filter(mineFilter)
    .sort((a, b) => {
      if (a.done !== b.done) return Number(a.done) - Number(b.done)
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      // Board order, so a task just added shows up at the top here too.
      return byPosition(a, b)
    })

  const update = (id: string, patch: Partial<TaskRow>) => {
    writer.patch(id, patch)
  }

  const setStatus = (task: TaskRow, status: TaskStatus) => {
    if (statusOf(task) === status) return
    // Lands at the bottom of its new column.
    const last = tasks
      .filter(
        (t) =>
          t.parent_id === task.parent_id &&
          t.id !== task.id &&
          statusOf(t) === status,
      )
      .reduce<
        number | null
      >((max, t) => (t.position !== null && (max === null || t.position > max) ? t.position : max), null)
    writer.patch(task.id, {
      ...statusPatch(task, status),
      position: positionBetween(last, null),
    })
  }

  /** A card dropped into `status`; `order` is that column's new order. */
  const move = (id: string, status: TaskStatus, order: string[]) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const byId = new Map(tasks.map((t) => [t.id, t]))
    const index = order.indexOf(id)
    const prev = byId.get(order[index - 1])?.position ?? null
    const next = byId.get(order[index + 1])?.position ?? null
    const missing =
      (index > 0 && prev === null) ||
      (index < order.length - 1 && next === null)
    const position = missing ? null : positionBetween(prev, next)
    if (position !== null) {
      writer.patch(id, { ...statusPatch(task, status), position })
      return
    }
    // No room between the neighbours: renumber the column.
    writer.write(
      order.map((rowId, i) => ({
        id: rowId,
        patch: {
          ...(rowId === id ? statusPatch(task, status) : {}),
          position: (i + 1) * 1024,
        },
      })),
    )
  }

  const create = async (
    title: string,
    parentId: string | null = null,
    status: TaskStatus = "todo",
  ) => {
    const value = title.trim()
    if (!value) return false
    const parent = parentId ? tasks.find((t) => t.id === parentId) : null
    const { error } = await supabase()
      .from("project_tasks")
      .insert({
        project_id: projectId,
        title: value,
        parent_id: parentId,
        status,
        // New tasks and subtasks go to the top, where they're added.
        position: topPosition(tasks, parentId, parentId ? undefined : status),
        phase_id: parent?.phase_id ?? activePhase?.id ?? null,
        created_by: viewer.id,
      })
    if (error) {
      toast.error(t("errAddTask"))
      return false
    }
    await invalidate("tasks")
    return true
  }

  const remove = async (id: string) => {
    if (id === openId) setDialogOpen(false)
    const { error } = await supabase()
      .from("project_tasks")
      .delete()
      .eq("id", id)
    if (error) toast.error(t("errDeleteTask"))
    invalidate("tasks")
  }

  const toggle = (task: TaskRow) => setStatus(task, task.done ? "todo" : "done")

  // One task per Enter, even when it's pressed again before the save lands.
  const busy = useRef(false)
  const addTop = async () => {
    if (busy.current || !newTitle.trim()) return
    busy.current = true
    const ok = await create(newTitle)
    busy.current = false
    if (ok) setNewTitle("")
    else setAdding(false)
  }

  const openRow = openId ? tasks.find((t) => t.id === openId) : null

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={t("sectionTasks")}
        actions={
          <>
            <ViewToggle
              value={board ? "kanban" : "list"}
              onValueChange={setView}
              modes={["kanban", "list"]}
            />
            <Button
              onClick={() =>
                board ? setAddSignal((n) => n + 1) : setAdding(true)
              }
            >
              <RiAddLine data-icon="inline-start" />
              {t("newTask")}
            </Button>
          </>
        }
      />
      <div className="border-border flex items-end justify-between gap-3 border-b">
        {board ? (
          <span />
        ) : (
          <TabNavigation className="border-b-0">
            {(
              [
                ["all", tc("all")],
                ["todo", t("filterTodo")],
                ["done", t("statusCompleted")],
              ] as const
            ).map(([key, label]) => (
              <TabNavigationLink
                key={key}
                active={filter === key}
                onClick={() => setFilter(key)}
                showLeadingIcon={false}
              >
                {label}
                {counts[key] > 0 && (
                  <span className="text-tertiary-foreground ml-1.5 tabular-nums">
                    {counts[key]}
                  </span>
                )}
              </TabNavigationLink>
            ))}
          </TabNavigation>
        )}
        <Button
          size="sm"
          variant="outline"
          className={cn("mb-2", mine && "bg-muted text-foreground")}
          aria-pressed={mine}
          onClick={() => setMine((v) => !v)}
        >
          {t("filterMine")}
        </Button>
      </div>

      {board ? (
        isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-6" />
          </div>
        ) : (
          <TaskBoard
            tasks={boardTasks}
            subsOf={subsOf}
            commentCounts={commentCounts}
            team={team}
            addSignal={addSignal}
            onOpen={(task) => openTask(task.id)}
            onMove={move}
            onCreate={(title, status) => create(title, null, status)}
          />
        )
      ) : (
        <div className="flex flex-col gap-4 pb-4">
          <div className="bleed flex flex-col text-sm">
            <div className="text-muted-foreground border-border gutter-x grid grid-cols-[2.5rem_minmax(0,1fr)_8rem_10rem_7rem_5rem] items-center border-b py-2 text-[13px]">
              <span />
              <span>{t("colTask")}</span>
              <span>{t("factsPhase")}</span>
              <span>{t("colPic")}</span>
              <span>{t("factsDeadline")}</span>
              <span className="text-right">{t("colCreated")}</span>
            </div>

            {adding && (
              <div className="border-border/50 gutter-x grid grid-cols-[2.5rem_minmax(0,1fr)] items-center border-b py-2">
                <span />
                <Input
                  autoFocus
                  value={newTitle}
                  placeholder={t("taskPlaceholder")}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTop()
                    if (e.key === "Escape") {
                      setAdding(false)
                      setNewTitle("")
                    }
                  }}
                  onBlur={() => {
                    if (!newTitle.trim()) setAdding(false)
                  }}
                  className="h-8"
                />
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner className="size-6" />
              </div>
            ) : visible.length === 0 && !adding ? (
              <EmptyState
                placement="inner"
                icon={<RiCheckboxCircleLine className="size-5" />}
                title={
                  filter === "done" ? t("tasksEmptyDone") : t("tasksEmpty")
                }
                action={
                  filter === "done"
                    ? undefined
                    : { label: t("newTask"), onClick: () => setAdding(true) }
                }
              />
            ) : (
              visible.map((task) => (
                <TaskRows
                  key={task.id}
                  task={task}
                  subtasks={subsOf.get(task.id) ?? []}
                  comments={commentCounts[task.id] ?? 0}
                  expanded={Boolean(expanded[task.id])}
                  onExpand={(open) =>
                    setExpanded((e) => ({ ...e, [task.id]: open }))
                  }
                  phases={phases}
                  team={team}
                  onUpdate={update}
                  onToggle={toggle}
                  onRemove={remove}
                  onDelete={() => setDeleting(task)}
                  onOpen={() => openTask(task.id)}
                  onAddSub={(title) => create(title, task.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      <TaskDialog
        task={openRow ?? null}
        open={dialogOpen}
        onOpenChange={setTaskDialogOpen}
        projectId={projectId}
        subtasks={openRow ? (subsOf.get(openRow.id) ?? []) : []}
        team={team}
        viewerId={viewer.id}
        onPatch={update}
        onStatus={setStatus}
        onAddSub={(title, parentId) => create(title, parentId)}
        onRemove={remove}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteNamedTitle", { name: deleting?.title ?? "" })}
        description={t("deleteTaskDescription")}
        confirmText={tc("delete")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={() => {
          if (deleting) remove(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

function TaskRows({
  task,
  subtasks,
  comments,
  expanded,
  onExpand,
  phases,
  team,
  onUpdate,
  onToggle,
  onRemove,
  onDelete,
  onOpen,
  onAddSub,
}: {
  task: TaskRow
  subtasks: TaskRow[]
  comments: number
  expanded: boolean
  onExpand: (open: boolean) => void
  phases: { id: string; name: string }[]
  team: TeamMember[]
  onUpdate: (id: string, patch: Partial<TaskRow>) => void
  onToggle: (task: TaskRow) => void
  onRemove: (id: string) => void
  /** Asks first: the task's subtasks and comments go with it. */
  onDelete: () => void
  onOpen: () => void
  onAddSub: (title: string) => Promise<boolean>
}) {
  const t = useT("projects")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [subTitle, setSubTitle] = useState("")
  const [dateOpen, setDateOpen] = useState(false)
  const addingSub = useRef(false)
  const addSub = async () => {
    if (addingSub.current || !subTitle.trim()) return
    addingSub.current = true
    const ok = await onAddSub(subTitle)
    addingSub.current = false
    if (ok) setSubTitle("")
  }
  const assignee = team.find((m) => m.id === task.assignee_id)
  const doneSubs = subtasks.filter((s) => s.done).length
  const overdue =
    task.due_date &&
    !task.done &&
    differenceInCalendarDays(
      new Date(`${task.due_date}T00:00:00`),
      new Date(),
    ) < 0

  const saveTitle = () => {
    setEditing(false)
    if (title.trim() && title.trim() !== task.title) {
      onUpdate(task.id, { title: title.trim() })
    } else setTitle(task.title)
  }

  return (
    <>
      <div className="group/task border-border/50 hover:bg-muted/20 gutter-x grid min-h-12 grid-cols-[2.5rem_minmax(0,1fr)_8rem_10rem_7rem_5rem] items-center border-b">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={expanded ? t("collapseSubtasks") : t("expandSubtasks")}
            aria-expanded={expanded}
            onClick={() => onExpand(!expanded)}
            className={cn(
              "text-muted-foreground aria-expanded:text-muted-foreground -ml-6 aria-expanded:bg-transparent",
              subtasks.length === 0 &&
                "invisible group-hover/task:visible focus-visible:visible",
            )}
          >
            <RiArrowRightSLine
              className={cn(
                "size-4! transition-transform",
                expanded && "rotate-90",
              )}
            />
          </Button>
          <Checkbox
            checked={task.done}
            onCheckedChange={() => onToggle(task)}
            aria-label={task.done ? t("markUndone") : t("markDone")}
          />
        </div>
        <div className="flex min-w-0 items-center gap-2 pr-3">
          {editing ? (
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle()
                if (e.key === "Escape") {
                  setTitle(task.title)
                  setEditing(false)
                }
              }}
              className="h-7"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={cn(
                "min-w-0 truncate text-left",
                task.done && "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </button>
          )}
          {subtasks.length > 0 && (
            <span className="text-muted-foreground shrink-0 text-[13px] tabular-nums">
              {doneSubs}/{subtasks.length}
            </span>
          )}
          {/* Opens the task dialog (description, comments). */}
          <Button
            variant="ghost"
            size={comments > 0 ? "xs" : "icon-xs"}
            aria-label={t("commentCount", { n: comments })}
            onClick={onOpen}
            className={cn(
              "text-muted-foreground ml-auto shrink-0 text-[13px] font-normal tabular-nums",
              comments === 0 &&
                "opacity-0 group-hover/task:opacity-100 focus-visible:opacity-100",
            )}
          >
            <RiMessage3Line
              data-icon={comments > 0 ? "inline-start" : undefined}
              className="size-3.5"
            />
            {comments > 0 && comments}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("deleteTask")}
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive opacity-0 group-hover/task:opacity-100 focus-visible:opacity-100"
          >
            <RiDeleteBinLine />
          </Button>
        </div>
        <Select
          value={task.phase_id ?? NONE}
          onValueChange={(v) =>
            v && onUpdate(task.id, { phase_id: v === NONE ? null : v })
          }
        >
          <SelectTrigger
            size="sm"
            className="text-muted-foreground hover:bg-accent w-[7.5rem] border-transparent bg-transparent px-2.5 text-[13px] shadow-none hover:border-transparent"
          >
            <SelectValue>
              {(v: string) =>
                phases.find((p) => p.id === v)?.name ?? t("noPhase")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("noPhase")}</SelectItem>
            {phases.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={task.assignee_id ?? NONE}
          onValueChange={(v) =>
            v && onUpdate(task.id, { assignee_id: v === NONE ? null : v })
          }
        >
          <SelectTrigger
            size="sm"
            className="hover:bg-accent w-[9.5rem] border-transparent bg-transparent px-2.5 text-[13px] shadow-none hover:border-transparent"
          >
            <SelectValue>
              {() =>
                assignee ? (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Avatar className="size-5">
                      <AvatarImage
                        src={assignee.avatar_url || undefined}
                        alt=""
                      />
                      <AvatarFallback className="text-[9px]">
                        {(assignee.full_name || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">
                      {assignee.full_name?.split(" ")[0]}
                    </span>
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
        {/* Due date: the app's calendar in a popover (not the browser's). */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-self-start px-2.5 text-[13px] font-normal",
                  task.due_date
                    ? overdue
                      ? "text-destructive"
                      : isToday(new Date(`${task.due_date}T00:00:00`))
                        ? "text-warning"
                        : "text-foreground"
                    : "text-muted-foreground",
                )}
              />
            }
          >
            <RiCalendarLine data-icon="inline-start" className="size-3.5" />
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
              selected={
                task.due_date
                  ? new Date(`${task.due_date}T00:00:00`)
                  : undefined
              }
              defaultMonth={
                task.due_date
                  ? new Date(`${task.due_date}T00:00:00`)
                  : undefined
              }
              locale={dateLocale}
              onSelect={(date) => {
                onUpdate(task.id, {
                  due_date: date ? format(date, "yyyy-MM-dd") : null,
                })
                setDateOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
        <span className="text-muted-foreground text-right text-[13px] tabular-nums">
          {format(new Date(task.created_at), "d MMM", { locale: dateLocale })}
        </span>
      </div>

      {expanded && (
        <div className="border-border/50 flex flex-col border-b py-1 pl-[3.75rem]">
          {subtasks.map((sub) => (
            <div
              key={sub.id}
              className="group/sub flex min-h-9 items-center gap-2 pr-4"
            >
              <Checkbox
                checked={sub.done}
                onCheckedChange={() => onToggle(sub)}
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
          <div className="flex items-center gap-2 py-1 pr-4">
            <RiAddLine className="text-muted-foreground size-4 shrink-0" />
            <Input
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addSub()
              }}
              placeholder={t("addSubtask")}
              aria-label={t("addSubtask")}
              className="h-8 flex-1"
            />
          </div>
        </div>
      )}
    </>
  )
}

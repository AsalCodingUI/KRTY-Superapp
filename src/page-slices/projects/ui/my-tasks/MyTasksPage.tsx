"use client"

import { useIsMobile, useIsWide } from "@/hooks/use-mobile"
import { linkKey, projectHref } from "@/shared/lib/url-params"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { ProjectAvatar } from "@/components/project-avatar"
import { SegmentedControl } from "@/components/segmented-control"
import {
  SplitPane,
  SplitPaneDetail,
  SplitPaneHead,
  SplitPaneList,
  SplitPaneScroll,
  SplitPaneTitle,
  splitPaneItemClassName,
} from "@/components/split-pane"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ViewToggle, useViewMode } from "@/components/view-toggle"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiCheckboxCircleLine, RiMessage3Line } from "@/shared/ui/lucide-icons"
import { differenceInCalendarDays, isToday } from "date-fns"
import dynamic from "next/dynamic"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  supabase,
  useViewer,
  type TaskRow,
  type TeamMember,
} from "../workspace/data"
import { TaskBoard } from "../workspace/TaskBoard"
import { TaskContextTarget, type TaskMenuConfig } from "../workspace/task-menu"
import {
  byPosition,
  deleteTaskUndoable,
  duplicateTask,
  registerDuplicateUndo,
  positionBetween,
  topPosition,
  statusOf,
  statusPatch,
  type TaskStatus,
} from "../workspace/task-data"
import { dueLabel } from "../workspace/task-utils"
import {
  useMyCommentCounts,
  useMyTaskWriter,
  useMyTasks,
  type MyProject,
} from "./my-tasks-data"

// The task window (editor, comments) loads when a task is first opened;
// the split's pane, when the list first shows one.
const TaskDialog = dynamic(
  () => import("../workspace/TaskDialog").then((m) => m.TaskDialog),
  { loading: () => null },
)
const TaskPane = dynamic(
  () => import("../workspace/TaskDialog").then((m) => m.TaskPane),
  { loading: () => null },
)

/** The board shows each card's project, not its assignees: no team needed. */
const NO_TEAM: TeamMember[] = []

type Filter = "all" | "todo" | "done"
const ALL = "__all__"

/**
 * Tugas saya: every task assigned to the viewer, across their running
 * projects. Same board and dialog as a project's Tugas page; new tasks are
 * still added inside a project.
 */
export function MyTasksPage() {
  const t = useT("projects")
  const tc = useT("common")
  const tm = useT("taskmenu")
  const tu = useT("undo")
  const viewer = useViewer()
  const { data, isLoading } = useMyTasks(viewer.id)
  const writer = useMyTaskWriter(viewer.id, () => toast.error(t("errSaveTask")))
  // v2: the list is now the list | task split (the default).
  const [view, setView] = useViewMode("my-tasks-split", "list")
  // Phones always get the list: a board doesn't fit.
  const isMobile = useIsMobile()
  const board = view !== "list" && !isMobile
  const [filter, setFilter] = useState<Filter>("todo")
  const [projectFilter, setProjectFilter] = useState<string>(ALL)
  const [openId, setOpenId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  // Opened from the right-click menu: what the dialog starts on.
  const [focus, setFocus] = useState<"due" | "subtask" | null>(null)
  const [deleting, setDeleting] = useState<TaskRow | null>(null)
  // The split: the task shown in the right pane (lg up), and a counter so
  // a menu's "pick due" / "add subtask" reopens it focused.
  const wide = useIsWide()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [paneKey, setPaneKey] = useState(0)

  const projects = useMemo(
    () =>
      Object.values(data?.projects ?? {}).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [data],
  )
  const commentCounts = useMyCommentCounts(projects.map((p) => p.id))

  const allTasks = useMemo(() => data?.tasks ?? [], [data])
  const subtasks = useMemo(() => data?.subtasks ?? [], [data])
  const everything = useMemo(
    () => [...allTasks, ...subtasks],
    [allTasks, subtasks],
  )
  const subsOf = useMemo(() => {
    const map = new Map<string, TaskRow[]>()
    for (const s of [...subtasks].sort(byPosition)) {
      if (!s.parent_id) continue
      map.set(s.parent_id, [...(map.get(s.parent_id) ?? []), s])
    }
    return map
  }, [subtasks])

  const scoped = useMemo(
    () =>
      projectFilter === ALL
        ? allTasks
        : allTasks.filter((task) => task.project_id === projectFilter),
    [allTasks, projectFilter],
  )
  const counts = {
    all: scoped.length,
    todo: scoped.filter((task) => !task.done).length,
    done: scoped.filter((task) => task.done).length,
  }
  const visible = scoped
    .filter((task) =>
      filter === "all" ? true : filter === "done" ? task.done : !task.done,
    )
    .sort((a, b) => {
      if (a.done !== b.done) return Number(a.done) - Number(b.done)
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return a.created_at.localeCompare(b.created_at)
    })

  // Stable, so the board's memoized cards keep their props.
  const projectOf = useCallback(
    (task: TaskRow): MyProject | undefined => data?.projects[task.project_id],
    [data],
  )

  /** Bottom of `status` within the task's own project. */
  const lastPosition = (task: TaskRow, status: TaskStatus) =>
    everything
      .filter(
        (row) =>
          row.project_id === task.project_id &&
          row.parent_id === task.parent_id &&
          row.id !== task.id &&
          statusOf(row) === status,
      )
      .reduce<
        number | null
      >((max, row) => (row.position !== null && (max === null || row.position > max) ? row.position : max), null)

  const setStatus = (task: TaskRow, status: TaskStatus) => {
    if (statusOf(task) === status) return
    writer.patch(task.id, {
      ...statusPatch(task, status),
      position: positionBetween(lastPosition(task, status), null),
    })
  }

  // A card dropped on the board: keep its spot between the neighbours, or
  // send it to the end of the column in its project when there's no room.
  const move = (id: string, status: TaskStatus, order: string[]) => {
    const task = allTasks.find((row) => row.id === id)
    if (!task) return
    const byId = new Map(allTasks.map((row) => [row.id, row]))
    const index = order.indexOf(id)
    const prev = byId.get(order[index - 1])?.position ?? null
    const next = byId.get(order[index + 1])?.position ?? null
    const position =
      (index > 0 && prev === null) ||
      (index < order.length - 1 && next === null)
        ? null
        : positionBetween(prev, next)
    writer.patch(id, {
      ...statusPatch(task, status),
      position: position ?? positionBetween(lastPosition(task, status), null),
    })
  }

  const addSubtask = async (title: string, parentId: string) => {
    const value = title.trim()
    const parent = allTasks.find((row) => row.id === parentId)
    if (!value || !parent) return false
    const { error } = await supabase()
      .from("project_tasks")
      .insert({
        project_id: parent.project_id,
        title: value,
        parent_id: parentId,
        status: "todo",
        position: topPosition(subtasks, parentId),
        phase_id: parent.phase_id,
        created_by: viewer.id,
      })
    if (error) {
      toast.error(t("errAddTask"))
      return false
    }
    await writer.refresh([parent.project_id])
    return true
  }

  const remove = async (id: string) => {
    if (id === openId) setDialogOpen(false)
    if (id === selectedId) setSelectedId(null)
    const row = everything.find((r) => r.id === id)
    const refresh = () => writer.refresh(row ? [row.project_id] : [])
    const error = await deleteTaskUndoable({
      id,
      label: tu("taskDelete", { title: row?.title ?? "" }),
      refresh,
    })
    if (error) toast.error(t("errDeleteTask"))
    refresh()
  }

  const openTask = (id: string, start: "due" | "subtask" | null = null) => {
    setFocus(start)
    // The split (lg up): in the right pane. Board, or narrower: the dialog.
    if (!board && wide) {
      setSelectedId(id)
      setPaneKey((n) => n + 1)
      return
    }
    setOpenId(id)
    setDialogOpen(true)
  }
  const openRow = openId ? allTasks.find((row) => row.id === openId) : null

  // Placed among the whole project's column, not only the viewer's cards.
  const duplicate = async (task: TaskRow) => {
    const { data: siblings } = await supabase()
      .from("project_tasks")
      .select("*")
      .eq("project_id", task.project_id)
    const copyId = await duplicateTask({
      task,
      subtasks: subsOf.get(task.id) ?? [],
      siblings: (siblings ?? []) as TaskRow[],
      title: tm("copySuffix", { title: task.title }),
      viewerId: viewer.id,
    })
    await writer.refresh([task.project_id])
    if (copyId) {
      toast.success(tm("duplicated"))
      registerDuplicateUndo({
        copyId,
        label: tu("taskDuplicate", { title: task.title }),
        refresh: () => writer.refresh([task.project_id]),
      })
    } else toast.error(tm("errDuplicate"))
  }

  /** The right-click menu of a task: the same handlers as the dialog's. */
  const menuFor = (task: TaskRow): TaskMenuConfig => {
    const project = projectOf(task)
    const page = project
      ? projectHref(project, "tasks")
      : `/projects/${task.project_id}/tasks`
    return {
      task,
      href: `${page}?task=${linkKey(task.title, task.id)}`,
      viewerId: viewer.id,
      team: data?.teams[task.project_id] ?? [],
      // Loaded when "Pindah ke fase" opens.
      phases: async () => {
        const { data: rows, error } = await supabase()
          .from("project_phases")
          .select("id, name")
          .eq("project_id", task.project_id)
          .order("position")
        if (error) throw error
        return rows ?? []
      },
      project: { href: page },
      onStatus: setStatus,
      onPatch: writer.patch,
      onPickDue: () => openTask(task.id, "due"),
      onAddSubtask: () => openTask(task.id, "subtask"),
      onDuplicate: () => duplicate(task),
      onDelete: () => setDeleting(task),
    }
  }

  const empty = !isLoading && allTasks.length === 0

  const projectSelect = (
    <Select
      value={projectFilter}
      onValueChange={(v) => v && setProjectFilter(v)}
    >
      <SelectTrigger className={board ? "w-44" : "min-w-0 flex-1"}>
        <SelectValue>
          {(v: string) =>
            v === ALL
              ? t("myTasksAllProjects")
              : (data?.projects[v]?.name ?? t("myTasksAllProjects"))
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{t("myTasksAllProjects")}</SelectItem>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
  const viewToggle = !isMobile && (
    <ViewToggle
      value={board ? "kanban" : "list"}
      onValueChange={setView}
      modes={["kanban", "list"]}
    />
  )

  // Mounted from the first open on (openId stays set after): the board's
  // window, and the list's below lg.
  const dialogs = (
    <>
      {openId && (
        <TaskDialog
          task={openRow ?? null}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          projectId={openRow?.project_id ?? ""}
          subtasks={openRow ? (subsOf.get(openRow.id) ?? []) : []}
          team={openRow ? (data?.teams[openRow.project_id] ?? []) : []}
          viewerId={viewer.id}
          onPatch={writer.patch}
          onStatus={setStatus}
          onAddSub={addSubtask}
          onRemove={remove}
          menuFor={menuFor}
          focus={focus}
        />
      )}
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
    </>
  )

  if (board)
    return (
      <div className="flex flex-col">
        <PageHeader
          title={t("myTasksTitle")}
          actions={
            !empty && (
              <>
                {projectSelect}
                {viewToggle}
              </>
            )
          }
        />
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-6" />
          </div>
        ) : empty ? (
          <EmptyState
            icon={<RiCheckboxCircleLine className="size-5" />}
            title={t("myTasksEmpty")}
            description={t("myTasksEmptyDesc")}
          />
        ) : (
          <div className="border-border border-t">
            <TaskBoard
              tasks={scoped}
              subsOf={subsOf}
              commentCounts={commentCounts}
              team={NO_TEAM}
              addSignal={0}
              onOpen={(task) => openTask(task.id)}
              onMove={move}
              projectOf={projectOf}
              wrapCard={(task, card) => (
                <TaskContextTarget menu={menuFor(task)}>
                  {card}
                </TaskContextTarget>
              )}
            />
          </div>
        )}
        {dialogs}
      </div>
    )

  // The list, grouped by when it's due (done ones last), and the open task
  // beside it (lg up; narrower, a row opens the dialog).
  const groups = groupByDue(visible)
  const selected =
    visible.find((task) => task.id === selectedId) ?? visible[0] ?? null

  return (
    <SplitPane>
      <SplitPaneList className="lg:w-96">
        <SplitPaneHead>
          <SplitPaneTitle
            title={t("myTasksTitle")}
            count={counts.todo}
            actions={viewToggle}
          />
          {!empty && (
            <div className="flex min-w-0 items-center gap-2">
              <SegmentedControl<Filter>
                fitContent
                value={filter}
                onChange={setFilter}
                items={[
                  { value: "todo", label: t("filterTodo") },
                  { value: "done", label: t("statusCompleted") },
                  { value: "all", label: tc("all") },
                ]}
              />
              {projectSelect}
            </div>
          )}
        </SplitPaneHead>
        <SplitPaneScroll>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-6" />
            </div>
          ) : empty ? (
            <EmptyState
              placement="inner"
              icon={<RiCheckboxCircleLine className="size-5" />}
              title={t("myTasksEmpty")}
              description={t("myTasksEmptyDesc")}
            />
          ) : visible.length === 0 ? (
            <EmptyState
              placement="inner"
              icon={<RiCheckboxCircleLine className="size-5" />}
              title={
                filter === "done" ? t("tasksEmptyDone") : t("myTasksEmptyTodo")
              }
            />
          ) : (
            groups.map((group) => (
              <div key={group.key} className="flex flex-col gap-0.5">
                {/* The group: a quiet label and its count, on the rows'
                    text edge. */}
                <h2 className="text-muted-foreground text-meta flex items-center gap-1.5 px-3 pt-3 pb-1 first:pt-1">
                  {t(GROUP_LABEL[group.key])}
                  <span className="text-tertiary-foreground tabular-nums">
                    {group.tasks.length}
                  </span>
                </h2>
                {group.tasks.map((task) => (
                  <TaskContextTarget key={task.id} menu={menuFor(task)}>
                    <SplitTaskRow
                      task={task}
                      project={projectOf(task)}
                      subtasks={subsOf.get(task.id) ?? []}
                      comments={commentCounts[task.id] ?? 0}
                      active={wide && task.id === selected?.id}
                      onToggle={() =>
                        setStatus(task, task.done ? "todo" : "done")
                      }
                      onOpen={() => openTask(task.id)}
                    />
                  </TaskContextTarget>
                ))}
              </div>
            ))
          )}
        </SplitPaneScroll>
      </SplitPaneList>

      {/* The open task, as in its window: title, description, subtasks
          and comments, its details beside them. Below lg, the dialog. */}
      <SplitPaneDetail aria-label={t("myTasksTitle")} className="max-lg:hidden">
        {selected ? (
          <TaskPane
            key={`${selected.id}-${paneKey}`}
            task={selected}
            projectId={selected.project_id}
            subtasks={subsOf.get(selected.id) ?? []}
            team={data?.teams[selected.project_id] ?? []}
            viewerId={viewer.id}
            onPatch={writer.patch}
            onStatus={setStatus}
            onAddSub={addSubtask}
            onRemove={remove}
            menuFor={menuFor}
            focus={focus}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-4">
            <EmptyState
              placement="inner"
              icon={<RiCheckboxCircleLine className="size-5" />}
              title={t("myTasksPick")}
            />
          </div>
        )}
      </SplitPaneDetail>
      {dialogs}
    </SplitPane>
  )
}

type DueGroup = "overdue" | "today" | "week" | "later" | "none" | "done"
const GROUP_ORDER: DueGroup[] = [
  "overdue",
  "today",
  "week",
  "later",
  "none",
  "done",
]
const GROUP_LABEL = {
  overdue: "myTasksGroupOverdue",
  today: "myTasksGroupToday",
  week: "myTasksGroupWeek",
  later: "myTasksGroupLater",
  none: "myTasksGroupNoDue",
  done: "myTasksGroupDone",
} as const

/** Open tasks by when they're due (past due first), done ones last; the
 *  order inside a group is the list's (due date, then created). */
function groupByDue(tasks: TaskRow[]) {
  const map = new Map<DueGroup, TaskRow[]>()
  const now = new Date()
  for (const task of tasks) {
    let key: DueGroup
    if (task.done) key = "done"
    else if (!task.due_date) key = "none"
    else {
      const days = differenceInCalendarDays(
        new Date(`${task.due_date}T00:00:00`),
        now,
      )
      key =
        days < 0
          ? "overdue"
          : days === 0
            ? "today"
            : days <= 7
              ? "week"
              : "later"
    }
    map.set(key, [...(map.get(key) ?? []), task])
  }
  return GROUP_ORDER.filter((key) => map.has(key)).map((key) => ({
    key,
    tasks: map.get(key)!,
  }))
}

/**
 * One task in the split's list: the checkbox, the title, then its project,
 * due date and counts. The whole row opens it (in the pane, or the dialog
 * below lg); the open one is filled.
 */
function SplitTaskRow({
  task,
  project,
  subtasks,
  comments,
  active,
  onToggle,
  onOpen,
  ...data
}: {
  task: TaskRow
  project: MyProject | undefined
  subtasks: TaskRow[]
  comments: number
  active: boolean
  onToggle: () => void
  onOpen: () => void
  /** data-* from the <TaskContextTarget> around it (right-click menu). */
  [data: `data-${string}`]: unknown
}) {
  const t = useT("projects")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const doneSubs = subtasks.filter((s) => s.done).length
  const due = task.due_date ? new Date(`${task.due_date}T00:00:00`) : null
  const overdue =
    due && !task.done && differenceInCalendarDays(due, new Date()) < 0
  return (
    <div
      {...data}
      className={cn(
        splitPaneItemClassName(active),
        // The ring for the keyboard only (focus-within lit it on a click).
        "has-[:focus-visible]:ring-focus-ring relative items-start gap-2.5 px-3 py-2.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset",
      )}
    >
      <Checkbox
        className="relative z-10 mt-0.5"
        checked={task.done}
        onCheckedChange={onToggle}
        aria-label={task.done ? t("markUndone") : t("markDone")}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* The title is the row's button; its hit area covers the row. */}
        <button
          type="button"
          aria-current={active || undefined}
          onClick={onOpen}
          className={cn(
            "min-w-0 truncate text-left text-sm outline-none after:absolute after:inset-0 after:rounded-lg",
            task.done
              ? "text-muted-foreground line-through"
              : "text-foreground",
          )}
        >
          {task.title}
        </button>
        <span className="text-muted-foreground text-meta flex min-w-0 items-center gap-1.5">
          {project && (
            <>
              <ProjectAvatar
                id={project.id}
                name={project.name}
                className="size-3.5 shrink-0"
              />
              <span className="truncate">{project.name}</span>
            </>
          )}
          {due && (
            <span
              className={cn(
                "shrink-0 tabular-nums",
                overdue
                  ? "text-destructive-ink"
                  : isToday(due) && !task.done
                    ? "text-warning-ink"
                    : undefined,
              )}
            >
              ·{" "}
              {dueLabel(task.due_date!, dateLocale, {
                today: tc("today"),
                tomorrow: t("tomorrow"),
              })}
            </span>
          )}
          {subtasks.length > 0 && (
            <span className="shrink-0 tabular-nums">
              · {doneSubs}/{subtasks.length}
            </span>
          )}
          {comments > 0 && (
            <span
              className="flex shrink-0 items-center gap-1 tabular-nums"
              aria-label={t("commentCount", { n: comments })}
            >
              · <RiMessage3Line className="size-3.5" />
              {comments}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

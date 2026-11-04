"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { linkKey, projectHref } from "@/shared/lib/url-params"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { EmptyValue } from "@/components/empty-value"
import { PageHeader } from "@/components/page-header"
import { ProjectAvatar } from "@/components/project-avatar"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
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
import { GroupedList, listHeaderClassName } from "@/components/grouped-list"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiCheckboxCircleLine, RiMessage3Line } from "@/shared/ui/lucide-icons"
import { differenceInCalendarDays, isToday } from "date-fns"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  supabase,
  useViewer,
  type TaskRow,
  type TeamMember,
} from "../workspace/data"
import { StatusDot, TaskBoard } from "../workspace/TaskBoard"
import { TaskContextTarget, type TaskMenuConfig } from "../workspace/task-menu"
import {
  STATUS_LABEL,
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

// The task window (editor, comments) loads when a task is first opened.
const TaskDialog = dynamic(
  () => import("../workspace/TaskDialog").then((m) => m.TaskDialog),
  { loading: () => null },
)

/** The board shows each card's project, not a PIC: no team needed. */
const NO_TEAM: TeamMember[] = []

type Filter = "all" | "todo" | "done"
const ALL = "__all__"

const ROW_GRID =
  "grid grid-cols-[1.5rem_minmax(0,1fr)_5rem] items-center gap-x-4 md:grid-cols-[1.5rem_minmax(0,1fr)_12rem_9rem_7rem]"

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
  const [view, setView] = useViewMode("my-tasks", "kanban")
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

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={t("myTasksTitle")}
        actions={
          !empty && (
            <>
              <Select
                value={projectFilter}
                onValueChange={(v) => v && setProjectFilter(v)}
              >
                <SelectTrigger className="w-44">
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
              {!isMobile && (
                <ViewToggle
                  value={board ? "kanban" : "list"}
                  onValueChange={setView}
                  modes={["kanban", "list"]}
                />
              )}
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
      ) : board ? (
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
              <TaskContextTarget menu={menuFor(task)}>{card}</TaskContextTarget>
            )}
          />
        </div>
      ) : (
        <>
          <div className="border-border border-b">
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
          </div>
          <GroupedList className="pb-4 text-sm">
            <div className={cn(ROW_GRID, listHeaderClassName)}>
              <span />
              <span>{t("colTask")}</span>
              <span className="hidden md:block">{t("colProject")}</span>
              <span className="hidden md:block">{t("colStatus")}</span>
              <span>{t("factsDeadline")}</span>
            </div>
            {visible.length === 0 ? (
              <EmptyState
                placement="inner"
                icon={<RiCheckboxCircleLine className="size-5" />}
                title={
                  filter === "done"
                    ? t("tasksEmptyDone")
                    : t("myTasksEmptyTodo")
                }
              />
            ) : (
              visible.map((task) => (
                <TaskContextTarget key={task.id} menu={menuFor(task)}>
                  <MyTaskRow
                    task={task}
                    project={projectOf(task)}
                    subtasks={subsOf.get(task.id) ?? []}
                    comments={commentCounts[task.id] ?? 0}
                    onToggle={() =>
                      setStatus(task, task.done ? "todo" : "done")
                    }
                    onOpen={() => openTask(task.id)}
                  />
                </TaskContextTarget>
              ))
            )}
          </GroupedList>
        </>
      )}

      {/* Mounted from the first open on (openId stays set after). */}
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
    </div>
  )
}

function MyTaskRow({
  task,
  project,
  subtasks,
  comments,
  onToggle,
  onOpen,
  ...data
}: {
  task: TaskRow
  project: MyProject | undefined
  subtasks: TaskRow[]
  comments: number
  onToggle: () => void
  onOpen: () => void
  /** data-* from the <TaskContextTarget> around it (right-click menu). */
  [data: `data-${string}`]: unknown
}) {
  const t = useT("projects")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const status = statusOf(task)
  const doneSubs = subtasks.filter((s) => s.done).length
  const due = task.due_date ? new Date(`${task.due_date}T00:00:00`) : null
  const overdue =
    due && !task.done && differenceInCalendarDays(due, new Date()) < 0

  return (
    <div
      {...data}
      data-slot="list-row"
      className={cn(
        ROW_GRID,
        "group/task gutter-x relative min-h-12 py-2 text-sm max-md:min-h-14",
      )}
    >
      <Checkbox
        className="relative z-10"
        checked={task.done}
        onCheckedChange={onToggle}
        aria-label={task.done ? t("markUndone") : t("markDone")}
      />
      <div className="flex min-w-0 flex-col">
        <div className="flex min-w-0 items-center gap-2">
          {/* On a phone the whole row opens the task. */}
          <button
            type="button"
            onClick={onOpen}
            className={cn(
              "min-w-0 truncate text-left hover:underline max-md:after:absolute max-md:after:inset-0",
              task.done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </button>
          {subtasks.length > 0 && (
            <span className="text-muted-foreground text-meta shrink-0 tabular-nums">
              {doneSubs}/{subtasks.length}
            </span>
          )}
          {comments > 0 && (
            <span
              className="text-muted-foreground text-meta flex shrink-0 items-center gap-1 tabular-nums"
              aria-label={t("commentCount", { n: comments })}
            >
              <RiMessage3Line className="size-3.5" />
              {comments}
            </span>
          )}
        </div>
        {/* Project and status get their own columns from md up. */}
        {project && (
          <span className="text-muted-foreground text-meta flex min-w-0 items-center gap-1.5 md:hidden">
            <StatusDot status={status} />
            <span className="truncate">{project.name}</span>
          </span>
        )}
      </div>
      <div className="hidden min-w-0 md:block">
        {project && (
          <Link
            href={projectHref(project, "tasks")}
            className="text-muted-foreground hover:text-foreground text-meta flex min-w-0 items-center gap-1.5"
          >
            <ProjectAvatar
              id={project.id}
              name={project.name}
              className="size-4 shrink-0 rounded-[4px]"
            />
            <span className="truncate">{project.name}</span>
          </Link>
        )}
      </div>
      <span className="text-muted-foreground text-meta hidden items-center gap-1.5 md:flex">
        <StatusDot status={status} />
        {t(STATUS_LABEL[status])}
      </span>
      <span
        className={cn(
          "text-meta tabular-nums",
          due
            ? overdue
              ? "text-destructive-ink"
              : isToday(due) && !task.done
                ? "text-warning-ink"
                : "text-foreground"
            : "text-muted-foreground",
        )}
      >
        {due ? (
          dueLabel(task.due_date!, dateLocale, {
            today: tc("today"),
            tomorrow: t("tomorrow"),
          })
        ) : (
          <EmptyValue />
        )}
      </span>
    </div>
  )
}
